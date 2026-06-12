import { useCallback, useRef, useState } from "react";
import { AiApiError, createVisionChatCompletion } from "@/lib/api";

export type AiChatStatus = "idle" | "thinking" | "ready" | "error";

export interface AiConversationTurn {
  id: string;
  question: string;
  answer: string;
  model: string;
  createdAt: string;
}

interface AiChatState {
  status: AiChatStatus;
  answer: string;
  model: string | null;
  errorMessage: string | null;
  turns: AiConversationTurn[];
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
  turns: [],
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
          history: chatState.turns.map((turn) => ({
            question: turn.question,
            answer: turn.answer,
          })),
          signal: abortController.signal,
        });

        const nextTurn: AiConversationTurn = {
          id: crypto.randomUUID(),
          question: prompt.trim(),
          answer: result.content,
          model: result.model,
          createdAt: new Date().toISOString(),
        };

        setChatState((current) => ({
          status: "ready",
          answer: result.content,
          model: result.model,
          errorMessage: null,
          turns: [...current.turns, nextTurn],
        }));

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
    [chatState.turns],
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

  const clearContext = useCallback(() => {
    setChatState((current) => ({
      ...current,
      turns: [],
    }));
  }, []);

  return {
    ...chatState,
    isThinking: chatState.status === "thinking",
    askVisionQuestion,
    cancelRequest,
    clearAnswer,
    clearContext,
  };
}
