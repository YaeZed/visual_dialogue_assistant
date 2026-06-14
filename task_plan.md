# Task Plan: AI 视觉对话助手 MVP

## Goal
构建 AI 视觉对话助手 Web 应用——打开摄像头即可与 AI 进行双向语音+视觉对话。3 天内持续交付，拆分为细粒度 PR，每个 PR 做一件事。

## 竞赛约束（必须遵守）
- 每个 PR 只做一件事，粒度尽可能细
- 全周期持续提交 commit，时间戳均匀分布在开发期内
- PR 标题 + 功能描述 + 实现思路 + 测试方式，缺一不可
- README 需列明所有第三方依赖，并说明原创功能部分
- 复用自己过往代码需在 PR 描述中注明来源
- 严禁最后一天一次性导入

## Current Phase
Phase 6 / PR26

## PR 拆分计划（与 Phase 对应）

### Phase 0: 项目初始化（Day 1 上午）
| PR# | 内容 | 依赖 |
|-----|------|------|
| PR1 | 项目脚手架：Vite + React + TypeScript | - |
| PR2 | UI 基础：shadcn/ui + Tailwind + Framer Motion | PR1 |
| PR3 | 开发环境：HTTPS + ngrok 隧道脚本 + vConsole 注入 | PR1 |

### Phase 1: 媒体采集（Day 1 下午）
| PR# | 内容 | 依赖 |
|-----|------|------|
| PR4 | 摄像头模块：权限获取 + 全屏视频背景 | PR2 |
| PR5 | 麦克风模块：权限获取 + Web Speech API 语音识别 | PR2 |
| PR6 | 视频帧抓取：canvas 截图 + JPEG 压缩 + 语音端点检测 | PR4 |

### Phase 2: AI 对话核心（Day 2）
| PR# | 内容 | 依赖 |
|-----|------|------|
| PR7 | API 层：中转站 OpenAI 兼容接口封装 | PR1 |
| PR8 | 多模态对话：图片帧 + 文字 → AI 回应 | PR6, PR7 |
| PR9 | 多轮对话上下文管理 | PR8 |
| PR10 | 截图提问兜底模式 | PR8 |

### Phase 3: UI 与交互（Day 2 下午 - Day 3 上午）
| PR# | 内容 | 依赖 |
|-----|------|------|
| PR11 | Orb 动效核心：状态机 + 颜色/动画切换 | PR2 |
| PR12 | 语音合成 TTS + 字幕浮层 | PR8 |
| PR13 | Orb 与对话系统整合 | PR11, PR12 |
| PR14 | 手机适配 + 触控优化 | PR13 |

### Phase 4: 文档与交付（Day 3 下午）
| PR# | 内容 | 依赖 |
|-----|------|------|
| PR15 | README：依赖清单 + 原创功能说明 | 全部 |
| PR16 | 设计文档：用户故事 + 运营成本控制策略 | 全部 |

### Phase 5: 真机测试修复与本地化
| PR# | 内容 | 依赖 |
|-----|------|------|
| PR17 | 修复 ngrok 手机访问被 Vite host check 拦截 | PR16 |
| PR18 | 切换默认视觉模型到千问 DashScope | PR17 |
| PR19 | 前端中文化与 AI 错误诊断提示 | PR18 |
| PR20 | 前后端目录拆分与后端 API key 代理 | PR19 |

### Phase 6: 设计文档驱动的体验优化
| PR# | 内容 | 依赖 |
|-----|------|------|
| PR21 | P0 自动对话链路：合并麦克风/语音识别，并在语音结束后自动抓帧提问 | PR20 |
| PR22 | P1 AI 思考时沉浸式等待体验：视频遮罩、居中 Orb、等待文案 | PR21 |
| PR23 | P1 Orb 首屏视觉权重与首次启动引导 | PR22 |
| PR24 | P2 精简右侧面板信息密度：当前步骤优先、详情与上下文默认折叠 | PR23 |
| PR25 | P3 回答后自动进入追问聆听，并在静默 15 秒后停止 | PR24 |
| PR26 | P3 弱网慢响应提示：AI 请求超过 8 秒显示等待反馈 | PR25 |

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Vite + React + TypeScript | 热更新快，手机浏览器兼容，AI SDK 生态好 |
| shadcn/ui + Tailwind + Framer Motion | 组件精致，动效强，暗色模式开箱即用 |
| Web Speech API 语音识别 | 浏览器端免费，不消耗 token |
| Orb 发光实体交互隐喻 | 视觉辨识度高，科幻感，交互目标明确 |
| 视频帧抓取而非流式传输 | 大幅降低带宽和 token 消耗 |
| qwen-vl-plus 主力模型 | 真机测试已跑通 DashScope OpenAI-compatible 视觉问答，减少中转站不稳定因素 |
| HTTPS + ngrok 隧道 | iOS Safari 要求 HTTPS 才允许 getUserMedia |
| vConsole 注入调试 | Windows 无法用 Safari Web Inspector |
| 本地 Node 后端代理 | Vite 前端变量会暴露到浏览器；后端代理让 API key 留在 Node 进程和 `.env` 中 |
| P0 优化先做自动链路 | 直接减少用户完成一次视觉问答的操作数；保留手动抓帧/提问作为失败兜底，不改变成本边界 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `node --version` 执行失败：拒绝访问；`npm` 不在 PATH | 验证本地 Node/npm 可用性 | 提权后确认 `node` 可用；`npm` 路径为 `C:\nvm4w\nodejs\npm.cmd`；已用该路径安装依赖并通过 build |
| PowerShell 不支持 `&&`；并行执行两个 `npm install` 导致依赖结果被覆盖 | 安装 PR2 UI 依赖 | 改为顺序执行 npm install；已补齐 Tailwind、Framer Motion、lucide、shadcn 基础依赖并通过 build |
| Vite 6 CLI 不支持 `--https`；旧版 PowerShell 不支持 `Invoke-WebRequest -SkipCertificateCheck` | 验证 PR3 HTTPS dev server | 改为用 `VITE_DEV_HTTPS=true` 控制 `@vitejs/plugin-basic-ssl`，并用 dev server 日志确认 HTTPS 地址启动成功 |

## Notes
- 台式机无摄像头/麦克风，开发期 PC 写代码、手机 Safari 测试
- 中转站 model ID 需用户登录 icodeeasy.cc 后台确认
- 第一天至少完成 PR1-6，让手机能打开页面、看到摄像头画面、语音识别文字显示
- 2026-06-12: 已补齐 `CODEX.md`，后续按该项目规范执行。
- 2026-06-12: PR1 骨架已手工创建，包含 Vite/React/TS 配置、入口页面和基础 README；`npm run build` 已通过。
- 2026-06-12: PR1 已提交，commit `29fdbe0 Initialize Vite React project`。
- 2026-06-12: PR2 UI 基础已接入：Tailwind CSS v4、shadcn/ui 基础结构、Framer Motion、lucide icons；`npm run build` 已通过。
- 2026-06-12: PR2 已提交，commit `4def3a0 Add UI foundation`。
- 2026-06-12: PR3 开发环境已接入：HTTPS dev server、ngrok 脚本、dev 模式 vConsole 注入；`npm run build` 已通过，`npm run dev:https` 可启动 HTTPS，本机未安装 ngrok。
- 2026-06-12: PR3 已提交，commit `ce7d48e Add mobile dev environment`。Phase 1 完成，进入 Phase 2 / PR4 摄像头模块。
- 2026-06-12: PR4 摄像头模块已实现：`useCamera`、后置摄像头约束、全屏视频预览、失败/重试反馈；build 和浏览器移动视口检查通过。
- 2026-06-12: PR4 已提交，commit `fc74e08 Add camera preview module`。进入 PR5 麦克风与语音识别模块。
- 2026-06-12: PR5 麦克风与语音识别模块已实现：`useMicrophone`、`useSpeechRecognition`、Web Speech API 类型、实时 transcript UI；build 和浏览器失败路径检查通过。
- 2026-06-12: PR5 已提交，commit `6f62a43 Add speech input module`。进入 PR6 视频帧抓取模块。
- 2026-06-12: PR6 视频帧抓取模块已实现：`useFrameCapture`、canvas JPEG 压缩、data URL 预览、抓帧元信息；build 和浏览器布局检查通过。
- 2026-06-12: PR6 已提交，commit `7558827 Add frame capture module`。Phase 2 完成，进入 Phase 3 / PR7 API 层。
- 2026-06-12: PR7 API 层开发中：OpenAI-compatible Chat Completions 封装，图片输入采用 `image_url` + base64 data URL；API key 不进入源码或构建期环境变量。
- 2026-06-12: PR7 已提交，commit `6a41ef0 Add AI API client`。进入 PR8 多模态对话接入。
- 2026-06-12: PR8 开发中：新增 `useAiChat`，将 API key（仅 React state）、transcript、captured frame 组合为一次多模态请求。
- 2026-06-12: PR8 多模态对话接入已实现：Ask AI、会话内 API key、AI 请求状态、取消、回答展示；build 和浏览器布局检查通过。
- 2026-06-12: PR8 已提交，commit `6d1eb42 Connect multimodal AI request`。进入 PR9 多轮上下文管理。
- 2026-06-12: PR9 开发中：上下文仅保存在当前 React state，最多把最近 4 轮文本问答带入下一次请求，不持久化、不重复上传历史图片。
- 2026-06-12: PR9 当前页面多轮上下文已实现：最近 4 轮文本上下文、当前页面 turns、上下文清理；build 和浏览器布局检查通过。
- 2026-06-12: PR9 已提交并推送，commit `2f6dece Add in-memory conversation context`。
- 2026-06-12: PR10 截图提问兜底模式已实现：摄像头可用时点击画面抓帧并准备默认视觉问题；有 API key 时直接发起 AI 请求。
- 2026-06-12: PR10 已提交并推送，commit `cd86514 Add visual fallback question`。进入 Phase 4 / PR11 Orb 状态机。
- 2026-06-12: PR11 开发中：新增 `useOrbState` 和 `Orb`，根据 listening/thinking/speaking/idle 映射颜色与动效，并尊重 reduced-motion。
- 2026-06-12: PR11 Orb 状态机与动效已实现：idle/listening/thinking/speaking 状态映射、Orb 组件、预览区接入；build 和浏览器布局检查通过。
- 2026-06-12: PR12 开发中：新增浏览器端 TTS 朗读与底部字幕浮层，AI 回答生成后自动播放并可停止/重播。
- 2026-06-12: PR13 开发中：新增对话状态整合层，将 Orb 状态与问题、画面、回答三个关键链路信号绑定。
- 2026-06-12: PR14 开发中：新增移动端底部触控栏，并调整安全区与字幕位置，降低手机单手操作成本。
- 2026-06-12: PR15 开发中：重写 README 为交付版，补齐核心流程、依赖清单、环境变量、验证方式、原创功能和 MVP 边界。
- 2026-06-12: PR16 开发中：新增 `docs/design.md`，沉淀用户故事、交互路径、状态设计、失败恢复、成本控制和后续扩展方向。
- 2026-06-14: PR21 自动对话链路已完成验证：单一“开始对话”入口会串联麦克风授权和语音识别，最终语音文本稳定后自动抓帧并提问；手动抓帧/提问保留为兜底。
