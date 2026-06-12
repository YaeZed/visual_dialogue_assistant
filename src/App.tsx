import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, Image, KeyRound, Mic, Send, Sparkles, Square, Volume2 } from "lucide-react";
import { Caption } from "@/components/Caption";
import { DialogueStatus, type DialogueSignalState, type DialogueTone } from "@/components/DialogueStatus";
import { MobileActionBar } from "@/components/MobileActionBar";
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
      message: "正在请求摄像头权限",
      action: "请求中...",
      tone: "active",
    };
  }

  if (status === "ready") {
    return {
      message: "摄像头已开启",
      action: "摄像头已就绪",
      tone: "ready",
    };
  }

  if (status === "denied" || status === "unavailable" || status === "error") {
    return {
      message: errorMessage ?? "摄像头不可用",
      action: "重试摄像头",
      tone: "error",
    };
  }

  return {
    message: "等待开启摄像头",
    action: "开启摄像头",
    tone: "idle",
  };
}

function getMicrophoneCopy(status: MicrophoneStatus, errorMessage: string | null) {
  if (status === "requesting") {
    return {
      message: "正在请求麦克风权限",
      action: "请求中...",
      tone: "active",
    };
  }

  if (status === "ready") {
    return {
      message: "麦克风已就绪",
      action: "麦克风已就绪",
      tone: "ready",
    };
  }

  if (status === "denied" || status === "unavailable" || status === "error") {
    return {
      message: errorMessage ?? "麦克风不可用",
      action: "重试麦克风",
      tone: "error",
    };
  }

  return {
    message: "等待开启麦克风",
    action: "开启麦克风",
    tone: "idle",
  };
}

function getSpeechCopy(status: SpeechRecognitionStatus, errorMessage: string | null) {
  if (status === "unsupported") {
    return {
      message: errorMessage ?? "当前浏览器不支持语音识别。",
      action: "语音不可用",
      tone: "error",
    };
  }

  if (status === "listening") {
    return {
      message: "正在听取你的问题",
      action: "停止聆听",
      tone: "active",
    };
  }

  if (status === "stopping") {
    return {
      message: "正在停止语音识别",
      action: "停止中...",
      tone: "active",
    };
  }

  if (status === "error") {
    return {
      message: errorMessage ?? "语音识别失败。",
      action: "重新聆听",
      tone: "error",
    };
  }

  return {
    message: "可以开始说话",
    action: "开始聆听",
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

function getDialogueTone({
  aiError,
  frameError,
  isListening,
  isSpeaking,
  isThinking,
  synthesisError,
  answer,
}: {
  aiError: string | null;
  answer: string;
  frameError: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  synthesisError: string | null;
}) {
  if (aiError || frameError || synthesisError) {
    return "error" satisfies DialogueTone;
  }

  if (isListening || isThinking || isSpeaking) {
    return "active" satisfies DialogueTone;
  }

  if (answer) {
    return "ready" satisfies DialogueTone;
  }

  return "idle" satisfies DialogueTone;
}

function getDialogueTitle({
  answer,
  hasQuestion,
  isListening,
  isSpeaking,
  isThinking,
  frame,
}: {
  answer: string;
  frame: boolean;
  hasQuestion: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
}) {
  if (isSpeaking) {
    return "正在朗读回答";
  }

  if (isThinking) {
    return "正在理解画面";
  }

  if (isListening) {
    return "正在听取问题";
  }

  if (answer) {
    return "回答已生成";
  }

  if (frame && hasQuestion) {
    return "可以提问";
  }

  if (hasQuestion) {
    return "问题已准备";
  }

  return "等待输入";
}

function getDialogueDetail({
  aiError,
  answer,
  canAskAi,
  frame,
  frameError,
  hasQuestion,
  isSpeaking,
  isThinking,
  synthesisError,
}: {
  aiError: string | null;
  answer: string;
  canAskAi: boolean;
  frame: boolean;
  frameError: string | null;
  hasQuestion: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  synthesisError: string | null;
}) {
  if (aiError || frameError || synthesisError) {
    return aiError ?? frameError ?? synthesisError ?? "请检查当前步骤后重试。";
  }

  if (isSpeaking) {
    return "正在朗读回答，并同步显示字幕。";
  }

  if (isThinking) {
    return "正在把当前画面和问题发送给 AI。";
  }

  if (answer) {
    return "回答已生成，可以重播语音或清理上下文。";
  }

  if (canAskAi) {
    return "问题和画面已准备好，可以发起多模态请求。";
  }

  if (hasQuestion && !frame) {
    return "问题已准备，还需要抓取一帧画面。";
  }

  return "还没有问题或画面帧。";
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
  const dialogueTitle = getDialogueTitle({
    answer,
    frame: Boolean(frame),
    hasQuestion,
    isListening,
    isSpeaking,
    isThinking,
  });
  const dialogueDetail = getDialogueDetail({
    aiError,
    answer,
    canAskAi,
    frame: Boolean(frame),
    frameError,
    hasQuestion,
    isSpeaking,
    isThinking,
    synthesisError,
  });
  const dialogueTone = getDialogueTone({
    aiError,
    answer,
    frameError,
    isListening,
    isSpeaking,
    isThinking,
    synthesisError,
  });
  const dialogueSignals = [
    {
      label: "问题",
      state: hasQuestion ? "ready" : isListening ? "active" : "idle",
    },
    {
      label: "画面",
      state: frame ? "ready" : frameStatus === "capturing" ? "active" : "idle",
    },
    {
      label: "回答",
      state: answer ? "ready" : isThinking || isSpeaking ? "active" : "idle",
    },
  ] satisfies Array<{ label: string; state: DialogueSignalState }>;
  const workflowSteps = [
    { label: "摄像头", state: isReady ? "ready" : "next", icon: Camera },
    {
      label: "语音",
      state: isListening ? "active" : isMicrophoneReady ? "ready" : isReady ? "next" : "queued",
      icon: Mic,
    },
    {
      label: "视觉",
      state: frame ? "ready" : hasQuestion && isReady ? "next" : "queued",
      icon: Sparkles,
    },
    {
      label: "回答",
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

  const handleAskAi = () => {
    if (!frame || !canAskAi) {
      return;
    }

    void askAiWithFrame(frame.dataUrl, questionText);
  };

  const handleCaptureFrame = () => {
    void captureFrame(getVideoElement());
  };

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
    <main className="safe-page safe-page-mobile-actions min-h-svh bg-[radial-gradient(circle_at_50%_20%,rgba(34,197,94,0.14),transparent_30%),linear-gradient(180deg,#0c1019_0%,#06070b_100%)] px-[18px] md:p-7">
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
          aria-label={canCaptureFrame ? "抓取当前画面并发起视觉提问" : undefined}
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
            aria-label="摄像头预览"
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-300",
              isReady ? "opacity-100" : "opacity-0",
            )}
            muted
            playsInline
            autoPlay
          />

          {isReady && (
            <div className="pointer-events-none absolute right-4 top-4 z-10 grid w-[min(78vw,290px)] justify-items-end gap-2">
              <Orb size="sm" state={orbState} />
              <DialogueStatus
                detail={dialogueDetail}
                signals={dialogueSignals}
                state={orbState}
                title={dialogueTitle}
                tone={dialogueTone}
              />
            </div>
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
              {isReady && !isThinking ? "摄像头已开启。点击画面可直接发起视觉提问。" : cameraCopy.message}
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
              视觉对话助手
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
                关闭摄像头
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
                <p className="m-0 text-muted">识别到的语音会显示在这里。</p>
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
                清空问题
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
                  ? "正在抓取当前画面"
                  : frame
                    ? `画面已就绪：${frame.width}x${frame.height}，${frame.sizeKb} KB`
                    : frameError ?? "问题准备好后，抓取一帧画面。"}
              </span>
            </div>

            <Button
              disabled={!canCaptureFrame}
              onClick={handleCaptureFrame}
              type="button"
              variant="secondary"
            >
              <Image aria-hidden="true" className="size-5" />
              {frameStatus === "capturing" ? "抓取中..." : "抓取画面"}
            </Button>

            {frame && (
              <div className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-card border border-panel-border bg-background/50 p-2 text-xs text-slate-300">
                <img
                  alt="已抓取画面预览"
                  className="h-12 w-16 rounded-card object-cover"
                  src={frame.dataUrl}
                />
                <span>{new Date(frame.capturedAt).toLocaleTimeString()}</span>
                <Button onClick={clearFrame} size="sm" type="button" variant="ghost">
                  清除
                </Button>
              </div>
            )}
          </section>

          <section className="grid gap-2 rounded-card border border-panel-border bg-white/6 p-3">
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span className="flex items-center gap-2 font-bold text-slate-200">
                <KeyRound aria-hidden="true" className="size-4" />
                API 密钥
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
                  ? "正在结合画面思考"
                  : isSpeaking
                    ? "正在朗读 AI 回答"
                  : answer
                    ? model
                      ? `AI 回答已生成，模型：${model}`
                      : "AI 回答已生成"
                    : aiError ?? synthesisError ?? "填写 API 密钥、准备问题并抓取画面后即可提问。"}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
              <Button
                disabled={!canAskAi}
                onClick={handleAskAi}
                type="button"
              >
                <Send aria-hidden="true" className="size-5" />
                {isThinking ? "提问中..." : "提问 AI"}
              </Button>
              {isThinking ? (
                <Button onClick={cancelRequest} type="button" variant="secondary">
                  取消
                </Button>
              ) : (
                answer && (
                  <Button onClick={clearAnswer} type="button" variant="ghost">
                    清空回答
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
                  重播回答
                </Button>
                <Button disabled={!isSpeaking} onClick={stop} type="button" variant="ghost">
                  <Square aria-hidden="true" className="size-4" />
                  停止朗读
                </Button>
              </div>
            )}

            <div className="min-h-20 rounded-card border border-panel-border bg-background/50 p-3 text-sm text-slate-200">
              {answer ? (
                <p className="m-0 leading-relaxed">{answer}</p>
              ) : (
                <p className="m-0 text-muted">AI 回答会显示在这里。</p>
              )}
            </div>

            <div className="grid gap-2 rounded-card border border-panel-border bg-background/35 p-3 text-xs text-slate-300">
              <div className="flex items-center justify-between gap-3">
                <span>本页上下文：{turns.length} 轮</span>
                {turns.length > 0 && (
                  <Button onClick={clearContext} size="sm" type="button" variant="ghost">
                    清空上下文
                  </Button>
                )}
              </div>
              {turns.slice(-2).map((turn) => (
                <div className="grid gap-1 border-t border-panel-border pt-2" key={turn.id}>
                  <p className="m-0 text-slate-400">问：{turn.question}</p>
                  <p className="m-0 text-slate-200">答：{turn.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      </section>
      <Caption
        className="bottom-[max(92px,calc(env(safe-area-inset-bottom)+84px))] md:bottom-[max(16px,env(safe-area-inset-bottom))]"
        text={captionText}
        visible={isSpeaking && Boolean(captionText)}
      />
      <MobileActionBar
        cameraAction={cameraCopy.action}
        canAskAi={canAskAi}
        canCaptureFrame={canCaptureFrame}
        isCameraBusy={status === "requesting"}
        isCameraReady={isReady}
        isListening={isListening}
        isMicrophoneBusy={microphoneStatus === "requesting"}
        isMicrophoneReady={isMicrophoneReady}
        isSpeechReady={isSpeechSupported && speechStatus !== "stopping"}
        isThinking={isThinking}
        microphoneAction={microphoneCopy.action}
        onAskAi={handleAskAi}
        onCaptureFrame={handleCaptureFrame}
        onMicrophone={startMicrophone}
        onSpeechToggle={isListening ? stopListening : startListening}
        onStartCamera={startCamera}
        speechAction={speechCopy.action}
      />
    </main>
  );
}

export default App;
