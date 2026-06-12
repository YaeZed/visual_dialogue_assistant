import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, Image, KeyRound, Mic, Send, Sparkles, Square, Volume2 } from "lucide-react";
import { Caption } from "@/components/Caption";
import { Orb } from "@/components/Orb";
import { Button } from "@/components/ui/button";
import { useAiChat } from "@/hooks/useAiChat";
import { useCamera, type CameraStatus } from "@/hooks/useCamera";
import { useFrameCapture } from "@/hooks/useFrameCapture";
import { useMicrophone, type MicrophoneStatus } from "@/hooks/useMicrophone";
import { useOrbState } from "@/hooks/useOrbState";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  useSpeechRecognition,
  type SpeechRecognitionStatus,
} from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";

const FALLBACK_VISUAL_QUESTION = "请描述当前画面，并指出值得我注意的内容。";

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

function getMicrophoneCopy(status: MicrophoneStatus, errorMessage: string | null) {
  if (status === "requesting") {
    return {
      message: "Requesting microphone access",
      action: "Requesting...",
      tone: "active",
    };
  }

  if (status === "ready") {
    return {
      message: "Microphone is ready",
      action: "Microphone ready",
      tone: "ready",
    };
  }

  if (status === "denied" || status === "unavailable" || status === "error") {
    return {
      message: errorMessage ?? "Microphone is not available",
      action: "Retry microphone",
      tone: "error",
    };
  }

  return {
    message: "Waiting for microphone access",
    action: "Enable microphone",
    tone: "idle",
  };
}

function getSpeechCopy(status: SpeechRecognitionStatus, errorMessage: string | null) {
  if (status === "unsupported") {
    return {
      message: errorMessage ?? "Speech recognition is not supported in this browser.",
      action: "Speech unavailable",
      tone: "error",
    };
  }

  if (status === "listening") {
    return {
      message: "Listening for your question",
      action: "Stop listening",
      tone: "active",
    };
  }

  if (status === "stopping") {
    return {
      message: "Stopping speech recognition",
      action: "Stopping...",
      tone: "active",
    };
  }

  if (status === "error") {
    return {
      message: errorMessage ?? "Speech recognition failed.",
      action: "Retry listening",
      tone: "error",
    };
  }

  return {
    message: "Ready to listen",
    action: "Start listening",
    tone: "idle",
  };
}

function getStatusDotClass(tone: string) {
  return cn(
    "size-2.5 shrink-0 rounded-full shadow-[0_0_16px_currentColor]",
    tone === "ready" && "bg-emerald-400 text-emerald-400",
    tone === "active" && "bg-accent text-accent",
    tone === "error" && "bg-warning text-warning",
    tone === "idle" && "bg-muted text-muted",
  );
}

function App() {
  const [apiKey, setApiKey] = useState("");
  const [fallbackQuestion, setFallbackQuestion] = useState("");
  const lastSpokenAnswerRef = useRef("");
  const {
    videoRef,
    status,
    errorMessage,
    isReady,
    startCamera,
    stopCamera,
    getVideoElement,
  } = useCamera();
  const {
    status: frameStatus,
    frame,
    errorMessage: frameError,
    captureFrame,
    clearFrame,
  } = useFrameCapture();
  const {
    status: aiStatus,
    answer,
    model,
    turns,
    errorMessage: aiError,
    isThinking,
    askVisionQuestion,
    cancelRequest,
    clearAnswer,
    clearContext,
  } = useAiChat();
  const {
    status: microphoneStatus,
    errorMessage: microphoneError,
    isReady: isMicrophoneReady,
    startMicrophone,
  } = useMicrophone();
  const {
    status: speechStatus,
    errorMessage: speechError,
    transcript,
    interimTranscript,
    isSupported: isSpeechSupported,
    isListening,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition();
  const {
    status: synthesisStatus,
    captionText,
    errorMessage: synthesisError,
    isSpeaking,
    speak,
    stop,
  } = useSpeechSynthesis();
  const cameraCopy = getCameraCopy(status, errorMessage);
  const microphoneCopy = getMicrophoneCopy(microphoneStatus, microphoneError);
  const speechCopy = getSpeechCopy(speechStatus, speechError);
  const spokenText = interimTranscript || transcript;
  const questionText = useMemo(
    () => (transcript.trim() || interimTranscript.trim() || fallbackQuestion).trim(),
    [fallbackQuestion, interimTranscript, transcript],
  );
  const hasQuestion = Boolean(questionText);
  const canCaptureFrame = isReady && frameStatus !== "capturing";
  const canAskAi = Boolean(apiKey.trim() && questionText && frame) && !isThinking;
  const fallbackQuestionText = !spokenText && fallbackQuestion ? fallbackQuestion : "";
  const orbState = useOrbState({ isListening, isThinking, isSpeaking });
  const workflowSteps = [
    { label: "Camera", state: isReady ? "ready" : "next", icon: Camera },
    {
      label: "Voice",
      state: isListening ? "active" : isMicrophoneReady ? "ready" : isReady ? "next" : "queued",
      icon: Mic,
    },
    {
      label: "Vision",
      state: frame ? "ready" : hasQuestion && isReady ? "next" : "queued",
      icon: Sparkles,
    },
    {
      label: "Reply",
      state: isThinking ? "active" : answer ? "ready" : frame && hasQuestion ? "next" : "queued",
      icon: Volume2,
    },
  ];
  const askAiWithFrame = (imageDataUrl: string, prompt: string) =>
    askVisionQuestion({
      apiKey,
      prompt,
      imageDataUrl,
    });

  useEffect(() => {
    if (!answer || answer === lastSpokenAnswerRef.current) {
      return;
    }

    lastSpokenAnswerRef.current = answer;
    speak(answer);
  }, [answer, speak]);

  useEffect(() => {
    if (!answer) {
      lastSpokenAnswerRef.current = "";
      stop();
    }
  }, [answer, stop]);

  const handleFallbackVisualQuestion = async () => {
    if (!canCaptureFrame || isThinking) {
      return;
    }

    const nextFrame = await captureFrame(getVideoElement());

    if (!nextFrame) {
      return;
    }

    const nextQuestion = questionText || FALLBACK_VISUAL_QUESTION;
    setFallbackQuestion(nextQuestion);

    if (apiKey.trim()) {
      await askAiWithFrame(nextFrame.dataUrl, nextQuestion);
    }
  };

  return (
    <main className="safe-page min-h-svh bg-[radial-gradient(circle_at_50%_20%,rgba(34,197,94,0.14),transparent_30%),linear-gradient(180deg,#0c1019_0%,#06070b_100%)] px-[18px] md:p-7">
      <section
        className="grid min-h-[calc(100svh-38px)] gap-[18px] md:min-h-[calc(100svh-56px)] md:grid-cols-[minmax(0,1fr)_360px]"
        aria-label="AI 视觉对话助手"
      >
        <motion.div
          className={cn(
            "vision-grid relative grid min-h-[420px] overflow-hidden rounded-card border border-panel-border shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] md:min-h-0",
            canCaptureFrame && "cursor-pointer",
          )}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          aria-label={canCaptureFrame ? "Capture current frame and ask a visual fallback question" : undefined}
          onClick={handleFallbackVisualQuestion}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              void handleFallbackVisualQuestion();
            }
          }}
          role={canCaptureFrame ? "button" : undefined}
          tabIndex={canCaptureFrame ? 0 : -1}
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

          {isReady && (
            <Orb className="pointer-events-none absolute right-4 top-4 z-10" size="sm" state={orbState} />
          )}

          {!isReady && (
            <div className="relative self-center justify-self-center aspect-square w-[min(62vw,280px)]">
              <div className="absolute inset-0 rounded-full border border-slate-200/50" />
              <div className="absolute inset-[18%] rounded-full border border-accent/45" />
              <div className="absolute inset-[36%] grid place-items-center rounded-full border border-accent/45 bg-accent/12 shadow-[0_0_42px_rgba(45,212,191,0.32)]">
                {cameraCopy.tone === "error" ? (
                  <CameraOff className="size-10 text-warning" aria-hidden="true" />
                ) : (
                  <Orb size="sm" state={orbState} />
                )}
              </div>
              <div className="scan-line absolute left-[12%] top-[18%] h-0.5 w-[76%] bg-accent shadow-[0_0_18px_rgba(94,234,212,0.7)]" />
            </div>
          )}

          <div
            className="absolute bottom-3.5 left-3.5 right-3.5 flex min-h-11 items-center gap-2.5 rounded-card border border-panel-border bg-background/72 px-3.5 text-sm text-slate-300 backdrop-blur-md"
            aria-live="polite"
          >
            <span className={getStatusDotClass(cameraCopy.tone)} />
            <span>
              {isReady && !isThinking ? "Camera is live. Tap the frame for visual fallback." : cameraCopy.message}
            </span>
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
                    step.state === "active" &&
                      "border-accent/70 bg-accent-strong/18 text-teal-50",
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

          <section className="grid gap-2 rounded-card border border-panel-border bg-white/6 p-3">
            <div className="flex min-h-6 items-center gap-2 text-sm text-slate-300" aria-live="polite">
              <span className={getStatusDotClass(isListening ? "active" : microphoneCopy.tone)} />
              <span>{isMicrophoneReady ? speechCopy.message : microphoneCopy.message}</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
              <Button
                disabled={microphoneStatus === "requesting" || isMicrophoneReady}
                onClick={startMicrophone}
                type="button"
                variant="secondary"
              >
                <Mic aria-hidden="true" className="size-5" />
                {microphoneCopy.action}
              </Button>
              <Button
                disabled={!isMicrophoneReady || !isSpeechSupported || speechStatus === "stopping"}
                onClick={isListening ? stopListening : startListening}
                type="button"
                variant={isListening ? "default" : "secondary"}
              >
                <Volume2 aria-hidden="true" className="size-5" />
                {speechCopy.action}
              </Button>
            </div>

            <div className="min-h-16 rounded-card border border-panel-border bg-background/50 p-3 text-sm text-slate-200">
              {spokenText ? (
                <p className="m-0">{spokenText}</p>
              ) : fallbackQuestionText ? (
                <p className="m-0">{fallbackQuestionText}</p>
              ) : (
                <p className="m-0 text-muted">Recognized speech will appear here.</p>
              )}
            </div>

            {(transcript || fallbackQuestion) && (
              <Button
                onClick={() => {
                  clearTranscript();
                  setFallbackQuestion("");
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                Clear question
              </Button>
            )}
          </section>

          <section className="grid gap-2 rounded-card border border-panel-border bg-white/6 p-3">
            <div className="flex min-h-6 items-center gap-2 text-sm text-slate-300" aria-live="polite">
              <span
                className={getStatusDotClass(
                  frameStatus === "capturing" ? "active" : frame ? "ready" : frameError ? "error" : "idle",
                )}
              />
              <span>
                {frameStatus === "capturing"
                  ? "Capturing current frame"
                  : frame
                    ? `Frame ready: ${frame.width}x${frame.height}, ${frame.sizeKb} KB`
                    : frameError ?? "Capture one frame when the question is ready."}
              </span>
            </div>

            <Button
              disabled={!canCaptureFrame}
              onClick={() => captureFrame(getVideoElement())}
              type="button"
              variant="secondary"
            >
              <Image aria-hidden="true" className="size-5" />
              {frameStatus === "capturing" ? "Capturing..." : "Capture frame"}
            </Button>

            {frame && (
              <div className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-card border border-panel-border bg-background/50 p-2 text-xs text-slate-300">
                <img
                  alt="Captured frame preview"
                  className="h-12 w-16 rounded-card object-cover"
                  src={frame.dataUrl}
                />
                <span>{new Date(frame.capturedAt).toLocaleTimeString()}</span>
                <Button onClick={clearFrame} size="sm" type="button" variant="ghost">
                  Clear
                </Button>
              </div>
            )}
          </section>

          <section className="grid gap-2 rounded-card border border-panel-border bg-white/6 p-3">
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span className="flex items-center gap-2 font-bold text-slate-200">
                <KeyRound aria-hidden="true" className="size-4" />
                API key
              </span>
              <input
                autoComplete="off"
                className="min-h-11 rounded-card border border-panel-border bg-background/70 px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent"
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                type="password"
                value={apiKey}
              />
            </label>

            <div className="flex min-h-6 items-center gap-2 text-sm text-slate-300" aria-live="polite">
              <span
                className={getStatusDotClass(
                  isThinking || isSpeaking ? "active" : answer ? "ready" : aiError || synthesisError ? "error" : "idle",
                )}
              />
              <span>
                {isThinking
                  ? "Thinking with the captured frame"
                  : isSpeaking
                    ? "Speaking the AI answer"
                  : answer
                    ? model
                      ? `AI response ready via ${model}`
                      : "AI response ready"
                    : aiError ?? synthesisError ?? "Ready after API key, question, and frame are available."}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
              <Button
                disabled={!canAskAi}
                onClick={() =>
                  frame &&
                  askAiWithFrame(frame.dataUrl, questionText)
                }
                type="button"
              >
                <Send aria-hidden="true" className="size-5" />
                {isThinking ? "Asking..." : "Ask AI"}
              </Button>
              {isThinking ? (
                <Button onClick={cancelRequest} type="button" variant="secondary">
                  Cancel
                </Button>
              ) : (
                answer && (
                  <Button onClick={clearAnswer} type="button" variant="ghost">
                    Clear answer
                  </Button>
                )
              )}
            </div>

            {answer && (
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                <Button
                  disabled={synthesisStatus === "unsupported"}
                  onClick={() => speak(answer)}
                  type="button"
                  variant="secondary"
                >
                  <Volume2 aria-hidden="true" className="size-5" />
                  Replay answer
                </Button>
                <Button disabled={!isSpeaking} onClick={stop} type="button" variant="ghost">
                  <Square aria-hidden="true" className="size-4" />
                  Stop speech
                </Button>
              </div>
            )}

            <div className="min-h-20 rounded-card border border-panel-border bg-background/50 p-3 text-sm text-slate-200">
              {answer ? (
                <p className="m-0 leading-relaxed">{answer}</p>
              ) : (
                <p className="m-0 text-muted">AI answer will appear here.</p>
              )}
            </div>

            <div className="grid gap-2 rounded-card border border-panel-border bg-background/35 p-3 text-xs text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <span>Context: {turns.length} turn{turns.length === 1 ? "" : "s"} in this page</span>
                {turns.length > 0 && (
                  <Button onClick={clearContext} size="sm" type="button" variant="ghost">
                    Clear context
                  </Button>
                )}
              </div>
              {turns.slice(-2).map((turn) => (
                <div className="grid gap-1 border-t border-panel-border pt-2" key={turn.id}>
                  <p className="m-0 text-slate-400">Q: {turn.question}</p>
                  <p className="m-0 text-slate-200">A: {turn.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      </section>
      <Caption text={captionText} visible={isSpeaking && Boolean(captionText)} />
    </main>
  );
}

export default App;
