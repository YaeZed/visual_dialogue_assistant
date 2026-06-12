import type { OrbState } from "@/hooks/useOrbState";
import { cn } from "@/lib/utils";

export type DialogueSignalState = "idle" | "active" | "ready";
export type DialogueTone = "idle" | "active" | "ready" | "error";

interface DialogueSignal {
  label: string;
  state: DialogueSignalState;
}

interface DialogueStatusProps {
  detail: string;
  signals: DialogueSignal[];
  state: OrbState;
  title: string;
  tone: DialogueTone;
  className?: string;
}

const stateLabel: Record<OrbState, string> = {
  idle: "待机",
  listening: "聆听",
  thinking: "思考",
  speaking: "说话",
};

function getToneClass(tone: DialogueTone) {
  return cn(
    tone === "idle" && "border-panel-border bg-background/72 text-slate-300",
    tone === "active" && "border-accent/45 bg-accent-strong/14 text-teal-50",
    tone === "ready" && "border-emerald-400/40 bg-emerald-500/12 text-emerald-50",
    tone === "error" && "border-warning/45 bg-warning/12 text-amber-50",
  );
}

function getSignalClass(state: DialogueSignalState) {
  return cn(
    "border-panel-border bg-white/6 text-muted",
    state === "active" && "border-accent/50 bg-accent-strong/12 text-teal-100",
    state === "ready" && "border-emerald-400/45 bg-emerald-500/12 text-emerald-100",
  );
}

export function DialogueStatus({ detail, signals, state, title, tone, className }: DialogueStatusProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "rounded-card border px-3 py-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-md",
        getToneClass(tone),
        className,
      )}
      role="status"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 truncate text-[0.68rem] font-bold uppercase tracking-[0.08em] text-current/65">
            {stateLabel[state]}
          </p>
          <p className="m-0 truncate text-sm font-bold">{title}</p>
        </div>
        <span className="size-2.5 shrink-0 rounded-full bg-current shadow-[0_0_16px_currentColor]" />
      </div>

      <p className="mt-1.5 line-clamp-2 min-h-8 text-xs leading-4 text-current/78">{detail}</p>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {signals.map((signal) => (
          <span
            className={cn(
              "grid min-h-8 place-items-center rounded-card border px-1.5 text-[0.68rem] font-bold",
              getSignalClass(signal.state),
            )}
            key={signal.label}
          >
            {signal.label}
          </span>
        ))}
      </div>
    </div>
  );
}
