# AI 视觉对话助手

手机优先的 AI 视觉对话助手 MVP。用户授权摄像头和麦克风后，可以用语音向 AI 询问当前画面内容；系统抓取当前视频帧，调用多模态模型生成回答，并通过字幕与浏览器 TTS 播放反馈。

## 核心流程

1. 授权摄像头，进入全屏实时预览。
2. 授权麦克风，通过 Web Speech API 识别问题。
3. 抓取当前视频帧并压缩为 JPEG data URL。
4. 调用 OpenAI-compatible 多模态接口，发送文字问题 + 当前图片。
5. 展示 AI 回答，自动朗读并显示底部字幕。
6. 当前页面内保留最近 4 轮文本上下文，刷新后清空。

## 当前功能

- PR1: Vite + React + TypeScript 项目骨架
- PR2: UI 基础，包含 Tailwind CSS、shadcn/ui 基础结构、Framer Motion
- PR3: 手机调试环境，包含 HTTPS dev server、vConsole、ngrok 脚本
- PR4: 摄像头模块，包含权限获取、全屏视频背景、失败重试反馈
- PR5: 麦克风与语音识别，包含权限获取、Web Speech API、实时 transcript
- PR6: 视频帧抓取，包含 canvas 截图、JPEG 压缩、抓帧元信息
- PR7: API 层，封装 OpenAI-compatible 多模态请求
- PR8: 多模态对话，支持图片帧 + 文字 -> AI 回答
- PR9: 当前页面内存态多轮上下文
- PR10: 截图提问兜底模式
- PR11: Orb 状态机与动效
- PR12: TTS 语音合成与字幕浮层
- PR13: Orb 与对话系统状态整合
- PR14: 手机触控栏与安全区适配

## 本地开发

```bash
npm install
npm run dev
npm run build
```

默认开发地址：

```text
http://127.0.0.1:5173/
```

手机 Safari 调试需要 HTTPS：

```bash
copy .env.example .env
npm run dev:https
npm run tunnel
```

`npm run tunnel` 依赖本机已安装并登录 ngrok。脚本会把本地 HTTPS 服务暴露给手机访问。

## 环境变量

复制 `.env.example` 为 `.env` 后按需修改：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_ENABLE_VCONSOLE` | `false` | dev 模式是否注入 vConsole，方便手机查看日志 |
| `VITE_AI_API_BASE_URL` | `https://api.icodeeasy.cc` | OpenAI-compatible API base URL |
| `VITE_AI_MODEL` | `gemini-3.1-flash` | 多模态模型 ID |

API key 不写入 `.env`、源码、localStorage 或 sessionStorage，只在当前页面会话中通过输入框传给 API 层。

## 第三方依赖

运行时依赖：

| 依赖 | 用途 |
| --- | --- |
| React / React DOM | 前端 UI 渲染 |
| Framer Motion | Orb、字幕和页面状态动效 |
| lucide-react | 图标 |
| @radix-ui/react-slot | shadcn/ui Button 组合能力 |
| class-variance-authority | Button variant 管理 |
| clsx | 条件 className 拼接 |
| tailwind-merge | Tailwind class 合并 |

开发依赖：

| 依赖 | 用途 |
| --- | --- |
| Vite | 本地开发服务器与生产构建 |
| TypeScript | 类型检查 |
| Tailwind CSS / @tailwindcss/vite | 样式系统 |
| @vitejs/plugin-react | React 编译支持 |
| @vitejs/plugin-basic-ssl | 本地 HTTPS 开发服务器 |
| vConsole | 手机浏览器调试面板 |
| @types/node / @types/react / @types/react-dom | TypeScript 类型声明 |

## 原创功能

- 面向手机 Safari 的视觉对话体验设计。
- Orb 状态机：idle / listening / thinking / speaking 四态视觉反馈。
- 单帧抓取式多模态对话，避免连续上传视频流，控制带宽和模型成本。
- 当前页面内存态上下文：最多携带最近 4 轮文本问答，不持久化历史。
- 截图提问兜底：用户不说话也可以点击预览画面触发视觉描述。
- 浏览器端 TTS + 字幕浮层：不增加后端音频生成成本。
- 移动端底部触控栏：把 Camera / Voice / Frame / Ask 固定到拇指区。

## 验证方式

基础验证：

```bash
npm run build
```

浏览器验证：

- 桌面访问 `http://127.0.0.1:5173/`，确认页面无 Vite error overlay。
- 移动视口 `390x844` 和 `375x667`，确认无横向溢出。
- 无摄像头/无麦克风环境下，确认失败反馈可见且不会暴露不可用的假入口。

真机验证：

- 使用 `npm run dev:https` 和 `npm run tunnel` 在手机 Safari 打开页面。
- 授权摄像头和麦克风。
- 验证语音识别、抓帧、AI 回答、TTS、字幕和底部触控栏。

## 设计文档

产品设计、用户故事、状态机和成本控制策略见 [docs/design.md](docs/design.md)。

## MVP 边界

- 不做登录。
- 不做历史记录。
- 不做长期上下文持久化。
- 不连续上传视频流，只在需要时抓取单帧。
- API key 只保留在当前页面 React state 中。

## 目录结构

```text
src/
├── components/
│   ├── ui/
│   ├── Caption.tsx
│   ├── DialogueStatus.tsx
│   ├── MobileActionBar.tsx
│   └── Orb.tsx
├── hooks/
│   ├── useAiChat.ts
│   ├── useCamera.ts
│   ├── useFrameCapture.ts
│   ├── useMicrophone.ts
│   ├── useOrbState.ts
│   ├── useSpeechRecognition.ts
│   └── useSpeechSynthesis.ts
├── lib/
│   ├── api.ts
│   └── utils.ts
├── App.tsx
├── main.tsx
├── styles.css
└── vite-env.d.ts
```
