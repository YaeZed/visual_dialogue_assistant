# Findings & Decisions

## Requirements
- 打开摄像头与麦克风，让 AI 看到视频内容、听到用户说话，并给予恰当回应
- 视觉内容理解准确、语音交互自然流畅、端云协同成本可控
- 手机 Safari 浏览器测试（iOS）
- 交互新颖性突出（Orb 发光实体状态可视化）
- 多轮对话能力
- 截图提问兜底模式（不语音时点击画面触发 AI 描述）
- 3 天持续交付，细粒度 PR，全周期 commit 记录
- README 列明依赖 + 原创功能说明
- 设计文档：用户故事 + 运营成本控制策略

## Research Findings
- iOS Safari 要求 HTTPS 才能调用 getUserMedia（摄像头/麦克风），HTTP 下 API 不可用
- Web Speech API 在 iOS Safari 15+ 已支持 SpeechRecognition，但需用户手势触发
- shadcn/ui 基于 Radix UI，组件可访问性好，Tailwind 暗色模式支持完善
- Vite 内置 HTTPS 支持（@vitejs/plugin-basic-ssl），无需手动配证书
- ngrok 免费版支持 HTTPS 隧道，但域名每次重启变化。可考虑 cloudflared 替代
- vConsole 轻量（~200KB），dev 模式注入后悬浮按钮显示，不影响页面布局
- Gemini 2.5/3.1 Flash 是目前性价比最高的多模态模型，适合 demo 低成本运行
- 中转站 API（icodeeasy.cc）走 OpenAI 兼容格式 /v1/chat/completions
- 视频帧用 canvas.toBlob('image/jpeg', 0.6) 压缩，单帧约 50-80KB，base64 后 70-110KB

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Vite + React + TypeScript | 热更新快，手机浏览器兼容，AI SDK 生态好 |
| shadcn/ui + Tailwind + Framer Motion | 组件精致可定制，动效强，暗色模式 |
| Web Speech API（浏览器端） | 免费，不消耗 token，demo 场景够用 |
| Orb 发光实体作为交互隐喻 | 直观反映 AI 状态，视觉辨识度高，科幻感 |
| 视频帧抓取（非流式传输） | 大幅降低带宽和 token 消耗，单帧 ~50KB |
| Gemini 3.1 Flash 主力模型 | 多模态 + 低成本 + 快速响应 |
| HTTPS + ngrok 隧道 | iOS Safari 硬性要求 HTTPS |
| vConsole 注入调试 | Windows 无法用 Safari Web Inspector |
| 手机 Safari 优先测试 | 台式机无摄像头/麦克风 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 当前 shell 中 `node.exe` 拒绝访问，`npm` 不在 PATH | 提权后 `node` 可用；使用 `C:\nvm4w\nodejs\npm.cmd` 安装依赖和运行 build |
| 并行执行多个 `npm install` 会导致 `package.json` / lockfile 结果互相覆盖 | npm 安装依赖必须顺序执行 |
| Vite 6 CLI 不接受 `--https` | 使用 `@vitejs/plugin-basic-ssl` 并通过环境变量 `VITE_DEV_HTTPS=true` 在 serve 模式开启 HTTPS |
| 当前机器未安装 ngrok | 已提供 `scripts/start-ngrok.ps1`，运行时会提示安装并登录 ngrok |
| 桌面环境无可用摄像头/权限确认能力 | PR4 通过浏览器点击验证失败路径；真实视频画面需手机 Safari + HTTPS 隧道验证 |
| 桌面环境无法完成真实语音识别链路验证 | PR5 通过浏览器验证控件、失败路径和移动布局；真实语音识别需手机 Safari 用户手势触发验证 |
| 没有真实摄像头时无法验证 canvas 抓取真实画面 | PR6 通过 build 和 UI 禁用态验证；真实 JPEG 帧大小与画面需手机 Safari 验证 |
| OpenAI-compatible 视觉输入格式支持 `content` 数组中的 `image_url`，且图片可用 base64 data URL | PR7 API 层按该格式构造多模态 Chat Completions 请求；来源：https://developers.openai.com/api/docs/guides/images-vision |
| 多轮上下文不应重复上传历史图片 | PR9 只传最近 4 轮文本问答；当前图片仍以本次抓帧为准，降低 token/带宽成本 |
| 兜底截图提问必须避免误触不可用状态 | PR10 仅在摄像头可抓帧时把预览区暴露为 button；无摄像头/无权限时不提供假入口 |
| Orb 是状态可视化，不应成为新交互入口 | PR11 将 Orb 设置为 `role=img`，只表达当前 AI 状态，不抢占按钮/预览区操作 |
| TTS 与字幕不应增加后端成本 | PR12 使用浏览器 Web Speech API TTS，AI 回答在本机朗读并显示字幕，不新增服务端音频生成费用 |
| Orb 需要承载状态，不承载说明书 | PR13 在预览区增加精简对话状态层，只显示阶段、问题/画面/回答信号，不新增操作入口 |
| 手机端高频操作不应藏在滚动面板里 | PR14 增加底部安全区触控栏，保留原有面板但把 Camera / Voice / Frame / Ask 四个高频动作固定到拇指区 |
| README 必须服务评审和复现 | PR15 将 README 从进度清单升级为交付文档，明确运行命令、环境变量、依赖来源、原创功能和验证边界 |
| 设计文档需要解释取舍而不是复述功能 | PR16 从用户故事、状态机、失败恢复和成本控制角度解释为什么采用单帧抓取、文本上下文和浏览器端语音能力 |
| Vite `VITE_*` 环境变量不适合保存真实 API key | PR20 增加本地 Node 后端代理，前端只请求 `/api/vision-chat`，后端从 `.env` 读取 `AI_API_KEY` 后调用 DashScope |
| 语音入口不应拆成麦克风授权和语音识别两个按钮 | PR21 用单个“开始对话”动作串联麦克风授权与 Web Speech 识别；失败文案仍区分麦克风权限和浏览器语音识别能力 |
| 视觉问答默认路径应自动抓帧并提问 | PR21 在最终语音文本稳定后等待短暂静默，自动抓取当前帧并调用 `askVisionQuestion`；手动抓帧/提问按钮保留为兜底 |
| AI 请求等待期需要占据主视觉区域 | PR22 在视频区域叠加半透明遮罩和居中 thinking Orb，让用户明确系统已进入理解画面/生成回答阶段 |
| 首屏应把 Orb 和启动动作放到主视觉区 | PR23 摄像头未开启时用大 Orb 和主按钮承载首次启动，右侧面板不再重复显示第二个摄像头按钮 |
| 右侧面板应从状态清单转为行动面板 | PR24 默认只展示当前步骤和下一步按钮，把流程、问题、画面、回答详情和最近对话折叠，避免与视频区 `DialogueStatus` 重复 |
| 自动追问只能在已授权麦克风后触发 | PR25 使用 TTS 自然结束信号触发追问聆听，但仅在麦克风已就绪时自动启动，避免绕过 iOS Safari 的用户手势权限约束 |

## Resources
- Vite HTTPS plugin: @vitejs/plugin-basic-ssl
- shadcn/ui: https://ui.shadcn.com/
- Framer Motion: https://www.framer.com/motion/
- vConsole: https://github.com/Tencent/vConsole
- ngrok: https://ngrok.com/
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- API base URL: https://api.icodeeasy.cc
- 多模态模型: GPT image2, Gemini 3.1 Flash

## Visual/Browser Findings
-
