import { motion } from "framer-motion";
import { Camera, Mic, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const workflowSteps = [
  { label: "Camera", state: "next", icon: Camera },
  { label: "Voice", state: "queued", icon: Mic },
  { label: "Vision", state: "queued", icon: Sparkles },
  { label: "Reply", state: "queued", icon: Volume2 },
];

function App() {
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
          <div className="relative self-center justify-self-center aspect-square w-[min(62vw,280px)]">
            <div className="absolute inset-0 rounded-full border border-slate-200/50" />
            <div className="absolute inset-[18%] rounded-full border border-accent/45" />
            <div className="absolute inset-[36%] rounded-full border border-accent/45 bg-accent/12 shadow-[0_0_42px_rgba(45,212,191,0.32)]" />
            <div className="scan-line absolute left-[12%] top-[18%] h-0.5 w-[76%] bg-accent shadow-[0_0_18px_rgba(94,234,212,0.7)]" />
          </div>

          <div
            className="absolute bottom-3.5 left-3.5 right-3.5 flex min-h-11 items-center gap-2.5 rounded-card border border-panel-border bg-background/72 px-3.5 text-sm text-slate-300 backdrop-blur-md"
            aria-live="polite"
          >
            <span className="size-2.5 rounded-full bg-muted shadow-[0_0_16px_rgba(148,163,184,0.8)]" />
            <span>Waiting for camera access</span>
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
                )}
                key={step.label}
              >
                <Icon aria-hidden="true" className="size-4" />
                {step.label}
              </div>
              );
            })}
          </div>

          <Button className="min-h-[54px] text-base" type="button">
            Start session
          </Button>
        </motion.div>
      </section>
    </main>
  );
}

export default App;
