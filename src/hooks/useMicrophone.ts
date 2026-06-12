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
      errorMessage: "麦克风启动失败。请检查浏览器权限后重试。",
    };
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return {
      status: "denied",
      errorMessage:
        "麦克风权限被阻止。请在 Safari 设置中允许麦克风访问后重试。",
    };
  }

  if (error.name === "NotFoundError") {
    return {
      status: "unavailable",
      errorMessage: "当前设备没有可用麦克风。",
    };
  }

  return {
    status: "error",
    errorMessage: "麦克风启动失败。请刷新页面，或关闭其他录音应用后重试。",
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
        errorMessage: "当前浏览器不支持麦克风访问。",
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
