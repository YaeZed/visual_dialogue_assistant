import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechRecognitionStatus =
  | "unsupported"
  | "idle"
  | "listening"
  | "stopping"
  | "error";

interface SpeechRecognitionState {
  status: SpeechRecognitionStatus;
  transcript: string;
  interimTranscript: string;
  errorMessage: string | null;
}

const SpeechRecognitionApi =
  typeof window !== "undefined"
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : undefined;

const initialState: SpeechRecognitionState = {
  status: SpeechRecognitionApi ? "idle" : "unsupported",
  transcript: "",
  interimTranscript: "",
  errorMessage: SpeechRecognitionApi ? null : "当前浏览器不支持语音识别。",
};

function getSpeechErrorMessage(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "语音识别被阻止。请允许麦克风和语音识别权限后重试。";
  }

  if (error === "no-speech") {
    return "没有检测到语音。请靠近麦克风后重试。";
  }

  if (error === "audio-capture") {
    return "没有采集到麦克风声音。请检查麦克风权限后重试。";
  }

  if (error === "network") {
    return "语音识别网络服务失败。请检查网络后重试。";
  }

  return "语音识别意外停止。请重试。";
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const [speechState, setSpeechState] = useState<SpeechRecognitionState>(initialState);

  useEffect(() => {
    if (!SpeechRecognitionApi) {
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setSpeechState((current) => ({
        ...current,
        status: "listening",
        transcript: finalTranscript
          ? `${current.transcript}${finalTranscript}`.trim()
          : current.transcript,
        interimTranscript,
        errorMessage: null,
      }));
    };

    recognition.onerror = (event) => {
      shouldListenRef.current = false;
      setSpeechState((current) => ({
        ...current,
        status: "error",
        interimTranscript: "",
        errorMessage: getSpeechErrorMessage(event.error),
      }));
    };

    recognition.onend = () => {
      setSpeechState((current) => ({
        ...current,
        status: shouldListenRef.current ? "listening" : "idle",
        interimTranscript: "",
      }));

      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          shouldListenRef.current = false;
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setSpeechState({
        ...initialState,
        status: "unsupported",
        errorMessage: "当前浏览器不支持语音识别。",
      });
      return;
    }

    shouldListenRef.current = true;
    setSpeechState((current) => ({
      ...current,
      status: "listening",
      errorMessage: null,
      interimTranscript: "",
    }));

    try {
      recognitionRef.current.start();
    } catch {
      // Safari can throw if recognition is already active.
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    setSpeechState((current) => ({
      ...current,
      status: "stopping",
      interimTranscript: "",
    }));
    recognitionRef.current?.stop();
  }, []);

  const clearTranscript = useCallback(() => {
    setSpeechState((current) => ({
      ...current,
      transcript: "",
      interimTranscript: "",
    }));
  }, []);

  return {
    ...speechState,
    isSupported: speechState.status !== "unsupported",
    isListening: speechState.status === "listening",
    startListening,
    stopListening,
    clearTranscript,
  };
}
