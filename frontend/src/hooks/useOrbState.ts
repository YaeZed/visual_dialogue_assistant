export type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface OrbStateSignals {
  isListening: boolean;
  isThinking: boolean;
  isSpeaking?: boolean;
}

export function useOrbState({ isListening, isThinking, isSpeaking = false }: OrbStateSignals) {
  if (isSpeaking) {
    return "speaking" satisfies OrbState;
  }

  if (isThinking) {
    return "thinking" satisfies OrbState;
  }

  if (isListening) {
    return "listening" satisfies OrbState;
  }

  return "idle" satisfies OrbState;
}

