import { AnimatePresence, motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaptionProps {
  text: string;
  visible: boolean;
  className?: string;
}

export function Caption({ text, visible, className }: CaptionProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "pointer-events-none fixed inset-x-0 z-30 px-[18px]",
            "bottom-[max(16px,env(safe-area-inset-bottom))]",
            className,
          )}
          exit={{ opacity: 0, y: 14 }}
          initial={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div
            aria-live="polite"
            className="mx-auto flex min-h-14 w-[min(100%,760px)] items-center gap-3 rounded-card border border-panel-border bg-background/82 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_60px_rgba(0,0,0,0.4)] backdrop-blur-md"
            role="status"
          >
            <Volume2 aria-hidden="true" className="size-5 shrink-0 text-accent" />
            <p className="m-0 max-h-20 overflow-hidden break-words leading-relaxed">{text}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
