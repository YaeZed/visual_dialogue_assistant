import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  Copy,
  History,
  Image,
  Keyboard,
  ListChecks,
  Mic,
  Send,
  Sparkles,
  Square,
  Trash2,
  Volume2,
} from "lucide-react";
import { Caption } from "@/components/Caption";
import { DialogueStatus, type DialogueSignalState, type DialogueTone } from "@/components/DialogueStatus";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Orb } from "@/components/Orb";
import { Button } from "@/components/ui/button";
import { useAiChat } from "@/hooks/useAiChat";
import { useCamera, type CameraStatus } from "@/hooks/useCamera";
import { useFrameCapture, type FrameCaptureMode } from "@/hooks/useFrameCapture";
import { useMicrophone, type MicrophoneStatus } from "@/hooks/useMicrophone";
import { useOrbState } from "@/hooks/useOrbState";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  useSpeechRecognition,
  type SpeechRecognitionStatus,
} from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";

const FALLBACK_VISUAL_QUESTION = "请描述当前画面，并指出值得我注意的内容。";
const AUTO_ASK_SILENCE_MS = 1200;
const FOLLOW_UP_IDLE_TIMEOUT_MS = 15000;
const SLOW_AI_RESPONSE_MS = 8000;
const ANSWER_SUMMARY_MAX_LENGTH = 82;

type CopyTarget = "answer" | "summary";

function getAnswerSummary(answer: string) {
  const normalizedAnswer = answer.replace(/\s+/g, " ").trim();

  if (!normalizedAnswer) {
    return "";
  }

  const sentenceMatch = normalizedAnswer.match(/^.{12,}?[。！？.!?]/u);
  const summary = sentenceMatch?.[0] ?? normalizedAnswer;

  if (summary.length <= ANSWER_SUMMARY_MAX_LENGTH) {
    return summary;
  }

  return `${summary.slice(0, ANSWER_SUMMARY_MAX_LENGTH).trim()}...`;
}

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
  frameStatus,
  hasQuestion,
  isAiResponseSlow,
  isListening,
  isSpeaking,
  isThinking,
  frame,
}: {
  answer: string;
  frame: boolean;
  frameStatus: string;
  hasQuestion: boolean;
  isAiResponseSlow: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
}) {
  if (isSpeaking) {
    return "正在朗读回答";
  }

  if (isThinking) {
    if (isAiResponseSlow) {
      return "网络较慢";
    }

    return "正在理解画面";
  }

  if (isListening) {
    return "正在听取问题";
  }

  if (frameStatus === "capturing") {
    return "正在抓取画面";
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
  frameStatus,
  frameError,
  hasQuestion,
  isAiResponseSlow,
  isSpeaking,
  isThinking,
  synthesisError,
}: {
  aiError: string | null;
  answer: string;
  canAskAi: boolean;
  frame: boolean;
  frameStatus: string;
  frameError: string | null;
  hasQuestion: boolean;
  isAiResponseSlow: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  synthesisError: string | null;
}) {
  if (aiError) {
    return canAskAi
      ? `${aiError} 已保留问题和画面，可直接重试。`
      : aiError;
  }

  if (frameError || synthesisError) {
    return frameError ?? synthesisError ?? "请检查当前步骤后重试。";
  }

  if (isSpeaking) {
    return "正在朗读回答，并同步显示字幕。";
  }

  if (isThinking) {
    if (isAiResponseSlow) {
      return "网络较慢，正在等待 AI 响应...";
    }

    return "正在把当前画面和问题发送给 AI。";
  }

  if (frameStatus === "capturing") {
    return "问题已听到，正在抓取当前画面。";
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
  const [fallbackQuestion, setFallbackQuestion] = useState("");
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isFollowUpListening, setIsFollowUpListening] = useState(false);
  const [isAiResponseSlow, setIsAiResponseSlow] = useState(false);
  const [frameCaptureMode, setFrameCaptureMode] = useState<FrameCaptureMode>("low");
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);
  const [copyError, setCopyError] = useState("");
  const lastSpokenAnswerRef = useRef("");
  const autoAskedQuestionRef = useRef("");
  const lastFollowUpCompletionRef = useRef(0);
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
    completedUtterance,
    errorMessage: synthesisError,
    isSpeaking,
    prime,
    speak,
    stop,
  } = useSpeechSynthesis();
  const cameraCopy = getCameraCopy(status, errorMessage);
  const microphoneCopy = getMicrophoneCopy(microphoneStatus, microphoneError);
  const speechCopy = getSpeechCopy(speechStatus, speechError);
  const isVoiceBusy = microphoneStatus === "requesting" || speechStatus === "stopping";
  const voiceAction = !isSpeechSupported
    ? "语音不可用"
    : isListening
      ? "停止聆听"
      : microphoneStatus === "requesting"
        ? "请求麦克风..."
        : "开始对话";
  const spokenText = interimTranscript || transcript;
  const questionText = useMemo(
    () => (transcript.trim() || interimTranscript.trim() || fallbackQuestion).trim(),
    [fallbackQuestion, interimTranscript, transcript],
  );
  const hasQuestion = Boolean(questionText);
  const canCaptureFrame = isReady && frameStatus !== "capturing";
  const canAskAi = Boolean(questionText && frame) && !isThinking && frameStatus !== "capturing";
  const fallbackQuestionText = !spokenText && fallbackQuestion ? fallbackQuestion : "";
  const answerSummary = useMemo(() => getAnswerSummary(answer), [answer]);
  const shouldShowTextQuestionInput =
    !answer && !isListening && !isThinking && (!spokenText || Boolean(fallbackQuestion));
  const frameCaptureModeDetail =
    frameCaptureMode === "low"
      ? "低清模式会优先压缩到约 40KB，适合弱网快速提问。"
      : "高清模式会保留更多细节，适合文字、小物体或复杂画面。";
  const orbState = useOrbState({ isListening, isThinking, isSpeaking });
  const dialogueTitle = getDialogueTitle({
    answer,
    frame: Boolean(frame),
    frameStatus,
    hasQuestion,
    isAiResponseSlow,
    isListening,
    isSpeaking,
    isThinking,
  });
  const dialogueDetail = getDialogueDetail({
    aiError,
    answer,
    canAskAi,
    frame: Boolean(frame),
    frameStatus,
    frameError,
    hasQuestion,
    isAiResponseSlow,
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
      state: frameStatus === "capturing" ? "active" : frame ? "ready" : hasQuestion && isReady ? "next" : "queued",
      icon: Sparkles,
    },
    {
      label: "回答",
      state: isThinking ? "active" : answer ? "ready" : frame && hasQuestion ? "next" : "queued",
      icon: Volume2,
    },
  ];
  const panelIssue = aiError ?? frameError ?? synthesisError;
  const panelTitle = panelIssue
    ? aiError && canAskAi
      ? "提问失败，可直接重试"
      : "需要处理当前异常"
    : isThinking
      ? isAiResponseSlow
        ? "网络较慢"
        : "正在生成回答"
      : isSpeaking
        ? "正在朗读回答"
        : isFollowUpListening && isListening
          ? "可以直接追问"
        : isListening
          ? "正在聆听问题"
          : answer
            ? "回答已生成"
            : canAskAi
              ? "问题和画面已准备"
              : frameStatus === "capturing"
                ? "正在抓取画面"
                : hasQuestion
                  ? "问题已收到"
                  : speechStatus === "unsupported" || speechStatus === "error"
                    ? "可以输入问题"
                  : isMicrophoneReady
                    ? "可以开始对话"
                    : "摄像头已就绪";
  const panelDetail = panelIssue
    ? aiError && canAskAi
      ? `${aiError} 已保留当前问题和画面，点击重试提问 AI。`
      : panelIssue
    : isThinking
      ? isAiResponseSlow
        ? "网络较慢，正在等待 AI 响应..."
        : "系统正在把当前画面和问题发送给 AI。"
      : isSpeaking
        ? "回答正在朗读，字幕会同步显示在画面下方。"
        : isFollowUpListening && isListening
          ? "回答朗读完毕，麦克风已保持开启；直接说追问即可。15 秒无声音会自动停止。"
        : isListening
          ? "说完后稍等片刻，系统会自动抓取画面并提问。"
          : answer
            ? "可以直接开始下一轮，也可以重播或清空当前回答。"
            : canAskAi
              ? "下一步是把本轮问题和画面发送给 AI。"
              : frameStatus === "capturing"
                ? "请保持画面稳定，抓帧完成后会继续下一步。"
                : hasQuestion
                  ? "下一步需要抓取当前画面，系统随后会自动或手动提问。"
                  : speechStatus === "unsupported" || speechStatus === "error"
                    ? `${speechCopy.message} 也可以直接输入问题。`
                    : microphoneCopy.tone === "error"
                      ? microphoneCopy.message
                      : isMicrophoneReady
                        ? "点击开始对话后直接说出你的问题。"
                        : "点击开始对话，系统会请求麦克风权限并开始聆听。";
  const askAiWithFrame = useCallback((imageDataUrl: string, prompt: string) =>
    askVisionQuestion({
      prompt,
      imageDataUrl,
    }), [askVisionQuestion]);

  const handleAskAi = () => {
    if (!frame || !canAskAi) {
      return;
    }

    void askAiWithFrame(frame.dataUrl, questionText);
  };

  const handleCaptureFrame = () => {
    void captureFrame(getVideoElement(), frameCaptureMode);
  };

  const handleFrameCaptureModeChange = (mode: FrameCaptureMode) => {
    setFrameCaptureMode(mode);

    if (frame && frame.mode !== mode) {
      clearFrame();
    }
  };

  const handleCopyAnswer = async (text: string, target: CopyTarget) => {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(target);
      setCopyError("");

      window.setTimeout(() => {
        setCopiedTarget(null);
      }, 1600);
    } catch {
      setCopiedTarget(null);
      setCopyError("复制失败，请手动选中文本复制。");
    }
  };

  const handleStartVoiceConversation = async () => {
    prime();
    setIsFollowUpListening(false);

    if (isListening) {
      stopListening();
      return;
    }

    if (!isSpeechSupported || speechStatus === "stopping") {
      return;
    }

    clearTranscript();
    setFallbackQuestion("");
    autoAskedQuestionRef.current = "";

    const microphoneReady = isMicrophoneReady || (await startMicrophone());

    if (!microphoneReady) {
      return;
    }

    startListening();
  };

  const handleStartCamera = () => {
    prime();
    void startCamera();
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
      setIsFollowUpListening(false);
      setCopiedTarget(null);
      setCopyError("");
      stop();
    }
  }, [answer, stop]);

  useEffect(() => {
    if (!isThinking) {
      setIsAiResponseSlow(false);
      return;
    }

    setIsAiResponseSlow(false);
    const timeoutId = window.setTimeout(() => {
      setIsAiResponseSlow(true);
    }, SLOW_AI_RESPONSE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isThinking]);

  useEffect(() => {
    if (!completedUtterance || completedUtterance.id === lastFollowUpCompletionRef.current) {
      return;
    }

    lastFollowUpCompletionRef.current = completedUtterance.id;

    if (
      completedUtterance.text !== answer ||
      !isReady ||
      !isSpeechSupported ||
      !isMicrophoneReady ||
      isThinking ||
      isListening ||
      speechStatus === "stopping"
    ) {
      return;
    }

    clearTranscript();
    setFallbackQuestion("");
    autoAskedQuestionRef.current = "";
    setIsFollowUpListening(true);
    startListening();
  }, [
    answer,
    clearTranscript,
    completedUtterance,
    isListening,
    isMicrophoneReady,
    isReady,
    isSpeechSupported,
    isThinking,
    speechStatus,
    startListening,
  ]);

  useEffect(() => {
    if (speechStatus === "error" || speechStatus === "unsupported") {
      setIsFollowUpListening(false);
    }
  }, [speechStatus]);

  useEffect(() => {
    if (!isFollowUpListening || !isListening || transcript.trim() || interimTranscript.trim()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsFollowUpListening(false);
      stopListening();
    }, FOLLOW_UP_IDLE_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [interimTranscript, isFollowUpListening, isListening, stopListening, transcript]);

  const handleFallbackVisualQuestion = async () => {
    if (!canCaptureFrame || isThinking) {
      return;
    }

    const nextFrame = await captureFrame(getVideoElement(), frameCaptureMode);

    if (!nextFrame) {
      return;
    }

    const nextQuestion = questionText || FALLBACK_VISUAL_QUESTION;
    setFallbackQuestion(nextQuestion);

    await askAiWithFrame(nextFrame.dataUrl, nextQuestion);
  };

  useEffect(() => {
    if (!transcript.trim() || interimTranscript.trim() || !isReady || isThinking) {
      return;
    }

    const prompt = transcript.trim();

    if (prompt === autoAskedQuestionRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!prompt || prompt === autoAskedQuestionRef.current) {
        return;
      }

      autoAskedQuestionRef.current = prompt;
      setIsFollowUpListening(false);
      stopListening();

      void (async () => {
        const nextFrame = await captureFrame(getVideoElement(), frameCaptureMode);

        if (!nextFrame) {
          autoAskedQuestionRef.current = "";
          return;
        }

        await askAiWithFrame(nextFrame.dataUrl, prompt);
      })();
    }, AUTO_ASK_SILENCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [
    askAiWithFrame,
    captureFrame,
    frameCaptureMode,
    getVideoElement,
    interimTranscript,
    isReady,
    isThinking,
    stopListening,
    transcript,
  ]);

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
              <Orb className="size-[88px]" size="sm" state={orbState} />
              <DialogueStatus
                detail={dialogueDetail}
                signals={dialogueSignals}
                state={orbState}
                title={dialogueTitle}
                tone={dialogueTone}
              />
            </div>
          )}

          <AnimatePresence>
            {isReady && isThinking && (
              <motion.div
                aria-live="polite"
                className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-background/58 px-6 text-center backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="grid justify-items-center gap-4">
                  <Orb className="size-[min(42vw,180px)]" size="lg" state="thinking" />
                  <div className="grid gap-1">
                    <p className="m-0 text-base font-bold text-amber-100 md:text-lg">
                      {isAiResponseSlow ? "网络较慢，正在等待 AI 响应..." : "正在理解画面"}
                    </p>
                    <p className="m-0 max-w-[18rem] text-sm leading-relaxed text-slate-200">
                      {isAiResponseSlow
                        ? "问题和画面已保留，响应返回后会继续生成回答。"
                        : "已收到问题和当前画面，正在生成回答。"}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isReady && (
            <div className="relative grid self-center justify-self-center justify-items-center gap-5 px-5 pb-14 text-center">
              <div className="relative aspect-square w-[min(66vw,300px)]">
                <div className="absolute inset-0 rounded-full border border-slate-200/35" />
                <div className="absolute inset-[12%] rounded-full border border-accent/35" />
                <div className="absolute inset-[24%] rounded-full border border-accent/35" />
                <div className="absolute inset-0 grid place-items-center">
                  {cameraCopy.tone === "error" ? (
                    <div className="grid size-[min(42vw,180px)] place-items-center rounded-full border border-warning/45 bg-warning/10 shadow-[0_0_42px_rgba(248,196,93,0.24)]">
                      <CameraOff className="size-14 text-warning" aria-hidden="true" />
                    </div>
                  ) : (
                    <Orb className="size-[min(48vw,220px)]" size="lg" state={orbState} />
                  )}
                </div>
                <div className="scan-line absolute left-[12%] top-[18%] h-0.5 w-[76%] bg-accent shadow-[0_0_18px_rgba(94,234,212,0.7)]" />
              </div>
              <Button
                className="min-h-[56px] w-[min(78vw,320px)] text-base shadow-[0_18px_48px_rgba(94,234,212,0.18)]"
                disabled={status === "requesting"}
                onClick={handleStartCamera}
                type="button"
              >
                <Camera aria-hidden="true" className="size-5" />
                {status === "requesting" ? cameraCopy.action : "开始对话"}
              </Button>
            </div>
          )}

          <div
            className="absolute bottom-3.5 left-3.5 right-3.5 z-30 flex min-h-11 items-center gap-2.5 rounded-card border border-panel-border bg-background/72 px-3.5 text-sm text-slate-300 backdrop-blur-md"
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

          {isReady ? (
            <>
              <section className="grid gap-3 rounded-card border border-accent/30 bg-white/7 p-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
                <div className="grid gap-1" aria-live="polite">
                  <p className="m-0 text-xs font-bold uppercase text-[#8dd3c7]">当前步骤</p>
                  <h2 className="m-0 text-xl leading-tight text-slate-50">{panelTitle}</h2>
                  <p className="m-0 text-sm leading-relaxed text-slate-300">{panelDetail}</p>
                </div>

                {shouldShowTextQuestionInput && (
                  <label className="grid gap-2">
                    <span className="text-xs font-bold uppercase text-muted">文本问题</span>
                    <textarea
                      aria-label="输入文本问题"
                      className="min-h-[92px] w-full resize-none rounded-card border border-panel-border bg-background/62 px-3 py-2.5 text-sm leading-relaxed text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
                      onChange={(event) => setFallbackQuestion(event.target.value)}
                      placeholder="输入你想问 AI 的问题"
                      value={fallbackQuestion}
                    />
                  </label>
                )}

                {isReady && !isThinking && (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="m-0 text-xs font-bold uppercase text-muted">抓帧模式</p>
                      <div className="grid grid-cols-2 gap-1 rounded-card border border-panel-border bg-background/48 p-1">
                        <Button
                          className="min-h-9 px-3 text-xs"
                          onClick={() => handleFrameCaptureModeChange("low")}
                          type="button"
                          variant={frameCaptureMode === "low" ? "default" : "ghost"}
                        >
                          低清
                        </Button>
                        <Button
                          className="min-h-9 px-3 text-xs"
                          onClick={() => handleFrameCaptureModeChange("high")}
                          type="button"
                          variant={frameCaptureMode === "high" ? "default" : "ghost"}
                        >
                          高清
                        </Button>
                      </div>
                    </div>
                    <p className="m-0 text-xs leading-relaxed text-muted">{frameCaptureModeDetail}</p>
                  </div>
                )}

                {answer && !isListening && !isThinking && (
                  <div className="grid gap-3 rounded-card border border-panel-border bg-background/48 p-3">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="m-0 text-xs font-bold uppercase text-muted">回答摘要</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={!answerSummary}
                            onClick={() => void handleCopyAnswer(answerSummary, "summary")}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            {copiedTarget === "summary" ? (
                              <Check aria-hidden="true" className="size-4" />
                            ) : (
                              <Copy aria-hidden="true" className="size-4" />
                            )}
                            {copiedTarget === "summary" ? "已复制" : "复制摘要"}
                          </Button>
                          <Button
                            onClick={() => void handleCopyAnswer(answer, "answer")}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            {copiedTarget === "answer" ? (
                              <Check aria-hidden="true" className="size-4" />
                            ) : (
                              <Copy aria-hidden="true" className="size-4" />
                            )}
                            {copiedTarget === "answer" ? "已复制" : "复制全文"}
                          </Button>
                        </div>
                      </div>
                      <p className="m-0 text-sm leading-relaxed text-slate-100">{answerSummary}</p>
                      {copyError && <p className="m-0 text-xs text-warning">{copyError}</p>}
                    </div>
                    <div className="max-h-36 overflow-auto text-sm leading-relaxed text-slate-200">
                      <p className="m-0">{answer}</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <p className="m-0 text-xs font-bold uppercase text-muted">下一步</p>
                  {panelIssue ? (
                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                      {frameError && (
                        <Button disabled={!canCaptureFrame} onClick={handleCaptureFrame} type="button">
                          <Image aria-hidden="true" className="size-5" />
                          重新抓取画面
                        </Button>
                      )}
                      {aiError && (
                        <Button disabled={!canAskAi} onClick={handleAskAi} type="button">
                          <Send aria-hidden="true" className="size-5" />
                          重试提问 AI
                        </Button>
                      )}
                      {synthesisError && answer && (
                        <Button
                          disabled={synthesisStatus === "unsupported"}
                          onClick={() => speak(answer)}
                          type="button"
                        >
                          <Volume2 aria-hidden="true" className="size-5" />
                          重播回答
                        </Button>
                      )}
                      {!frameError && !aiError && (!synthesisError || !answer) && (
                        <Button
                          disabled={!isSpeechSupported || isVoiceBusy}
                          onClick={handleStartVoiceConversation}
                          type="button"
                        >
                          <Mic aria-hidden="true" className="size-5" />
                          重新开始对话
                        </Button>
                      )}
                    </div>
                  ) : isThinking ? (
                    <Button onClick={cancelRequest} type="button" variant="secondary">
                      <Square aria-hidden="true" className="size-4" />
                      取消生成
                    </Button>
                  ) : isSpeaking ? (
                    <Button disabled={!isSpeaking} onClick={stop} type="button" variant="secondary">
                      <Square aria-hidden="true" className="size-4" />
                      停止朗读
                    </Button>
                  ) : isListening ? (
                    <Button onClick={handleStartVoiceConversation} type="button">
                      <Mic aria-hidden="true" className="size-5" />
                      停止聆听
                    </Button>
                  ) : answer ? (
                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                      <Button
                        disabled={!isSpeechSupported || isVoiceBusy}
                        onClick={handleStartVoiceConversation}
                        type="button"
                      >
                        <Mic aria-hidden="true" className="size-5" />
                        开始下一轮
                      </Button>
                      <Button
                        disabled={synthesisStatus === "unsupported"}
                        onClick={() => speak(answer)}
                        type="button"
                        variant="secondary"
                      >
                        <Volume2 aria-hidden="true" className="size-5" />
                        重播回答
                      </Button>
                      <Button onClick={clearAnswer} type="button" variant="ghost">
                        <Trash2 aria-hidden="true" className="size-4" />
                        清空回答
                      </Button>
                    </div>
                  ) : canAskAi ? (
                    <Button disabled={!canAskAi} onClick={handleAskAi} type="button">
                      <Send aria-hidden="true" className="size-5" />
                      提问 AI
                    </Button>
                  ) : hasQuestion ? (
                    <Button disabled={!canCaptureFrame} onClick={handleCaptureFrame} type="button">
                      <Image aria-hidden="true" className="size-5" />
                      {frameStatus === "capturing" ? "抓取中..." : "抓取画面"}
                    </Button>
                  ) : speechStatus === "unsupported" || speechStatus === "error" ? (
                    <Button disabled type="button" variant="secondary">
                      <Keyboard aria-hidden="true" className="size-5" />
                      先输入问题
                    </Button>
                  ) : (
                    <Button
                      disabled={!isSpeechSupported || isVoiceBusy}
                      onClick={handleStartVoiceConversation}
                      type="button"
                      variant={isMicrophoneReady ? "default" : "secondary"}
                    >
                      <Mic aria-hidden="true" className="size-5" />
                      {voiceAction}
                    </Button>
                  )}
                </div>
              </section>

              <details className="group rounded-card border border-panel-border bg-white/6">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-sm font-bold text-slate-200 [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-center gap-2">
                    <ListChecks aria-hidden="true" className="size-4 text-accent" />
                    本轮详情
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                  />
                </summary>

                <div className="grid gap-3 border-t border-panel-border p-3">
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

                  <div className="grid gap-2 rounded-card border border-panel-border bg-background/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="m-0 text-xs font-bold uppercase text-muted">问题</p>
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
                          <Trash2 aria-hidden="true" className="size-4" />
                          清空
                        </Button>
                      )}
                    </div>
                    <p className="m-0 text-sm leading-relaxed text-slate-200">
                      {spokenText || fallbackQuestionText || "还没有识别到问题。"}
                    </p>
                  </div>

                  <div className="grid gap-2 rounded-card border border-panel-border bg-background/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="m-0 text-xs font-bold uppercase text-muted">画面</p>
                      {frame && (
                        <Button onClick={clearFrame} size="sm" type="button" variant="ghost">
                          <Trash2 aria-hidden="true" className="size-4" />
                          清除
                        </Button>
                      )}
                    </div>
                    {frame ? (
                      <div className="grid grid-cols-[64px_1fr] items-center gap-3 text-xs text-slate-300">
                        <img
                          alt="已抓取画面预览"
                          className="h-12 w-16 rounded-card object-cover"
                          src={frame.dataUrl}
                        />
                        <span>
                          {frame.width}x{frame.height}，{frame.sizeKb} KB，
                          {frame.mode === "low" ? "低清" : "高清"}，
                          {new Date(frame.capturedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <p className="m-0 text-sm text-muted">
                        {frameStatus === "capturing" ? "正在抓取当前画面。" : "还没有抓取画面。"}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2 rounded-card border border-panel-border bg-background/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="m-0 text-xs font-bold uppercase text-muted">回答</p>
                      {model && <span className="text-xs text-muted">{model}</span>}
                    </div>
                    <p className="m-0 text-sm leading-relaxed text-slate-200">
                      {answer || "AI 回答会显示在当前步骤卡片中。"}
                    </p>
                  </div>

                  <Button
                    className="min-h-10"
                    onClick={stopCamera}
                    type="button"
                    variant="ghost"
                  >
                    <CameraOff aria-hidden="true" className="size-4" />
                    关闭摄像头
                  </Button>
                </div>
              </details>

              <section className="rounded-card border border-panel-border bg-white/6">
                <button
                  className="flex min-h-11 w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-bold text-slate-200"
                  onClick={() => setIsContextOpen((current) => !current)}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <History aria-hidden="true" className="size-4 text-accent" />
                    最近 {turns.length} 轮对话
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn("size-4 shrink-0 text-muted transition-transform", isContextOpen && "rotate-180")}
                  />
                </button>

                {isContextOpen && (
                  <div className="grid gap-2 border-t border-panel-border p-3 text-xs text-slate-300">
                    {turns.length > 0 ? (
                      turns.slice(-4).map((turn) => (
                        <div className="grid gap-1 rounded-card border border-panel-border bg-background/40 p-2" key={turn.id}>
                          <p className="m-0 text-slate-400">问：{turn.question}</p>
                          <p className="m-0 text-slate-200">答：{turn.answer}</p>
                        </div>
                      ))
                    ) : (
                      <p className="m-0 text-muted">本页还没有可带入下一轮的上下文。</p>
                    )}
                    {turns.length > 0 && (
                      <Button onClick={clearContext} size="sm" type="button" variant="ghost">
                        <Trash2 aria-hidden="true" className="size-4" />
                        清空上下文
                      </Button>
                    )}
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="rounded-card border border-panel-border bg-white/6 p-3 text-sm leading-relaxed text-slate-300">
              点击主按钮后先允许摄像头访问，随后说出你的问题。
            </div>
          )}
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
        isVoiceBusy={isVoiceBusy}
        isSpeechReady={isReady && isSpeechSupported}
        isThinking={isThinking}
        onAskAi={handleAskAi}
        onCaptureFrame={handleCaptureFrame}
        onStartCamera={handleStartCamera}
        onVoiceToggle={handleStartVoiceConversation}
        voiceAction={voiceAction}
      />
    </main>
  );
}

export default App;
