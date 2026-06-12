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
