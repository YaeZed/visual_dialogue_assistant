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
          reject(new Error("画布没有生成图片。"));
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
        errorMessage: "摄像头画面还没准备好。请先开启摄像头后重试。",
      });
      return null;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setFrameState({
        status: "error",
        frame: null,
        errorMessage: "摄像头画面尺寸还没准备好。请稍等片刻后重试。",
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
        throw new Error("画布渲染上下文不可用。");
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
        errorMessage: "抓取画面失败。请刷新摄像头后重试。",
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
