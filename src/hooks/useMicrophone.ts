import { useCallback, useEffect, useRef, useState } from "react";

export type MicrophoneStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unavailable"
  | "error";

interface MicrophoneState {
  status: MicrophoneStatus;
  errorMessage: string | null;
}

const initialState: MicrophoneState = {
  status: "idle",
  errorMessage: null,
};

function getMicrophoneError(error: unknown): MicrophoneState {
  if (!(error instanceof DOMException)) {
    return {
      status: "error",
      errorMessage: "Microphone failed to start. Check browser permissions and retry.",
    };
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return {
      status: "denied",
      errorMessage:
        "Microphone permission was blocked. Enable microphone access in Safari settings and retry.",
    };
  }

  if (error.name === "NotFoundError") {
    return {
      status: "unavailable",
      errorMessage: "No available microphone was found on this device.",
    };
  }

  return {
    status: "error",
    errorMessage: "Microphone failed to start. Refresh the page or close other recording apps.",
  };
}

export function useMicrophone() {
  const streamRef = useRef<MediaStream | null>(null);
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>(initialState);

  const stopMicrophone = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setMicrophoneState(initialState);
  }, []);

  const startMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophoneState({
        status: "unavailable",
        errorMessage: "This browser does not support microphone access.",
      });
      return;
    }

    setMicrophoneState({ status: "requesting", errorMessage: null });

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      streamRef.current = stream;
      setMicrophoneState({ status: "ready", errorMessage: null });
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setMicrophoneState(getMicrophoneError(error));
    }
  }, []);

  useEffect(() => stopMicrophone, [stopMicrophone]);

  return {
    stream: streamRef.current,
    status: microphoneState.status,
    errorMessage: microphoneState.errorMessage,
    isReady: microphoneState.status === "ready",
    startMicrophone,
    stopMicrophone,
  };
}

