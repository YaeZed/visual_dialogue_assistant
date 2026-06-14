import { Camera, Image, Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileActionBarProps {
  canAskAi: boolean;
  canCaptureFrame: boolean;
  cameraAction: string;
  isCameraBusy: boolean;
  isCameraReady: boolean;
  isListening: boolean;
  isThinking: boolean;
  isSpeechReady: boolean;
  isVoiceBusy: boolean;
  voiceAction: string;
  onAskAi: () => void;
  onCaptureFrame: () => void;
  onStartCamera: () => void;
  onVoiceToggle: () => void;
}

export function MobileActionBar({
  canAskAi,
  canCaptureFrame,
  cameraAction,
  isCameraBusy,
  isCameraReady,
  isListening,
  isThinking,
  isSpeechReady,
  onAskAi,
  onCaptureFrame,
  onStartCamera,
  onVoiceToggle,
  isVoiceBusy,
  voiceAction,
}: MobileActionBarProps) {
  return (
    <nav
      aria-label="移动端主要操作"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-panel-border bg-background/86 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-18px_42px_rgba(0,0,0,0.34)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid max-w-[520px] grid-cols-4 gap-2">
        <Button
          aria-label={cameraAction}
          className="h-[58px] min-h-[58px] flex-col gap-1 px-2 text-[0.68rem]"
          disabled={isCameraBusy || isCameraReady}
          onClick={onStartCamera}
          type="button"
          variant={isCameraReady ? "secondary" : "default"}
        >
          <Camera aria-hidden="true" className="size-5" />
          摄像头
        </Button>

        <Button
          aria-label={voiceAction}
          className={cn(
            "h-[58px] min-h-[58px] flex-col gap-1 px-2 text-[0.68rem]",
            isListening && "border-accent/70 bg-accent-strong/18 text-teal-50",
          )}
          disabled={!isSpeechReady || isVoiceBusy}
          onClick={onVoiceToggle}
          type="button"
          variant={isListening ? "default" : "secondary"}
        >
          <Mic aria-hidden="true" className="size-5" />
          对话
        </Button>

        <Button
          aria-label="抓取画面"
          className="h-[58px] min-h-[58px] flex-col gap-1 px-2 text-[0.68rem]"
          disabled={!canCaptureFrame}
          onClick={onCaptureFrame}
          type="button"
          variant="secondary"
        >
          <Image aria-hidden="true" className="size-5" />
          画面
        </Button>

        <Button
          aria-label="提问 AI"
          className="h-[58px] min-h-[58px] flex-col gap-1 px-2 text-[0.68rem]"
          disabled={!canAskAi}
          onClick={onAskAi}
          type="button"
        >
          <Send aria-hidden="true" className="size-5" />
          {isThinking ? "提问中" : "提问"}
        </Button>
      </div>
    </nav>
  );
}
