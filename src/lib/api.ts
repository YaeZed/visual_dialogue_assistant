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
  try {
    const body = (await response.json()) as ChatCompletionResponse;
    return body.error?.message ?? `AI request failed with status ${response.status}.`;
  } catch {
    return `AI request failed with status ${response.status}.`;
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
    throw new AiApiError("Missing API key. Enter a key for this session before asking AI.");
  }

  if (!prompt.trim()) {
    throw new AiApiError("Missing question. Speak or type a question before asking AI.");
  }

  if (!imageDataUrl.startsWith("data:image/")) {
    throw new AiApiError("Missing image frame. Capture a camera frame before asking AI.");
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
    throw new AiApiError("AI response was empty. Retry with a clearer image or question.");
  }

  return {
    content,
    model,
  };
}
