import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unavailable"
  | "error";

interface CameraState {
  status: CameraStatus;
  errorMessage: string | null;
}

const initialState: CameraState = {
  status: "idle",
  errorMessage: null,
};

function getCameraError(error: unknown): CameraState {
  if (!(error instanceof DOMException)) {
    return {
      status: "error",
      errorMessage: "摄像头启动失败。请检查浏览器权限后重试。",
    };
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return {
      status: "denied",
      errorMessage: "摄像头权限被阻止。请在 Safari 设置中允许摄像头访问后重试。",
    };
  }

  if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
    return {
      status: "unavailable",
      errorMessage: "当前设备没有可用摄像头。",
    };
  }

  return {
    status: "error",
    errorMessage: "摄像头启动失败。请刷新页面，或关闭其他正在使用摄像头的应用后重试。",
  };
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>(initialState);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraState(initialState);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState({
        status: "unavailable",
        errorMessage: "当前浏览器不支持摄像头访问。",
      });
      return;
    }

    setCameraState({ status: "requesting", errorMessage: null });

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState({ status: "ready", errorMessage: null });
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraState(getCameraError(error));
    }
  }, []);

  const getVideoElement = useCallback(() => videoRef.current, []);

  useEffect(() => stopCamera, [stopCamera]);

  return {
    videoRef,
    stream: streamRef.current,
    status: cameraState.status,
    errorMessage: cameraState.errorMessage,
    isReady: cameraState.status === "ready",
    startCamera,
    stopCamera,
    getVideoElement,
  };
}
