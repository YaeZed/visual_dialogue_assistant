# AI 视觉对话助手 - 项目规范

## 项目目标
构建一个手机 Safari 可演示的 AI 视觉对话助手：用户打开页面后授权摄像头与麦克风，通过语音提问，系统抓取当前画面并让多模态模型给出语音与字幕回应。

## 当前 MVP 边界
- 核心闭环：摄像头预览 -> 语音识别 -> 抓取单帧 -> 多模态请求 -> 字幕展示 -> TTS 播放。
- 不做登录、不做历史记录、不做长期上下文持久化。
- 成本优先：按需单帧抓取，不做连续视频流上传。

## 技术栈
- Vite + React + TypeScript
- shadcn/ui + Tailwind CSS + Framer Motion
- 中转站 API: `https://api.icodeeasy.cc`
- 多模态模型: Gemini 3.1 Flash（主力），GPT image2（备选）
- 语音识别: Web Speech API
- 语音合成: Web Speech API TTS
- 调试: dev 模式注入 vConsole

## 目录结构约定
```
docs/
├── design.md         # 产品设计说明、用户故事、成本控制策略

src/
├── components/       # 业务 UI 组件
│   ├── ui/           # shadcn/ui 基础组件
│   ├── Orb.tsx       # Orb 发光实体
│   ├── Caption.tsx   # 字幕浮层
│   ├── DialogueStatus.tsx # 对话状态整合层
│   └── MobileActionBar.tsx # 手机底部触控栏
├── hooks/            # 自定义 hooks
│   ├── useCamera.ts
│   ├── useMicrophone.ts
│   ├── useSpeechRecognition.ts
│   ├── useFrameCapture.ts
│   ├── useAiChat.ts
│   ├── useOrbState.ts
│   └── useSpeechSynthesis.ts
├── lib/              # 工具函数与 API 封装
│   ├── api.ts
│   └── utils.ts
├── App.tsx
├── main.tsx
└── styles.css
```

新增项目级文档放在 `docs/`，文件名使用短横线或语义名，优先服务评审复现和后续维护；临时排查材料不进入 `docs/`。

## 开发命令
依赖安装后使用：
```bash
npm run dev
npm run build
npm run preview
```

手机测试阶段使用本地 HTTP dev server 与 ngrok HTTPS 隧道：
```bash
npm run dev
npm run tunnel
```

## 产品与交互原则
- 第一屏必须是可操作产品界面，不做营销页。
- 移动端 Safari 优先，所有主要操作必须适合单手触控。
- 反馈要能指导下一步：权限失败、网络失败、模型失败都要给出恢复路径。
- 系统承担复杂度：能自动推断的状态不要求用户手动选择。

## PR 与提交规范
- 每个 PR 只做一件事，粒度尽可能细。
- commit message 使用英文，简洁描述变更意图。
- README 必须列明第三方依赖和原创功能部分。
- 复用自己过往代码时必须在 PR 描述中注明来源。
- `git push` 只用于跨设备同步，必须等用户明确要求。

## Orb 状态机
```
idle（灰色静态） -> listening（蓝色脉动） -> thinking（金色旋转） -> speaking（绿色波纹） -> idle
```
