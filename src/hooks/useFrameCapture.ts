import { useCallback, useState } from "react";

export type FrameCaptureStatus = "idle" | "capturing" | "ready" | "error";

export interface CapturedFrame {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  sizeKb: number;
  capturedAt: string;
}

interface FrameCaptureState {
  status: FrameCaptureStatus;
  frame: CapturedFrame | null;
  errorMessage: string | null;
}

const initialState: FrameCaptureState = {
  status: "idle",
  frame: null,
  errorMessage: null,
};

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas did not produce an image."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

export function useFrameCapture() {
  const [frameState, setFrameState] = useState<FrameCaptureState>(initialState);

  const captureFrame = useCallback(async (video: HTMLVideoElement | null, quality = 0.62) => {
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setFrameState({
        status: "error",
        frame: null,
        errorMessage: "Camera frame is not ready yet. Start the camera and retry.",
      });
      return null;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setFrameState({
        status: "error",
        frame: null,
        errorMessage: "Camera frame has no dimensions yet. Wait a moment and retry.",
      });
      return null;
    }

    setFrameState((current) => ({ ...current, status: "capturing", errorMessage: null }));

    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas rendering context is unavailable.");
      }

      context.drawImage(video, 0, 0, width, height);

      const blob = await canvasToJpegBlob(canvas, quality);
      const dataUrl = await blobToDataUrl(blob);
      const frame: CapturedFrame = {
        blob,
        dataUrl,
        width,
        height,
        sizeKb: Math.round((blob.size / 1024) * 10) / 10,
        capturedAt: new Date().toISOString(),
      };

      setFrameState({ status: "ready", frame, errorMessage: null });
      return frame;
    } catch {
      setFrameState({
        status: "error",
        frame: null,
        errorMessage: "Frame capture failed. Refresh the camera and retry.",
      });
      return null;
    }
  }, []);

  const clearFrame = useCallback(() => setFrameState(initialState), []);

  return {
    ...frameState,
    captureFrame,
    clearFrame,
  };
}

