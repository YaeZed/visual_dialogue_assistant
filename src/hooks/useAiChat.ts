import { useCallback, useRef, useState } from "react";
import { AiApiError, createVisionChatCompletion } from "@/lib/api";

export type AiChatStatus = "idle" | "thinking" | "ready" | "error";

interface AiChatState {
  status: AiChatStatus;
  answer: string;
  model: string | null;
  errorMessage: string | null;
}

interface AskVisionQuestionInput {
  apiKey: string;
  prompt: string;
  imageDataUrl: string;
}

const initialState: AiChatState = {
  status: "idle",
  answer: "",
  model: null,
  errorMessage: null,
};

function getAiErrorMessage(error: unknown) {
  if (error instanceof AiApiError) {
    return error.message;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return "AI request was cancelled.";
  }

  return "AI request failed. Check the network and retry.";
}

export function useAiChat() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [chatState, setChatState] = useState<AiChatState>(initialState);

  const askVisionQuestion = useCallback(
    async ({ apiKey, prompt, imageDataUrl }: AskVisionQuestionInput) => {
      abortControllerRef.current?.abort();

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setChatState((current) => ({
        ...current,
        status: "thinking",
        errorMessage: null,
      }));

      try {
        const result = await createVisionChatCompletion({
          apiKey,
          prompt,
          imageDataUrl,
          signal: abortController.signal,
        });

        setChatState({
          status: "ready",
          answer: result.content,
          model: result.model,
          errorMessage: null,
        });

        return result;
      } catch (error) {
        setChatState((current) => ({
          ...current,
          status: "error",
          errorMessage: getAiErrorMessage(error),
        }));
        return null;
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [],
  );

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setChatState((current) => ({
      ...current,
      status: "idle",
      errorMessage: null,
    }));
  }, []);

  const clearAnswer = useCallback(() => setChatState(initialState), []);

  return {
    ...chatState,
    isThinking: chatState.status === "thinking",
    askVisionQuestion,
    cancelRequest,
    clearAnswer,
  };
}

