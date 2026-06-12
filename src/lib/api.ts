const DEFAULT_API_BASE_URL = "https://api.icodeeasy.cc";
const DEFAULT_MODEL = "gemini-3.1-flash";

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
  max_completion_tokens?: number;
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
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface VisionChatResult {
  content: string;
  model: string;
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

function buildVisionMessages(prompt: string, imageDataUrl: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "You are a concise visual dialogue assistant. Answer in the user's language and focus on what is visible in the image.",
    },
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
    messages: buildVisionMessages(prompt.trim(), imageDataUrl),
    temperature: 0.3,
    max_completion_tokens: maxTokens,
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

