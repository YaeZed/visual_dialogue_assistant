import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SpeechSynthesisStatus = "idle" | "speaking" | "unsupported" | "error";

interface SpeechSynthesisState {
  status: SpeechSynthesisStatus;
  captionText: string;
  errorMessage: string | null;
}

const initialState: SpeechSynthesisState = {
  status: "idle",
  captionText: "",
  errorMessage: null,
};

const captionMaxLength = 110;
const sentenceBoundaries = ["。", "！", "？", ".", "!", "?", "\n"];

function isChineseText(text: string) {
  return /[\u4e00-\u9fff]/.test(text);
}

function getSpeechErrorMessage(error: string) {
  if (error === "not-allowed") {
    return "Speech playback is blocked. Tap play to try again.";
  }

  if (error === "interrupted" || error === "canceled") {
    return null;
  }

  return "Speech playback failed. Try replaying the answer.";
}

function findPreviousBoundary(text: string, charIndex: number) {
  return sentenceBoundaries.reduce((best, boundary) => {
    const next = text.lastIndexOf(boundary, Math.max(charIndex - 1, 0));
    return next > best ? next : best;
  }, -1);
}

function findNextBoundary(text: string, charIndex: number) {
  return sentenceBoundaries.reduce((best, boundary) => {
    const next = text.indexOf(boundary, charIndex);
    if (next === -1) {
      return best;
    }

    return best === -1 || next < best ? next : best;
  }, -1);
}

function getCaptionSegment(text: string, charIndex: number) {
  const safeIndex = Math.min(Math.max(charIndex, 0), text.length);
  const previousBoundary = findPreviousBoundary(text, safeIndex);
  const nextBoundary = findNextBoundary(text, safeIndex);
  const start = previousBoundary === -1 ? 0 : previousBoundary + 1;
  const end = nextBoundary === -1 ? text.length : nextBoundary + 1;
  const sentence = text.slice(start, end).replace(/\s+/g, " ").trim();

  if (sentence.length <= captionMaxLength) {
    return sentence;
  }

  const focusedStart = Math.max(0, Math.min(sentence.length - captionMaxLength, safeIndex - start - 32));
  return `${sentence.slice(focusedStart, focusedStart + captionMaxLength).trim()}...`;
}

export function useSpeechSynthesis() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [state, setState] = useState<SpeechSynthesisState>(initialState);
  const isSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined",
    [],
  );

  const stop = useCallback(() => {
    if (!isSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setState(initialState);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      const nextText = text.trim();

      if (!nextText) {
        return;
      }

      if (!isSupported) {
        setState({
          status: "unsupported",
          captionText: "",
          errorMessage: "Speech synthesis is not supported in this browser.",
        });
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(nextText);
      utterance.lang = isChineseText(nextText) ? "zh-CN" : "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        if (utteranceRef.current !== utterance) {
          return;
        }

        setState({
          status: "speaking",
          captionText: getCaptionSegment(nextText, 0),
          errorMessage: null,
        });
      };

      utterance.onboundary = (event) => {
        if (utteranceRef.current !== utterance) {
          return;
        }

        setState((current) => ({
          ...current,
          captionText: getCaptionSegment(nextText, event.charIndex),
        }));
      };

      utterance.onerror = (event) => {
        if (utteranceRef.current !== utterance) {
          return;
        }

        const errorMessage = getSpeechErrorMessage(event.error);

        utteranceRef.current = null;
        setState({
          status: errorMessage ? "error" : "idle",
          captionText: "",
          errorMessage,
        });
      };

      utterance.onend = () => {
        if (utteranceRef.current !== utterance) {
          return;
        }

        utteranceRef.current = null;
        setState(initialState);
      };

      utteranceRef.current = utterance;
      setState({
        status: "speaking",
        captionText: getCaptionSegment(nextText, 0),
        errorMessage: null,
      });
      window.speechSynthesis.speak(utterance);
    },
    [isSupported],
  );

  useEffect(() => stop, [stop]);

  return {
    ...state,
    isSupported,
    isSpeaking: state.status === "speaking",
    speak,
    stop,
  };
}
