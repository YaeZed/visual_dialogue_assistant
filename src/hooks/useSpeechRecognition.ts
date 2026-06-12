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
  errorMessage: SpeechRecognitionApi ? null : "Speech recognition is not supported in this browser.",
};

function getSpeechErrorMessage(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Speech recognition was blocked. Enable microphone and speech recognition permissions.";
  }

  if (error === "no-speech") {
    return "No speech was detected. Try again closer to the microphone.";
  }

  if (error === "audio-capture") {
    return "No microphone audio was captured. Check microphone access and retry.";
  }

  if (error === "network") {
    return "Speech recognition network service failed. Check the connection and retry.";
  }

  return "Speech recognition stopped unexpectedly. Try again.";
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
        errorMessage: "Speech recognition is not supported in this browser.",
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

