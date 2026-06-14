import { motion, useReducedMotion } from "framer-motion";
import type { OrbState } from "@/hooks/useOrbState";
import { cn } from "@/lib/utils";

interface OrbProps {
  state: OrbState;
  size?: "sm" | "lg";
  className?: string;
}

const orbConfig = {
  idle: {
    label: "AI idle",
    shell: "from-slate-400/30 via-slate-500/20 to-slate-950/20",
    core: "from-slate-200 via-slate-400 to-slate-700",
    ring: "border-slate-300/35",
    glow: "shadow-[0_0_34px_rgba(148,163,184,0.34)]",
  },
  listening: {
    label: "AI listening",
    shell: "from-sky-400/40 via-blue-500/20 to-slate-950/20",
    core: "from-sky-100 via-sky-400 to-blue-700",
    ring: "border-sky-300/55",
    glow: "shadow-[0_0_44px_rgba(56,189,248,0.5)]",
  },
  thinking: {
    label: "AI thinking",
    shell: "from-amber-300/45 via-yellow-500/25 to-slate-950/20",
    core: "from-yellow-100 via-amber-300 to-orange-600",
    ring: "border-amber-200/65",
    glow: "shadow-[0_0_52px_rgba(251,191,36,0.55)]",
  },
  speaking: {
    label: "AI speaking",
    shell: "from-emerald-300/45 via-green-500/20 to-slate-950/20",
    core: "from-emerald-100 via-green-300 to-emerald-700",
    ring: "border-emerald-200/60",
    glow: "shadow-[0_0_48px_rgba(52,211,153,0.52)]",
  },
} as const;

function getCoreAnimation(state: OrbState, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { scale: 1, rotate: 0 };
  }

  if (state === "thinking") {
    return { scale: [1, 1.05, 1], rotate: [0, 360] };
  }

  if (state === "listening") {
    return { scale: [1, 1.08, 1] };
  }

  if (state === "speaking") {
    return { scale: [1, 1.12, 0.98, 1.08, 1] };
  }

  return { scale: 1 };
}

function getRingAnimation(state: OrbState, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion || state === "idle") {
    return { opacity: 0.55, scale: 1 };
  }

  return {
    opacity: [0.32, 0.82, 0.32],
    scale: state === "speaking" ? [0.9, 1.22, 0.9] : [0.92, 1.12, 0.92],
  };
}

export function Orb({ state, size = "lg", className }: OrbProps) {
  const shouldReduceMotion = useReducedMotion();
  const config = orbConfig[state];

  return (
    <div
      aria-label={config.label}
      className={cn(
        "relative isolate grid place-items-center rounded-full",
        size === "sm" ? "size-16" : "size-[min(46vw,220px)]",
        className,
      )}
      role="img"
    >
      <motion.div
        animate={getRingAnimation(state, shouldReduceMotion)}
        className={cn("absolute inset-0 rounded-full border", config.ring)}
        transition={{ duration: 1.65, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        animate={shouldReduceMotion ? { opacity: 0.22 } : { opacity: [0.18, 0.42, 0.18] }}
        className={cn("absolute -inset-5 rounded-full bg-gradient-to-br blur-xl", config.shell)}
        transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        animate={getCoreAnimation(state, shouldReduceMotion)}
        className={cn(
          "relative rounded-full bg-gradient-to-br",
          size === "sm" ? "size-9" : "size-[42%]",
          config.core,
          config.glow,
        )}
        transition={{
          duration: state === "thinking" ? 2.2 : 1.2,
          ease: "easeInOut",
          repeat: state === "idle" || shouldReduceMotion ? 0 : Infinity,
        }}
      >
        <span className="absolute inset-[18%] rounded-full bg-white/35 blur-[2px]" />
        <span className="absolute left-[24%] top-[18%] size-[24%] rounded-full bg-white/70 blur-[1px]" />
      </motion.div>
    </div>
  );
}

