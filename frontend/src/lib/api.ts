const VISION_CHAT_ENDPOINT = "/api/vision-chat";

export interface VisionChatRequest {
  prompt: string;
  imageDataUrl: string;
  history?: ConversationContextTurn[];
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

interface VisionChatErrorResponse {
  error?: {
    message?: string;
  };
}

export class AiApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AiApiError";
    this.status = status;
  }
}

async function parseErrorResponse(response: Response) {
  try {
    const body = (await response.json()) as VisionChatErrorResponse;
    return body.error?.message ?? `AI 请求失败（HTTP ${response.status}）。`;
  } catch {
    return `AI 请求失败（HTTP ${response.status}）。`;
  }
}

export async function createVisionChatCompletion({
  prompt,
  imageDataUrl,
  history,
  signal,
}: VisionChatRequest): Promise<VisionChatResult> {
  if (!prompt.trim()) {
    throw new AiApiError("缺少问题。请先语音输入或准备一个视觉问题。");
  }

  if (!imageDataUrl.startsWith("data:image/")) {
    throw new AiApiError("缺少画面帧。请先抓取一帧摄像头画面。");
  }

  const response = await fetch(VISION_CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      imageDataUrl,
      history,
    }),
    signal,
  });

  if (!response.ok) {
    throw new AiApiError(await parseErrorResponse(response), response.status);
  }

  return (await response.json()) as VisionChatResult;
}
