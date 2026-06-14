import { useCallback, useState } from "react";

export type FrameCaptureStatus = "idle" | "capturing" | "ready" | "error";
export type FrameCaptureMode = "low" | "high";

export interface CapturedFrame {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  sizeKb: number;
  capturedAt: string;
  mode: FrameCaptureMode;
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

const compressionPresets = {
  low: {
    targetFrameSizeKb: 40,
    attempts: [
      { maxLongEdge: 1280, quality: 0.5 },
      { maxLongEdge: 1280, quality: 0.45 },
      { maxLongEdge: 960, quality: 0.45 },
      { maxLongEdge: 960, quality: 0.4 },
      { maxLongEdge: 720, quality: 0.4 },
    ],
  },
  high: {
    targetFrameSizeKb: 120,
    attempts: [
      { maxLongEdge: 1600, quality: 0.72 },
      { maxLongEdge: 1600, quality: 0.64 },
      { maxLongEdge: 1280, quality: 0.64 },
      { maxLongEdge: 1280, quality: 0.56 },
      { maxLongEdge: 960, quality: 0.56 },
    ],
  },
} satisfies Record<
  FrameCaptureMode,
  {
    targetFrameSizeKb: number;
    attempts: Array<{ maxLongEdge: number; quality: number }>;
  }
>;

interface CompressionResult {
  blob: Blob;
  width: number;
  height: number;
}

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

function getScaledFrameSize(width: number, height: number, maxLongEdge: number) {
  const longEdge = Math.max(width, height);

  if (longEdge <= maxLongEdge) {
    return { width, height };
  }

  const scale = maxLongEdge / longEdge;

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function drawVideoFrame(video: HTMLVideoElement, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("画布渲染上下文不可用。");
  }

  context.drawImage(video, 0, 0, width, height);

  return canvas;
}

async function compressVideoFrame(
  video: HTMLVideoElement,
  sourceWidth: number,
  sourceHeight: number,
  mode: FrameCaptureMode,
) {
  const preset = compressionPresets[mode];
  let smallestResult: CompressionResult | null = null;

  for (const attempt of preset.attempts) {
    const { width, height } = getScaledFrameSize(sourceWidth, sourceHeight, attempt.maxLongEdge);
    const canvas = drawVideoFrame(video, width, height);
    const blob = await canvasToJpegBlob(canvas, attempt.quality);
    const result = { blob, width, height };

    if (!smallestResult || blob.size < smallestResult.blob.size) {
      smallestResult = result;
    }

    if (blob.size <= preset.targetFrameSizeKb * 1024) {
      return result;
    }
  }

  if (!smallestResult) {
    throw new Error("画布没有生成图片。");
  }

  return smallestResult;
}

export function useFrameCapture() {
  const [frameState, setFrameState] = useState<FrameCaptureState>(initialState);

  const captureFrame = useCallback(async (
    video: HTMLVideoElement | null,
    mode: FrameCaptureMode = "low",
  ) => {
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
      const compressedFrame = await compressVideoFrame(video, width, height, mode);
      const blob = compressedFrame.blob;
      const dataUrl = await blobToDataUrl(blob);
      const frame: CapturedFrame = {
        blob,
        dataUrl,
        width: compressedFrame.width,
        height: compressedFrame.height,
        sizeKb: Math.round((blob.size / 1024) * 10) / 10,
        capturedAt: new Date().toISOString(),
        mode,
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
