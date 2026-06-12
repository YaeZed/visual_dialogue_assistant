const DEFAULT_API_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = "qwen-vl-plus";
const MAX_CONTEXT_TURNS = 4;

type ChatRole = "system" | "user" | "assistant";

interface TextContentPart {
  type: "text";
  text: string;
}

interface ImageContentPart {
  type: "image_url";
  image_url: {
    url: string;
  };
}

type ChatContentPart = TextContentPart | ImageContentPart;

interface ChatMessage {
  role: ChatRole;
  content: string | ChatContentPart[];
}

interface ChatCompletionRequestBody {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
  };
}

export interface VisionChatRequest {
  apiKey: string;
  prompt: string;
  imageDataUrl: string;
  history?: ConversationContextTurn[];
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface VisionChatResult {
  content: string;
  model: string;
}

export interface ConversationContextTurn {
  question: string;
  answer: string;
}

export class AiApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AiApiError";
    this.status = status;
  }
}

function getEnvValue(name: string) {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function getChatCompletionsUrl(baseUrl: string) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return normalizedBaseUrl.endsWith("/v1")
    ? `${normalizedBaseUrl}/chat/completions`
    : `${normalizedBaseUrl}/v1/chat/completions`;
}

function clampText(text: string, maxLength: number) {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  return normalizedText.length > maxLength
    ? `${normalizedText.slice(0, maxLength - 1)}…`
    : normalizedText;
}

function buildContextMessages(history: ConversationContextTurn[] = []): ChatMessage[] {
  return history.slice(-MAX_CONTEXT_TURNS).flatMap((turn) => [
    {
      role: "user" as const,
      content: clampText(turn.question, 700),
    },
    {
      role: "assistant" as const,
      content: clampText(turn.answer, 900),
    },
  ]);
}

function buildVisionMessages(
  prompt: string,
  imageDataUrl: string,
  history: ConversationContextTurn[] = [],
): ChatMessage[] {
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
          text: prompt,
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

async function parseErrorResponse(response: Response) {
  const statusHint =
    response.status === 400
      ? "请求格式或模型参数不被接口接受。"
      : response.status === 401
        ? "API 密钥无效或已过期。"
        : response.status === 403
          ? "API 密钥没有权限，或当前模型未开通。"
          : response.status === 429
            ? "请求过于频繁或额度不足。"
            : response.status >= 500
              ? "模型服务暂时不可用。"
              : "接口返回异常。";

  try {
    const body = (await response.json()) as ChatCompletionResponse;
    return `AI 请求失败（HTTP ${response.status}）：${body.error?.message ?? statusHint}`;
  } catch {
    return `AI 请求失败（HTTP ${response.status}）：${statusHint}`;
  }
}

export function getAiDefaults() {
  return {
    baseUrl: getEnvValue("VITE_AI_API_BASE_URL") ?? DEFAULT_API_BASE_URL,
    model: getEnvValue("VITE_AI_MODEL") ?? DEFAULT_MODEL,
  };
}

export async function createVisionChatCompletion({
  apiKey,
  prompt,
  imageDataUrl,
  history,
  baseUrl = getAiDefaults().baseUrl,
  model = getAiDefaults().model,
  maxTokens = 300,
  signal,
}: VisionChatRequest): Promise<VisionChatResult> {
  if (!apiKey.trim()) {
    throw new AiApiError("缺少 API 密钥。请先输入本次会话要使用的密钥。");
  }

  if (!prompt.trim()) {
    throw new AiApiError("缺少问题。请先语音输入或准备一个视觉问题。");
  }

  if (!imageDataUrl.startsWith("data:image/")) {
    throw new AiApiError("缺少画面帧。请先抓取一帧摄像头画面。");
  }

  const body: ChatCompletionRequestBody = {
    model,
    messages: buildVisionMessages(prompt.trim(), imageDataUrl, history),
    temperature: 0.3,
    max_tokens: maxTokens,
  };

  const response = await fetch(getChatCompletionsUrl(baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new AiApiError(await parseErrorResponse(response), response.status);
  }

  const result = (await response.json()) as ChatCompletionResponse;
  const content = result.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AiApiError("AI 返回为空。请换一个更清晰的画面或问题后重试。");
  }

  return {
    content,
    model,
  };
}
