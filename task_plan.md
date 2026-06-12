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
Phase 1

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

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Vite + React + TypeScript | 热更新快，手机浏览器兼容，AI SDK 生态好 |
| shadcn/ui + Tailwind + Framer Motion | 组件精致，动效强，暗色模式开箱即用 |
| Web Speech API 语音识别 | 浏览器端免费，不消耗 token |
| Orb 发光实体交互隐喻 | 视觉辨识度高，科幻感，交互目标明确 |
| 视频帧抓取而非流式传输 | 大幅降低带宽和 token 消耗 |
| Gemini 3.1 Flash 主力模型 | 多模态 + 低成本 + 速度快 |
| HTTPS + ngrok 隧道 | iOS Safari 要求 HTTPS 才允许 getUserMedia |
| vConsole 注入调试 | Windows 无法用 Safari Web Inspector |

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
