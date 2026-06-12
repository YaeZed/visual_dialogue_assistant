import { Camera, Image, Mic, Send, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileActionBarProps {
  canAskAi: boolean;
  canCaptureFrame: boolean;
  cameraAction: string;
  isCameraBusy: boolean;
  isCameraReady: boolean;
  isListening: boolean;
  isMicrophoneBusy: boolean;
  isMicrophoneReady: boolean;
  isThinking: boolean;
  isSpeechReady: boolean;
  microphoneAction: string;
  speechAction: string;
  onAskAi: () => void;
  onCaptureFrame: () => void;
  onMicrophone: () => void;
  onSpeechToggle: () => void;
  onStartCamera: () => void;
}

export function MobileActionBar({
  canAskAi,
  canCaptureFrame,
  cameraAction,
  isCameraBusy,
  isCameraReady,
  isListening,
  isMicrophoneBusy,
  isMicrophoneReady,
  isThinking,
  isSpeechReady,
  microphoneAction,
  onAskAi,
  onCaptureFrame,
  onMicrophone,
  onSpeechToggle,
  onStartCamera,
  speechAction,
}: MobileActionBarProps) {
  return (
    <nav
      aria-label="Mobile primary actions"
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
          Camera
        </Button>

        <Button
          aria-label={isMicrophoneReady ? speechAction : microphoneAction}
          className={cn(
            "h-[58px] min-h-[58px] flex-col gap-1 px-2 text-[0.68rem]",
            isListening && "border-accent/70 bg-accent-strong/18 text-teal-50",
          )}
          disabled={isMicrophoneReady ? !isSpeechReady : isMicrophoneBusy}
          onClick={isMicrophoneReady ? onSpeechToggle : onMicrophone}
          type="button"
          variant={isListening ? "default" : "secondary"}
        >
          {isMicrophoneReady ? (
            <Volume2 aria-hidden="true" className="size-5" />
          ) : (
            <Mic aria-hidden="true" className="size-5" />
          )}
          Voice
        </Button>

        <Button
          aria-label="Capture frame"
          className="h-[58px] min-h-[58px] flex-col gap-1 px-2 text-[0.68rem]"
          disabled={!canCaptureFrame}
          onClick={onCaptureFrame}
          type="button"
          variant="secondary"
        >
          <Image aria-hidden="true" className="size-5" />
          Frame
        </Button>

        <Button
          aria-label="Ask AI"
          className="h-[58px] min-h-[58px] flex-col gap-1 px-2 text-[0.68rem]"
          disabled={!canAskAi}
          onClick={onAskAi}
          type="button"
        >
          <Send aria-hidden="true" className="size-5" />
          {isThinking ? "Asking" : "Ask"}
        </Button>
      </div>
    </nav>
  );
}
