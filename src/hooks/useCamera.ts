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
      errorMessage: "Camera failed to start. Check browser permissions and retry.",
    };
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return {
      status: "denied",
      errorMessage: "Camera permission was blocked. Enable camera access in Safari settings and retry.",
    };
  }

  if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
    return {
      status: "unavailable",
      errorMessage: "No available camera was found on this device.",
    };
  }

  return {
    status: "error",
    errorMessage: "Camera failed to start. Refresh the page or retry after closing other camera apps.",
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
        errorMessage: "This browser does not support camera access.",
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

  useEffect(() => stopCamera, [stopCamera]);

  return {
    videoRef,
    stream: streamRef.current,
    status: cameraState.status,
    errorMessage: cameraState.errorMessage,
    isReady: cameraState.status === "ready",
    startCamera,
    stopCamera,
  };
}

