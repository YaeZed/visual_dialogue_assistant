import { motion } from "framer-motion";
import { Camera, CameraOff, Mic, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCamera, type CameraStatus } from "@/hooks/useCamera";
import { cn } from "@/lib/utils";

function getCameraCopy(status: CameraStatus, errorMessage: string | null) {
  if (status === "requesting") {
    return {
      message: "Requesting camera access",
      action: "Requesting...",
      tone: "active",
    };
  }

  if (status === "ready") {
    return {
      message: "Camera is live",
      action: "Camera ready",
      tone: "ready",
    };
  }

  if (status === "denied" || status === "unavailable" || status === "error") {
    return {
      message: errorMessage ?? "Camera is not available",
      action: "Retry camera",
      tone: "error",
    };
  }

  return {
    message: "Waiting for camera access",
    action: "Start camera",
    tone: "idle",
  };
}

function App() {
  const { videoRef, status, errorMessage, isReady, startCamera, stopCamera } = useCamera();
  const cameraCopy = getCameraCopy(status, errorMessage);
  const workflowSteps = [
    { label: "Camera", state: isReady ? "ready" : "next", icon: Camera },
    { label: "Voice", state: "queued", icon: Mic },
    { label: "Vision", state: "queued", icon: Sparkles },
    { label: "Reply", state: "queued", icon: Volume2 },
  ];

  return (
    <main className="safe-page min-h-svh bg-[radial-gradient(circle_at_50%_20%,rgba(34,197,94,0.14),transparent_30%),linear-gradient(180deg,#0c1019_0%,#06070b_100%)] px-[18px] md:p-7">
      <section
        className="grid min-h-[calc(100svh-38px)] gap-[18px] md:min-h-[calc(100svh-56px)] md:grid-cols-[minmax(0,1fr)_360px]"
        aria-label="AI 视觉对话助手"
      >
        <motion.div
          className="vision-grid relative grid min-h-[420px] overflow-hidden rounded-card border border-panel-border shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] md:min-h-0"
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <video
            ref={videoRef}
            aria-label="Camera preview"
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-300",
              isReady ? "opacity-100" : "opacity-0",
            )}
            muted
            playsInline
            autoPlay
          />

          {!isReady && (
            <div className="relative self-center justify-self-center aspect-square w-[min(62vw,280px)]">
              <div className="absolute inset-0 rounded-full border border-slate-200/50" />
              <div className="absolute inset-[18%] rounded-full border border-accent/45" />
              <div className="absolute inset-[36%] grid place-items-center rounded-full border border-accent/45 bg-accent/12 shadow-[0_0_42px_rgba(45,212,191,0.32)]">
                {cameraCopy.tone === "error" ? (
                  <CameraOff className="size-10 text-warning" aria-hidden="true" />
                ) : (
                  <Camera className="size-10 text-accent" aria-hidden="true" />
                )}
              </div>
              <div className="scan-line absolute left-[12%] top-[18%] h-0.5 w-[76%] bg-accent shadow-[0_0_18px_rgba(94,234,212,0.7)]" />
            </div>
          )}

          <div
            className="absolute bottom-3.5 left-3.5 right-3.5 flex min-h-11 items-center gap-2.5 rounded-card border border-panel-border bg-background/72 px-3.5 text-sm text-slate-300 backdrop-blur-md"
            aria-live="polite"
          >
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full shadow-[0_0_16px_currentColor]",
                cameraCopy.tone === "ready" && "bg-emerald-400 text-emerald-400",
                cameraCopy.tone === "active" && "bg-accent text-accent",
                cameraCopy.tone === "error" && "bg-warning text-warning",
                cameraCopy.tone === "idle" && "bg-muted text-muted",
              )}
            />
            <span>{cameraCopy.message}</span>
          </div>
        </motion.div>

        <motion.div
          className="grid content-end gap-3.5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
        >
          <div className="grid gap-1">
            <p className="m-0 text-xs font-bold uppercase text-[#8dd3c7]">
              Visual Dialogue Assistant
            </p>
            <h1 className="m-0 text-[clamp(2rem,9vw,4.75rem)] leading-none text-slate-50">
              AI 视觉对话助手
            </h1>
          </div>

          <div className="grid grid-cols-4 gap-2" aria-label="对话流程">
            {workflowSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  className={cn(
                    "grid min-h-12 place-items-center gap-1 rounded-card border border-panel-border text-[0.72rem] font-bold text-muted",
                    step.state === "next" &&
                      "border-accent/50 bg-accent-strong/12 text-teal-100",
                    step.state === "ready" &&
                      "border-emerald-400/50 bg-emerald-500/12 text-emerald-100",
                  )}
                  key={step.label}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {step.label}
                </div>
              );
            })}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
            <Button
              className="min-h-[54px] text-base"
              disabled={status === "requesting" || isReady}
              onClick={startCamera}
              type="button"
            >
              <Camera aria-hidden="true" className="size-5" />
              {cameraCopy.action}
            </Button>
            {isReady && (
              <Button
                className="min-h-[50px]"
                onClick={stopCamera}
                type="button"
                variant="secondary"
              >
                <CameraOff aria-hidden="true" className="size-5" />
                Stop camera
              </Button>
            )}
          </div>
        </motion.div>
      </section>
    </main>
  );
}

export default App;
