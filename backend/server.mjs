import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_API_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = "qwen-vl-plus";
const MAX_CONTEXT_TURNS = 4;
const MAX_BODY_BYTES = 8 * 1024 * 1024;

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

loadDotEnv(path.join(rootDir, ".env"));

const serverConfig = {
  host: process.env.BACKEND_HOST?.trim() || "127.0.0.1",
  port: Number(process.env.BACKEND_PORT || 8787),
  apiKey: process.env.AI_API_KEY?.trim() || "",
  apiBaseUrl: process.env.AI_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
  model: process.env.AI_MODEL?.trim() || DEFAULT_MODEL,
};

function loadDotEnv(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function getChatCompletionsUrl(baseUrl) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return normalizedBaseUrl.endsWith("/v1")
    ? `${normalizedBaseUrl}/chat/completions`
    : `${normalizedBaseUrl}/v1/chat/completions`;
}

function clampText(text, maxLength) {
  const normalizedText = String(text ?? "").replace(/\s+/g, " ").trim();
  return normalizedText.length > maxLength
    ? `${normalizedText.slice(0, maxLength - 1)}...`
    : normalizedText;
}

function buildContextMessages(history = []) {
  return history
    .filter((turn) => typeof turn?.question === "string" && typeof turn?.answer === "string")
    .slice(-MAX_CONTEXT_TURNS)
    .flatMap((turn) => [
      {
        role: "user",
        content: clampText(turn.question, 700),
      },
      {
        role: "assistant",
        content: clampText(turn.answer, 900),
      },
    ]);
}

function buildVisionMessages({ prompt, imageDataUrl, history }) {
  return [
    {
      role: "system",
      content:
        "You are a concise visual dialogue assistant. Answer in the user's language. Use the current image as the source of truth, and use prior text context only when it helps resolve the user's intent.",
    },
    ...buildContextMessages(history),
    {
      role: "user",
      content: [
        {
          type: "text",
          text: prompt.trim(),
        },
        {
          type: "image_url",
          image_url: {
            url: imageDataUrl,
          },
        },
      ],
    },
  ];
}

function getStatusHint(status) {
  if (status === 400) {
    return "请求格式或模型参数不被接口接受。";
  }

  if (status === 401) {
    return "API 密钥无效或已过期。";
  }

  if (status === 403) {
    return "API 密钥没有权限，或当前模型未开通。";
  }

  if (status === 429) {
    return "请求过于频繁或额度不足。";
  }

  if (status >= 500) {
    return "模型服务暂时不可用。";
  }

  return "接口返回异常。";
}

async function readJsonBody(request) {
  let body = "";
  let bodyBytes = 0;

  for await (const chunk of request) {
    bodyBytes += chunk.length;

    if (bodyBytes > MAX_BODY_BYTES) {
      throw Object.assign(new Error("请求体过大。请重新抓取较小画面后重试。"), {
        statusCode: 413,
      });
    }

    body += chunk;
  }

  try {
    return JSON.parse(body || "{}");
  } catch {
    throw Object.assign(new Error("请求体不是合法 JSON。"), {
      statusCode: 400,
    });
  }
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function validateVisionRequest(payload) {
  const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
  const imageDataUrl = typeof payload.imageDataUrl === "string" ? payload.imageDataUrl : "";
  const history = Array.isArray(payload.history) ? payload.history : [];

  if (!prompt) {
    throw Object.assign(new Error("缺少问题。请先语音输入或准备一个视觉问题。"), {
      statusCode: 400,
    });
  }

  if (!imageDataUrl.startsWith("data:image/")) {
    throw Object.assign(new Error("缺少画面帧。请先抓取一帧摄像头画面。"), {
      statusCode: 400,
    });
  }

  return { prompt, imageDataUrl, history };
}

async function handleVisionChat(request, response) {
  if (!serverConfig.apiKey) {
    writeJson(response, 500, {
      error: {
        message: "后端缺少 AI_API_KEY。请在 .env 中配置后重启 npm run dev。",
      },
    });
    return;
  }

  const payload = validateVisionRequest(await readJsonBody(request));
  const providerResponse = await fetch(getChatCompletionsUrl(serverConfig.apiBaseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serverConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: serverConfig.model,
      messages: buildVisionMessages(payload),
      temperature: 0.3,
      max_tokens: 300,
    }),
  });

  if (!providerResponse.ok) {
    let providerMessage = getStatusHint(providerResponse.status);

    try {
      const body = await providerResponse.json();
      providerMessage = body?.error?.message || providerMessage;
    } catch {
      // Keep the status hint when the provider does not return JSON.
    }

    writeJson(response, providerResponse.status, {
      error: {
        message: `AI 请求失败（HTTP ${providerResponse.status}）：${providerMessage}`,
      },
    });
    return;
  }

  const result = await providerResponse.json();
  const content = result?.choices?.[0]?.message?.content?.trim();

  if (!content) {
    writeJson(response, 502, {
      error: {
        message: "AI 返回为空。请换一个更清晰的画面或问题后重试。",
      },
    });
    return;
  }

  writeJson(response, 200, {
    content,
    model: serverConfig.model,
  });
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "GET" && url.pathname === "/api/health") {
      writeJson(response, 200, {
        ok: true,
        model: serverConfig.model,
        providerConfigured: Boolean(serverConfig.apiKey),
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/vision-chat") {
      await handleVisionChat(request, response);
      return;
    }

    writeJson(response, 404, {
      error: {
        message: "接口不存在。",
      },
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode || 500);
    const message =
      error instanceof Error ? error.message : "后端处理请求失败。请检查服务日志后重试。";

    writeJson(response, statusCode, {
      error: {
        message,
      },
    });
  }
});

server.listen(serverConfig.port, serverConfig.host, () => {
  console.log(
    `Backend proxy listening on http://${serverConfig.host}:${serverConfig.port} using ${serverConfig.model}`,
  );
});
