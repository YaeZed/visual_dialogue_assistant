# AI 视觉对话助手

一个手机优先的 AI 视觉对话助手。用户打开页面后授权摄像头和麦克风，直接用语音询问眼前画面，系统会抓取当前视频帧，让多模态模型生成回答，并通过字幕和浏览器语音朗读反馈。

## demo演示：https://www.bilibili.com/video/BV1s2JA6TExP/?vd_source=f17390a213467539959476705fa98c93

## 设计文档

- [docs/product-design-summary.md](docs/product-design-summary.md)：功能计划与最终实现、运营成本控制思路和实际采用策略。
- [docs/design.md](docs/design.md)：用户体验、状态机、交互路径和成本控制细节。
- [docs/task_plan.md](docs/task_plan.md)、[docs/findings.md](docs/findings.md)、[docs/progress.md](docs/progress.md)：开发规划、过程发现和进度记录。

## 项目演示场景

| 场景 | 用户操作 | 系统反馈 |
|------|----------|----------|
| 首次使用 | 点击“开始对话”并授权摄像头、麦克风 | 进入实时画面，Orb 显示当前状态 |
| 语音提问 | 对着手机说出问题 | 自动识别问题、抓取当前画面并提交给 AI |
| AI 思考 | 等待模型返回 | 视频区域显示思考遮罩和等待反馈 |
| 回答播放 | AI 返回结果 | 展示回答、生成摘要、自动朗读并显示字幕 |
| 继续追问 | 回答朗读结束后继续说话 | 自动进入追问聆听，复用最近上下文 |
| 语音不可用 | 输入文本问题 | 使用文本问题和当前画面继续提问 |
| 弱网使用 | 切换低清抓帧或重试 | 降低图片体积，失败后保留问题和画面 |

## 核心功能

| 模块 | 功能 | 说明 |
|------|------|------|
| 摄像头预览 | 后置摄像头实时画面 | 面向手机 Safari 的全屏视觉体验 |
| 语音输入 | Web Speech API 识别问题 | 说完后自动进入抓帧提问流程 |
| 文本兜底 | 显式文本问题输入 | 覆盖语音识别不可用或不方便说话的场景 |
| 单帧抓取 | Canvas 截取当前视频帧 | 不上传连续视频流，降低带宽和模型成本 |
| 抓帧模式 | 低清 / 高清两档 | 低清优先速度，高清优先细节识别 |
| 多模态问答 | 图片帧 + 文本问题 | 通过本地后端代理调用 `qwen-vl-plus` |
| Orb 状态机 | idle / listening / thinking / speaking | 用视觉状态告诉用户系统正在做什么 |
| 语音回答 | 浏览器 TTS + 字幕 | 不额外生成音频文件，降低服务端成本 |
| 自动追问 | 回答后继续聆听 | 15 秒无新语音时自动停止 |
| 回答复用 | 摘要和复制全文 | 便于把回答粘贴到其他工具 |
| 失败恢复 | 慢响应、失败重试、保留输入 | 弱网或 AI 失败时减少重复操作 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
copy .env.example .env
```

填写后端模型密钥：

```env
VITE_ENABLE_VCONSOLE=true
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8787
AI_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-vl-plus
AI_API_KEY=your_dashscope_api_key
```

`AI_API_KEY` 只放在本地 `.env` 中，由 Node 后端代理读取。不要写入 `VITE_*` 前端变量、源码或浏览器存储。

### 3. 启动开发服务

```bash
npm run dev
```

默认地址：

| 服务 | 地址 |
|------|------|
| 前端 Vite | `http://127.0.0.1:5173/` |
| 后端代理 | `http://127.0.0.1:8787/` |

检查后端是否已读取 API key：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8787/api/health
```

返回中应包含：

```json
{"ok":true,"model":"qwen-vl-plus","providerConfigured":true}
```

### 4. 手机 Safari 测试

iOS Safari 调用摄像头和麦克风需要 HTTPS。先保持 `npm run dev` 运行，再开一个终端：

```bash
npm run tunnel
```

脚本会通过 ngrok 暴露本地前端服务。将输出的 HTTPS 地址复制到手机 Safari 打开。

如果 ngrok 提示 endpoint 已在线，说明已有隧道在运行。可以打开 `http://127.0.0.1:4040` 查看当前公网地址，或结束旧的 ngrok 进程后重试。

## 使用流程

1. 手机 Safari 打开 ngrok HTTPS 地址。
2. 点击“开始对话”。
3. 允许摄像头和麦克风权限。
4. 对着手机说出问题。
5. 系统在语音稳定后自动抓取当前画面。
6. 后端代理调用多模态模型生成回答。
7. 页面展示回答摘要、完整回答和字幕，并朗读回答。
8. 回答结束后可继续追问，或复制摘要/全文。

## 技术架构

```text
手机 Safari
  |
  | 摄像头 / 麦克风 / Web Speech API
  v
Vite React 前端
  |
  | 当前问题 + 当前视频帧 JPEG data URL
  v
Node 本地后端代理
  |
  | AI_API_KEY 仅在服务端读取
  v
DashScope OpenAI-compatible API
  |
  v
qwen-vl-plus 多模态回答
```

## 目录结构

```text
backend/
└── server.mjs          # 本地 AI API 代理，读取 AI_API_KEY

frontend/
├── src/
│   ├── components/     # 业务 UI 组件
│   ├── hooks/          # 摄像头、抓帧、语音识别、TTS、AI 状态 hooks
│   ├── lib/            # 前端 API client 与工具函数
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── vite-env.d.ts
├── index.html
├── vite.config.ts
└── tsconfig.json

docs/
├── design.md
├── product-design-summary.md
├── e2e-device-test-checklist.md
├── task_plan.md
├── findings.md
└── progress.md

scripts/
├── dev.mjs             # 同时启动前端和后端
└── start-ngrok.ps1     # 手机 HTTPS 隧道
```

## 命令说明

| 命令 | 用途 |
|------|------|
| `npm run dev` | 同时启动前端 Vite 和后端代理 |
| `npm run dev:https` | 以 HTTPS 模式启动本地开发服务 |
| `npm run tunnel` | 通过 ngrok 暴露前端地址给手机 Safari |
| `npm run build` | TypeScript 检查并构建前端产物 |
| `npm run preview` | 本地预览构建产物 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_ENABLE_VCONSOLE` | `false` | dev 模式是否注入 vConsole，方便手机查看日志 |
| `BACKEND_HOST` | `127.0.0.1` | 本地后端代理监听地址 |
| `BACKEND_PORT` | `8787` | 本地后端代理端口 |
| `AI_API_BASE_URL` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | OpenAI-compatible API base URL |
| `AI_MODEL` | `qwen-vl-plus` | 多模态视觉模型 ID |
| `AI_API_KEY` | 空 | 后端代理使用的模型 API key |

## 第三方依赖

### 运行时依赖

| 依赖 | 用途 |
|------|------|
| React / React DOM | 前端 UI 渲染 |
| Framer Motion | Orb、遮罩、状态切换和字幕动效 |
| lucide-react | 操作图标 |
| @radix-ui/react-slot | shadcn/ui Button 组合能力 |
| class-variance-authority | Button variant 管理 |
| clsx | 条件 className 拼接 |
| tailwind-merge | Tailwind class 合并 |

### 开发依赖

| 依赖 | 用途 |
|------|------|
| Vite | 本地开发服务器与生产构建 |
| TypeScript | 类型检查 |
| Tailwind CSS / @tailwindcss/vite | 样式系统 |
| @vitejs/plugin-react | React 编译支持 |
| @vitejs/plugin-basic-ssl | 本地 HTTPS 开发服务器 |
| vConsole | 手机浏览器调试面板 |
| @types/node / @types/react / @types/react-dom | TypeScript 类型声明 |

## 原创功能说明

- 手机 Safari 优先的视觉对话交互流程。
- 本地后端代理保管 API key，前端不接触真实密钥。
- Orb 四态状态机：待机、聆听、思考、说话。
- 单帧抓取式多模态对话，避免连续上传视频流。
- 低清/高清抓帧模式，在弱网速度和识别细节之间切换。
- 回答后自动追问聆听，并在静默超时后停止。
- 文本输入兜底，覆盖语音识别不可用的浏览器。
- 回答摘要、复制摘要和复制全文。
- 弱网慢响应提示和失败后保留问题/画面重试。
- 端到端真机测试清单，覆盖 iOS Safari 权限和 ngrok 隧道。

## 测试与验收

基础回归：

```bash
npm run build
```

浏览器检查：

- 桌面访问 `http://127.0.0.1:5173/`，确认页面无 Vite error overlay。
- 移动视口 `390x844`，确认无横向溢出。
- 无摄像头/无麦克风环境下，确认失败反馈可见且不会暴露不可用入口。

真机检查：

- 使用 `npm run dev` 和 `npm run tunnel` 在手机 Safari 打开页面。
- 授权摄像头和麦克风。
- 验证语音识别、自动抓帧、AI 回答、TTS、字幕、自动追问、文本兜底、低清/高清抓帧和复制功能。
- 详细用例见 [docs/e2e-device-test-checklist.md](docs/e2e-device-test-checklist.md)。


