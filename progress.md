# Progress Log

## Session: 2026-06-12

### Phase 0: 需求对齐与规划
- **Status:** complete
- **Started:** 2026-06-12
- Actions taken:
  - 通过 grill-me 技能完成 7 轮需求追问
  - 技术栈决策：Vite + React + TypeScript + shadcn/ui + Tailwind + Framer Motion
  - 交互方案：Orb 发光实体 + 视频全屏背景 + 语音双向对话
  - 确认 API 中转站 base_url=https://api.icodeeasy.cc，模型用 Gemini 3.1 Flash
  - 确认手机测试方案：HTTPS + ngrok + vConsole
  - 确认竞赛规范：细粒度 PR、持续提交、README 依赖清单
  - 创建 task_plan.md、findings.md、progress.md
- Files created/modified:
  - task_plan.md (created)
  - findings.md (created)
  - progress.md (created)

### Phase 1: 项目骨架与环境配置
- **Status:** in_progress
- Actions taken:
  - 补齐项目级 `CODEX.md`，固定目标、MVP 边界、目录结构、命令与 PR 规范
  - 手工创建 Vite + React + TypeScript 项目骨架
  - 创建 `package.json`、TypeScript 配置、Vite 配置、HTML 入口与 `src/` 初始页面
  - 创建 `.gitignore` 与初版 `README.md`
  - 验证本机 Node/npm：沙箱内 `node --version` 被拒绝访问，`npm` 不在 PATH；提权后 Node 可用
  - 使用 `C:\nvm4w\nodejs\npm.cmd install` 安装依赖
  - 使用 `C:\nvm4w\nodejs\npm.cmd run build` 完成 TypeScript + Vite 构建验证
  - 初始化 Git 仓库并提交 PR1：`29fdbe0 Initialize Vite React project`
  - 开始 PR2：接入 Tailwind CSS v4 Vite 插件、shadcn/ui 基础结构、Framer Motion 与 lucide icons
  - 创建 `components.json`、`src/lib/utils.ts`、`src/components/ui/button.tsx`
  - 将首页从手写 CSS 类迁移为 Tailwind 工具类与 Motion 进场动效
  - 顺序安装 PR2 依赖并通过 build
  - 提交 PR2：`4def3a0 Add UI foundation`
  - 开始 PR3：接入 `@vitejs/plugin-basic-ssl`、vConsole、`.env.example`、ngrok 启动脚本
  - 修复 Vite 6 不支持 CLI `--https` 的问题，改为 `VITE_DEV_HTTPS=true` 控制 basic SSL 插件
  - 验证 `npm run build` 通过
  - 验证 `npm run dev:https` 可启动 HTTPS dev server，日志显示 `https://127.0.0.1:5173/`
  - 验证 `npm run tunnel` 在未安装 ngrok 时给出明确错误
  - 提交 PR3：`ce7d48e Add mobile dev environment`
- Files created/modified:
  - CODEX.md
  - .gitignore
  - README.md
  - package.json
  - index.html
  - tsconfig.json
  - tsconfig.app.json
  - tsconfig.node.json
  - vite.config.ts
  - src/main.tsx
  - src/App.tsx
  - src/styles.css
  - src/vite-env.d.ts
  - package-lock.json
  - components.json
  - src/lib/utils.ts
  - src/components/ui/button.tsx
  - .env.example
  - scripts/start-ngrok.ps1

### Phase 2: 媒体采集与语音识别
- **Status:** in_progress
- Actions taken:
  - 开始 PR4：实现 `useCamera` hook，封装摄像头启动、停止、错误映射和组件卸载清理
  - 将首屏预览区接入真实 `<video>`，摄像头 ready 后全屏显示视频背景
  - 添加摄像头权限、无设备、通用错误的可行动反馈文案
  - 浏览器验证首屏加载、Start camera 按钮、无摄像头/无权限路径的 Retry camera 反馈
  - 移动视口 390x844 检查通过，无横向溢出
  - 提交 PR4：`fc74e08 Add camera preview module`
  - 开始 PR5：实现 `useMicrophone` hook，封装麦克风权限、音频流和错误映射
  - 实现 `useSpeechRecognition` hook，封装 Web Speech API、连续识别、interim/final transcript 和错误映射
  - 补充 Web Speech API TypeScript 类型声明
  - UI 增加麦克风授权、开始/停止识别、transcript 展示与清空入口
  - 浏览器验证语音控件可见、桌面无麦克风/无权限失败路径、移动端无横向溢出
  - 提交 PR5：`6f62a43 Add speech input module`
  - 开始 PR6：实现 `useFrameCapture` hook，从 video 元素抓取当前帧并压缩为 JPEG
  - UI 增加 `Capture frame` 入口、抓帧状态、尺寸/大小/时间元信息与预览
  - 通过 transcript/interim transcript 推导“问题已准备”信号，用于 Vision 步骤状态
  - 浏览器验证无摄像头时抓帧按钮禁用、提示可见、移动端无横向溢出
  - 提交 PR6：`7558827 Add frame capture module`
- Files created/modified:
  - src/hooks/useCamera.ts
  - src/App.tsx
  - README.md
  - src/hooks/useMicrophone.ts
  - src/hooks/useSpeechRecognition.ts
  - src/vite-env.d.ts
  - src/hooks/useFrameCapture.ts

### Phase 3: AI 对话核心
- **Status:** pending
- Actions taken:
  -
- Files created/modified:
  -

### Phase 4: UI 与交互
- **Status:** pending
- Actions taken:
  -
- Files created/modified:
  -

### Phase 5: 打磨与文档
- **Status:** pending
- Actions taken:
  -
- Files created/modified:
  -

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Node availability | `node --version` | prints version | 拒绝访问 | failed |
| npm availability | `npm --version` | prints version | command not found | failed |
| Node availability outside sandbox | `node --version` | prints version | v20.19.5 | passed |
| Dependency install | `C:\nvm4w\nodejs\npm.cmd install` | installs dependencies | 69 packages installed, 0 vulnerabilities | passed |
| Production build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass | build completed in 738ms | passed |
| Git commit | `git commit -m "Initialize Vite React project"` | local commit created | `29fdbe0` | passed |
| UI dependency install | `C:\nvm4w\nodejs\npm.cmd install ...` | installs Tailwind/shadcn/motion dependencies | 0 vulnerabilities | passed |
| UI build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass | build completed in 3.25s | passed |
| Git commit | `git commit -m "Add UI foundation"` | local commit created | `4def3a0` | passed |
| Dev environment build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass | build completed in 3.23s | passed |
| HTTPS dev server | `npm run dev:https` | local HTTPS server starts | Vite ready at `https://127.0.0.1:5173/` | passed |
| Tunnel script without ngrok | `npm run tunnel` | clear actionable error | reports ngrok not installed or not in PATH | passed |
| Git commit | `git commit -m "Add mobile dev environment"` | local commit created | `ce7d48e` | passed |
| Camera module build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass | build completed in 3.25s | passed |
| Camera start fallback | Browser click `Start camera` | actionable failure state on desktop without camera | shows `Retry camera` and camera error text | passed |
| Mobile viewport | Browser viewport 390x844 | no horizontal overflow | `scrollWidth=390`, `clientWidth=390` | passed |
| Git commit | `git commit -m "Add camera preview module"` | local commit created | `fc74e08` | passed |
| Speech module build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass | build completed in 3.25s | passed |
| Speech UI presence | Browser DOM snapshot | microphone and transcript controls visible | `Enable microphone`, `Start listening`, transcript placeholder visible | passed |
| Microphone fallback | Browser click `Enable microphone` | actionable failure state on desktop without microphone | shows `Retry microphone` and microphone error text | passed |
| Speech mobile viewport | Browser viewport 390x844 | no horizontal overflow | `scrollWidth=375`, `clientWidth=375` | passed |
| Git commit | `git commit -m "Add speech input module"` | local commit created | `6f62a43` | passed |
| Frame capture build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass | build completed in 3.74s | passed |
| Frame UI disabled state | Browser DOM snapshot | capture button visible and disabled without camera | `Capture frame` count 1, enabled false | passed |
| Frame mobile viewport | Browser viewport 390x844 | no horizontal overflow | `scrollWidth=375`, `clientWidth=375` | passed |
| Git commit | `git commit -m "Add frame capture module"` | local commit created | `7558827` | passed |

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| 2026-06-12 | `node --version` 拒绝访问；`npm` 不在 PATH | 尝试验证本机 JS 工具链 | 提权后确认 Node v20.19.5 可用，使用 `C:\nvm4w\nodejs\npm.cmd` 完成安装和 build |
| 2026-06-12 | PowerShell 不支持 `&&`；并行 `npm install` 导致 lockfile 结果互相覆盖 | 第一次安装 PR2 依赖 | 不再并行 npm install，顺序补装依赖后 build 通过 |
| 2026-06-12 | Vite 6 CLI 报 `Unknown option --https` | 第一次验证 `dev:https` | 改为通过 `VITE_DEV_HTTPS=true` 在 Vite config 中启用 basic SSL |
| 2026-06-12 | `Invoke-WebRequest -SkipCertificateCheck` 在当前 PowerShell 不可用 | HTTPS 请求验证 | 改为读取 dev server 日志确认 HTTPS 地址启动成功 |
| 2026-06-12 | Node REPL 持久变量名重复导致 `Identifier has already been declared` | 浏览器验证语音 UI | 换用新的临时变量名继续验证 |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | Phase 3 / PR7 进行中：API 层正在实现 |
| Where am I going? | Phase 1 → 6，共 16 个 PR |
| What's the goal? | AI 视觉对话助手 MVP，Orb 交互隐喻，手机 Safari 可演示 |
| What have I learned? | iOS Safari HTTPS 要求、Web Speech API 兼容性、模型选型 |
| What have I done? | 需求对齐完成，三份规划文件已创建；已补 `CODEX.md`、完成 PR1-PR5；已实现 PR6 视频帧抓取和 JPEG 压缩准备 |

### Phase 3: AI 对话核心
- **Status:** in_progress
- Actions taken:
  - 开始 PR7：查阅 OpenAI 官方视觉输入格式，确认 base64 data URL 可作为图片输入
  - 新增 `src/lib/api.ts`，封装 OpenAI-compatible `/v1/chat/completions` 多模态请求
  - API key 设计为调用方显式传入，不写入源码，也不使用 `VITE_AI_API_KEY`
  - `.env.example` 仅保留 API base URL 和 model 配置
  - 验证 `npm run build` 通过
- Files created/modified:
  - src/lib/api.ts
  - .env.example
  - README.md
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: Phase 3
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| API layer build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass | build completed in 3.82s | passed |

### PR8: 多模态对话接入
- **Status:** in_progress
- Actions taken:
  - 提交 PR7：`6a41ef0 Add AI API client`
  - 新增 `useAiChat` hook，管理 AI 请求状态、取消、错误和回答
  - UI 增加本次会话 API key 输入、Ask AI、Cancel、AI answer 展示
  - API key 只保存在 React state，不写入 `.env`、localStorage 或源码
  - 验证 `npm run build` 通过
  - 浏览器验证 `Ask AI` 默认禁用、API key 输入存在、AI answer 占位可见
  - 移动视口 390x844 检查通过，无横向溢出
- Files created/modified:
  - src/hooks/useAiChat.ts
  - src/App.tsx
  - README.md
  - task_plan.md
  - progress.md

## Test Results: PR8
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Multimodal UI build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass | build completed in 3.49s | passed |
| Ask AI default state | Browser DOM snapshot | button visible and disabled until key/question/frame are ready | `Ask AI` count 1, enabled false | passed |
| AI mobile viewport | Browser viewport 390x844 | no horizontal overflow | `scrollWidth=375`, `clientWidth=375` | passed |

### PR9: 当前页面多轮上下文
- **Status:** in_progress
- Actions taken:
  - 提交 PR8：`6d1eb42 Connect multimodal AI request`
  - API 层增加 `history` 参数，最多使用最近 4 轮文本问答作为上下文
  - `useAiChat` 增加内存态 conversation turns，成功回答后写入当前页面状态
  - UI 增加当前上下文轮数、最近 2 轮预览和 `Clear context`
  - 不保存到 localStorage/sessionStorage，不重复上传历史图片
  - 验证 `npm run build` 通过
  - 浏览器验证默认上下文为 `Context: 0 turns in this page`，空状态不显示 `Clear context`
  - 移动视口 390x844 检查通过，无横向溢出
- Files created/modified:
  - src/lib/api.ts
  - src/hooks/useAiChat.ts
  - src/App.tsx
  - README.md
  - task_plan.md
  - progress.md

## Test Results: PR9
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Context build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass | build completed in 3.69s | passed |
| Context empty state | Browser DOM snapshot | shows 0 turns and no clear action | `Context: 0 turns in this page`, no `Clear context` | passed |
| Context mobile viewport | Browser viewport 390x844 | no horizontal overflow | `scrollWidth=375`, `clientWidth=375` | passed |
| Storage persistence check | Browser evaluate storage availability | no app persistence used | storage objects unavailable in test scope; code contains no local/session storage writes | partial |

### PR10: 截图提问兜底模式
- **Status:** in_progress
- Actions taken:
  - 提交并推送 PR9：`2f6dece Add in-memory conversation context`
  - 增加默认视觉问题：`请描述当前画面，并指出值得我注意的内容。`
  - 摄像头可抓帧时，预览画面变为可点击/键盘触发的兜底入口
  - 点击画面后抓取当前帧；没有语音问题时使用默认视觉问题
  - 如果已填写 API key，点击画面后直接发起 AI 请求；否则准备好帧和问题，等待用户填写 key 后手动 Ask AI
  - 验证 `npm run build` 通过
  - 浏览器验证无摄像头状态下不会暴露 fallback 画面按钮
  - 移动视口 390x844 检查通过，无横向溢出
- Files created/modified:
  - src/App.tsx
  - README.md
  - task_plan.md
  - progress.md

## Test Results: PR10
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Fallback build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass | build completed in 3.58s | passed |
| Fallback disabled state | Browser DOM snapshot without camera | no clickable fallback frame before camera is ready | fallback role button count 0 | passed |
| Fallback mobile viewport | Browser viewport 390x844 | no horizontal overflow | `scrollWidth=375`, `clientWidth=375` | passed |

### PR11: Orb 状态机与动效
- **Status:** in_progress
- Actions taken:
  - 提交并推送 PR10：`cd86514 Add visual fallback question`
  - 新增 `useOrbState`，从现有流程状态推导 Orb 状态：idle / listening / thinking / speaking
  - 新增 `Orb` 组件，按状态切换颜色、光晕、脉动/旋转/波纹动效
  - Orb 动效使用 `useReducedMotion` 尊重系统减少动态效果设置
  - 将 Orb 接入预览区：摄像头未启用时作为中心实体，摄像头启用后作为右上角状态实体
  - 验证 `npm run build` 通过
  - 浏览器验证默认 Orb 可被辅助技术识别为 `AI idle`，且无摄像头时不暴露 fallback 画面按钮
  - 移动视口 390x844 检查通过，无横向溢出
- Files created/modified:
  - src/hooks/useOrbState.ts
  - src/components/Orb.tsx
  - src/App.tsx
  - README.md
  - task_plan.md
  - progress.md

## Test Results: PR11
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Orb build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass | build completed in 3.30s | passed |
| Orb size fix build | `C:\nvm4w\nodejs\npm.cmd run build` | TypeScript and Vite build pass after placeholder size fix | build completed in 3.28s | passed |
| Orb default DOM | Browser DOM snapshot | Orb is present and fallback button remains hidden without camera | `AI idle` present, fallback button absent | passed |
| Orb mobile viewport | Browser viewport 390x844 | no horizontal overflow | `scrollWidth=375`, `clientWidth=375` | passed |

### PR12: TTS 语音合成与字幕浮层
- **Status:** in_progress
- Actions taken:
  - 新增 `useSpeechSynthesis`，封装 Web Speech API TTS 播放、停止、错误状态和字幕片段
  - 新增 `Caption` 组件，在页面底部显示当前朗读字幕，不挤压主界面布局
  - AI 回答生成后自动朗读，回答区提供 Replay answer 和 Stop speech 控制
  - Orb 状态接入 `isSpeaking`，朗读时切换到 speaking 状态
  - 浏览器 dev server 重新加载通过，无 Vite error overlay
  - 移动视口 390x844 检查通过，无横向溢出
  - 当前会话无法运行 `node.exe`，因此 `npm run build` 需由本机终端复验
- Files created/modified:
  - src/hooks/useSpeechSynthesis.ts
  - src/components/Caption.tsx
  - src/App.tsx
  - README.md
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR12
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| PR12 browser reload | In-app browser reload `http://127.0.0.1:5173/` | App renders without Vite overlay | `hasViteOverlay=false`, `hasMain=true` | passed |
| PR12 mobile viewport | Browser viewport 390x844 | no horizontal overflow | `scrollWidth=375`, `clientWidth=375` | passed |
| PR12 build | `npm run build` | TypeScript and Vite build pass | `node.exe` access denied in current sandbox | blocked |

### PR13: Orb 与对话系统状态整合
- **Status:** in_progress
- Actions taken:
  - 新增 `DialogueStatus` 组件，展示当前对话阶段、状态摘要和 Question / Frame / Reply 三个链路信号
  - 在相机预览右上角将 Orb 与状态层组合为一个稳定状态锚点
  - 从现有语音、抓帧、AI、TTS 状态推导统一 title/detail/tone，避免新增手动输入和后端复杂度
  - 浏览器 dev server 重新加载通过，无 Vite error overlay
  - 移动视口 390x844 检查通过，无横向溢出
- Files created/modified:
  - src/components/DialogueStatus.tsx
  - src/App.tsx
  - README.md
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR13
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| PR13 browser reload | In-app browser reload `http://127.0.0.1:5173/` | App renders without Vite overlay | `hasOverlay=false`, `hasMain=true` | passed |
| PR13 mobile viewport | Browser viewport 390x844 | no horizontal overflow | `scrollWidth=375`, `clientWidth=375` | passed |
| PR13 build | `npm run build` | TypeScript and Vite build pass | `node.exe` access denied in current sandbox | blocked |

### PR14: 手机触控栏与安全区适配
- **Status:** in_progress
- Actions taken:
  - 新增 `MobileActionBar`，在移动端底部固定 Camera / Voice / Frame / Ask 四个高频动作
  - 复用现有相机、语音、抓帧、AI 请求处理函数，不新增后端逻辑或额外状态源
  - 主页面底部 padding 适配安全区，避免底部触控栏遮挡内容
  - 字幕浮层在移动端上移到触控栏上方，避免朗读字幕被遮挡
  - 浏览器验证桌面端移动触控栏隐藏
  - 浏览器验证 390x844 和 375x667 移动视口无横向溢出，底部触控栏可见
  - 修复 `safe-page` 覆盖移动底部 padding 的问题，移动端主页面底部留出 96px
- Files created/modified:
  - src/components/MobileActionBar.tsx
  - src/components/Caption.tsx
  - src/App.tsx
  - src/styles.css
  - README.md
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR14
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| PR14 desktop reload | Browser reload desktop viewport | Mobile bar hidden, no Vite overlay | `mobileNavVisible=false`, `hasOverlay=false` | passed |
| PR14 mobile viewport | Browser viewport 390x844 | bottom bar visible, no horizontal overflow | `buttonCount=4`, `scrollWidth=375`, `clientWidth=375` | passed |
| PR14 short mobile viewport | Browser viewport 375x667 | bottom bar remains usable | 4 buttons at 58px height, `scrollWidth=360`, `clientWidth=360` | passed |
| PR14 safe-area padding | Browser viewport 390x844 | content bottom padding clears mobile action bar | `paddingBottom=96px`, nav visible | passed |
| PR14 build | `npm run build` | TypeScript and Vite build pass | `node.exe` access denied in current sandbox | blocked |

### PR15: README 依赖清单与交付说明
- **Status:** in_progress
- Actions taken:
  - 将 README 重写为交付版，补齐核心流程、当前功能、本地开发、手机 Safari 调试、环境变量、依赖清单、原创功能、验证方式、MVP 边界和目录结构
  - 按运行时依赖和开发依赖分组说明第三方库用途
  - 明确 API key 不进入 `.env`、源码或浏览器持久化存储
  - 同步 `CODEX.md` 目录结构，补充 `DialogueStatus`、`MobileActionBar` 和 `useSpeechSynthesis`
  - 文档检查确认 README 包含第三方依赖、原创功能、验证方式、MVP 边界和 API key 安全说明
- Files created/modified:
  - README.md
  - CODEX.md
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR15
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| README required sections | `Select-String README.md` | dependencies, original features, verification, MVP boundary, API key safety present | all required sections found | passed |
| PR15 build | Documentation-only PR | No runtime build required | no source runtime code changed | skipped |

### PR16: 设计文档与成本控制策略
- **Status:** in_progress
- Actions taken:
  - 先在 `CODEX.md` 中新增 `docs/` 目录约定，再创建项目级设计文档
  - 新增 `docs/design.md`，说明设计目标、目标用户、用户故事、核心路径、状态设计、失败恢复、成本控制、安全隐私边界和后续扩展方向
  - README 增加设计文档入口
  - 文档检查确认设计文档包含用户故事、成本控制、失败恢复、安全与隐私、取舍说明和后续扩展
- Files created/modified:
  - docs/design.md
  - README.md
  - CODEX.md
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR16
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Design doc required sections | `Select-String docs/design.md` | user stories, cost control, failure recovery, privacy, tradeoffs present | all required sections found | passed |
| README design link | `Select-String README.md docs/design.md` | README links to design document | link found | passed |
| PR16 build | Documentation-only PR | No runtime build required | no source runtime code changed | skipped |

### PR17: 手机 ngrok 访问修复
- **Status:** merged
- Actions taken:
  - 在 Vite `server.allowedHosts` 放行 ngrok 免费域名
  - 将 ngrok 脚本从本地 HTTPS 转发改为本地 HTTP dev server 转发
  - 同步 README/CODEX 中的手机测试命令为 `npm run dev` + `npm run tunnel`
- Files modified:
  - vite.config.ts
  - scripts/start-ngrok.ps1
  - README.md
  - CODEX.md

### PR18: 千问 DashScope 默认视觉接口
- **Status:** merged
- Actions taken:
  - 将默认 OpenAI-compatible base URL 改为 DashScope
  - 将默认视觉模型改为 `qwen-vl-plus`
  - 将请求 token 参数改为 `max_tokens`
  - 用户真机确认千问视觉问答链路跑通
- Files modified:
  - src/lib/api.ts
  - .env.example
  - README.md
  - CODEX.md

### PR19: 前端中文化与错误诊断提示
- **Status:** in_progress
- Actions taken:
  - 将主界面、移动底栏、状态浮层、权限错误、抓帧错误、语音错误改为中文文案
  - AI 请求错误增加 HTTP 状态和下一步排查提示
  - 修复手机测试时 “AI request failed” 过于笼统的问题
- Files modified:
  - src/App.tsx
  - src/components/DialogueStatus.tsx
  - src/components/MobileActionBar.tsx
  - src/hooks/useAiChat.ts
  - src/hooks/useCamera.ts
  - src/hooks/useFrameCapture.ts
  - src/hooks/useMicrophone.ts
  - src/hooks/useSpeechRecognition.ts
  - src/hooks/useSpeechSynthesis.ts
  - src/lib/api.ts
  - task_plan.md
  - progress.md

## Test Results: PR19
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Whitespace check | `git diff --check` | no whitespace errors | passed | passed |
| Build | `npm run build` | TypeScript and Vite build pass | Codex shell cannot find `npm`; user needs to run locally | blocked |

### PR20: 前后端目录拆分与后端 API key 代理
- **Status:** ready_for_pr
- Actions taken:
  - 将前端 Vite/React 入口、配置和源码迁移到 `frontend/`
  - 新增 `backend/server.mjs`，用 Node 内置 `http` 提供 `/api/health` 和 `/api/vision-chat`
  - 后端从根目录 `.env` 读取 `AI_API_KEY`、`AI_API_BASE_URL`、`AI_MODEL`
  - 前端移除 API 密钥输入框，不再向浏览器暴露密钥状态
  - 前端 API client 改为请求本地 `/api/vision-chat`
  - 新增 `scripts/dev.mjs`，`npm run dev` 同时启动后端代理和前端 Vite
  - 同步 README、CODEX、agents、task_plan、findings 中的目录结构、环境变量和安全说明
  - Git 分支/PR 写入需用户本地执行；`docs/pr-stack.md` 未纳入本次变更
- Files modified:
  - backend/server.mjs
  - scripts/dev.mjs
  - frontend/
  - package.json
  - .env.example
  - README.md
  - CODEX.md
  - agents.md
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR20
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| TypeScript build | `node node_modules\typescript\bin\tsc --build frontend/tsconfig.json` | TypeScript build passes | passed | passed |
| Vite build | `node node_modules\vite\bin\vite.js build --config frontend/vite.config.ts` | frontend production build passes | built `../dist` successfully | passed |
| Backend health | `GET http://127.0.0.1:8787/api/health` | backend returns health JSON | `providerConfigured:false` without local key | passed |
| Missing key response | `POST /api/vision-chat` without `AI_API_KEY` | actionable Chinese config error | returned `.env` / restart hint | passed |
| Dev chain | `node scripts/dev.mjs` then request frontend and `/api/health` through Vite | frontend and backend start together | frontend 200, proxy health ok | passed |
| Browser desktop check | in-app browser `http://127.0.0.1:5173/` | no Vite overlay, no API key input | passed | passed |
| Browser mobile check | viewport 390x844 | no horizontal overflow, mobile action bar visible, no API key input | passed | passed |

### PR21: P0 自动对话链路
- **Status:** ready_for_pr
- Actions taken:
  - 按 `docs/design.md` P0 优先级收敛本次范围，只做自动链路和语音入口合并
  - `useMicrophone.startMicrophone` 改为返回布尔结果，供组合流程判断是否能继续启动语音识别
  - 新增单一“开始对话”动作：点击后请求麦克风权限，成功后自动开始 Web Speech 识别
  - 语音最终文本稳定后等待短暂静默，自动停止本轮聆听、抓取当前帧并发起 AI 视觉问答
  - 保留手动抓取画面和提问 AI 作为兜底路径
  - 移动底栏语音按钮改为同一套“对话”入口
- Files modified:
  - frontend/src/App.tsx
  - frontend/src/components/MobileActionBar.tsx
  - frontend/src/hooks/useMicrophone.ts
  - frontend/src/styles.css
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR21
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| TypeScript build | `node node_modules\typescript\bin\tsc --build frontend/tsconfig.json` | TypeScript build passes | passed | passed |
| Vite build | `node node_modules\vite\bin\vite.js build --config frontend/vite.config.ts` | production bundle builds | built `../dist` successfully | passed |
| Whitespace check | `git diff --check` | no whitespace errors | passed; only CRLF warnings | passed |
| Dev health | `GET /` and `GET /api/health` | frontend 200 and backend health JSON | frontend 200; health ok with `qwen-vl-plus` | passed |
| Browser desktop DOM | `http://127.0.0.1:5173/` | one voice entry, no old split mic/listen buttons | `开始对话` present; old split buttons absent | passed |
| Browser mobile check | viewport 390x844 | no horizontal overflow; bottom bar buttons visible | `scrollWidth=375`, buttons `摄像头/对话/画面/提问` visible | passed |
| Browser console | warning/error logs | no app runtime errors | only reduced-motion Framer Motion warning | passed |

### PR29: 显式文本问题输入
- **Status:** ready_for_pr
- Actions taken:
  - 按 `docs/design.md` 待定 P2 项拆分本次范围，只解决语音识别不可用时无法提问的问题。
  - 在当前步骤卡片加入“文本问题”输入框；没有语音文本时，输入内容会作为本轮 `questionText`。
  - 语音识别 unsupported/error 时，右侧当前步骤改为“可以输入问题”，下一步区域提示先输入问题。
  - 保持语音文本优先，文本输入只复用既有抓帧、提问、失败重试和清空问题逻辑，不新增独立发送路径。
- Files modified:
  - frontend/src/App.tsx
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR29
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Whitespace check | `git diff --check` | no whitespace errors | passed; only CRLF warnings | passed |
| TypeScript build | `node node_modules\typescript\bin\tsc --build frontend\tsconfig.json` | TypeScript build passes | passed | passed |
| Vite build | `node node_modules\vite\bin\vite.js build --config frontend\vite.config.ts` | production bundle builds | built `../dist` successfully | passed |
| Dev health | `GET /` and `GET /api/health` | frontend 200 and backend health JSON | frontend 200; health ok with `qwen-vl-plus` | passed |
| Browser desktop check | in-app browser `http://127.0.0.1:5173/` | no Vite overlay or console errors | main present, one start entry, logs empty | passed |
| Browser mobile viewport | viewport 390x844 | no horizontal overflow; bottom actions visible | `scrollWidth=375`, `clientWidth=375`, 4 mobile actions visible | passed |
| Text input camera-ready path | camera ready with speech unsupported/error | input visible and reused for visual question | desktop environment has no camera permission path | blocked |

### PR22: AI 思考时沉浸式等待体验
- **Status:** ready_for_pr
- Actions taken:
  - 按 `docs/design.md` P1 优先级选择等待体验优化，避免继续扩大自动链路范围
  - 在摄像头已开启且 AI 请求进行中时，为视频区域增加半透明深色遮罩
  - 将 thinking 状态 Orb 放大并居中展示，配合“正在理解画面 / 正在生成回答”文案
  - 用 `AnimatePresence` 保持遮罩淡入淡出，底部状态条维持在遮罩上方
- Files modified:
  - frontend/src/App.tsx
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR22
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| TypeScript build | `node node_modules\typescript\bin\tsc --build frontend/tsconfig.json` | TypeScript build passes | passed | passed |
| Vite build | `node node_modules\vite\bin\vite.js build --config frontend/vite.config.ts` | production bundle builds | built `../dist` successfully | passed |
| Whitespace check | `git diff --check` | no whitespace errors | passed; only CRLF warnings | passed |
| Dev health | `GET /` and `GET /api/health` | frontend 200 and backend health JSON | frontend 200; health ok with `qwen-vl-plus` | passed |
| Browser desktop DOM | `http://127.0.0.1:5173/` | no Vite overlay after dev server restart | page rendered normal controls | passed |
| Browser mobile check | viewport 390x844 | no horizontal overflow; bottom bar buttons visible | `scrollWidth=375`, buttons visible | passed |
| Browser console | warning/error logs | no app runtime errors | empty warning/error list | passed |
| Browser screenshot | viewport screenshot | visual artifact captured | browser screenshot command timed out | blocked |

### PR23: Orb 首屏视觉权重与首次启动引导
- **Status:** ready_for_pr
- Actions taken:
  - 按 `docs/design.md` P1 继续优化 Orb 首屏引导，不改摄像头/麦克风权限流程
  - 摄像头未开启时，将 Orb 放大并居中展示在主视觉区
  - 在主视觉区增加单一大按钮“开启摄像头”，作为首屏主要行动入口
  - 摄像头未开启时，右侧面板不再重复显示第二个摄像头按钮，只提示下一步
  - 摄像头开启后，右上角 Orb 从 64px 提升到 88px，增强状态可见性
  - 将首屏主按钮文案调整为“开始对话”，底层仍先请求摄像头权限以保持 iOS Safari 权限链路稳定
  - 摄像头未开启时隐藏语音、抓帧和 AI 面板，并禁用移动底栏后续动作，避免首屏出现多条可点路径
- Files modified:
  - frontend/src/App.tsx
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR23
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| TypeScript build | `node node_modules\typescript\bin\tsc --build frontend/tsconfig.json` | TypeScript build passes | passed | passed |
| Vite build | `node node_modules\vite\bin\vite.js build --config frontend/vite.config.ts` | production bundle builds | built `../dist` successfully | passed |
| Whitespace check | `git diff --check` | no whitespace errors | passed; only CRLF warnings | passed |
| Dev health | `GET /` and `GET /api/health` | frontend 200 and backend health JSON | frontend 200; health ok with `qwen-vl-plus` | passed |
| Browser mobile check | viewport 390x844 | one primary start button; no horizontal overflow | `scrollWidth=375`; main `开始对话` enabled; later actions disabled | passed |
| Browser console | warning/error logs | no app runtime errors | only reduced-motion Framer Motion warning | passed |

### PR24: 右侧面板信息密度精简
- **Status:** ready_for_pr
- Actions taken:
  - 按 `docs/design.md` P2 收敛范围，只处理右侧面板默认信息密度，不改自动追问和弱网策略。
  - 将右侧面板默认结构改为“当前步骤 + 下一步操作”，避免同时展开摄像头、语音、抓帧、AI 和上下文状态。
  - 移除右侧面板中与 `DialogueStatus` 重复的 dot + 状态文字条。
  - 将流程概览、当前问题、抓帧预览、回答详情和关闭摄像头放入“本轮详情”折叠区。
  - 将上下文默认折叠，入口显示“最近 N 轮对话”，展开后显示最近 4 轮并保留清空上下文。
- Files modified:
  - frontend/src/App.tsx
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR24
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Whitespace check | `git diff --check` | no whitespace errors | passed; only CRLF warnings | passed |
| TypeScript build | `node node_modules\typescript\bin\tsc --build frontend/tsconfig.json` | TypeScript build passes | passed | passed |
| Vite build | `node node_modules\vite\bin\vite.js build --config frontend/vite.config.ts` | production bundle builds | built `../dist` successfully | passed |
| Dev health | `GET /` and `GET /api/health` | frontend 200 and backend health JSON | frontend 200; health ok with `qwen-vl-plus` | passed |
| Browser mobile check | viewport 390x844 | no horizontal overflow; one primary start entry; downstream actions disabled before camera | `scrollWidth=375`; main `开始对话` count 1; `对话/画面/提问` disabled | passed |
| Browser console | warning/error logs | no app runtime errors | only reduced-motion Framer Motion warning | passed |

### PR26: 弱网慢响应提示
- **Status:** ready_for_pr
- Actions taken:
  - 按 `docs/design.md` P3 弱网体验拆分本次范围，只做 AI 请求超过 8 秒后的慢响应反馈。
  - 新增 8 秒慢响应计时状态，请求结束、失败或取消后自动恢复普通等待文案。
  - 视频中央等待遮罩在慢响应后显示“网络较慢，正在等待 AI 响应...”，并说明问题和画面已保留。
  - 右上 `DialogueStatus` 与右侧当前步骤面板同步切换慢响应文案，避免用户误以为系统卡死。
- Files modified:
  - frontend/src/App.tsx
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR26
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Whitespace check | `git diff --check` | no whitespace errors | passed; only CRLF warnings | passed |
| TypeScript build | `node node_modules\typescript\bin\tsc --build frontend/tsconfig.json` | TypeScript build passes | passed | passed |
| Vite build | `node node_modules\vite\bin\vite.js build --config frontend/vite.config.ts` | production bundle builds | built `../dist` successfully | passed |
| Dev health | `GET /` and `GET /api/health` | frontend 200 and backend health JSON | frontend 200; health ok with `qwen-vl-plus` | passed |
| Browser desktop check | in-app browser `http://127.0.0.1:5173/` | no Vite overlay; primary start entry visible | passed at current desktop viewport; only reduced-motion Framer Motion warning | passed |
| Browser mobile viewport | viewport 390x844 | no horizontal overflow | Browser viewport override stayed at desktop width `1280`; no Playwright dependency in project for fallback | blocked |

### PR27: 弱网抓帧自适应压缩
- **Status:** ready_for_pr
- Actions taken:
  - 按 `docs/design.md` P3 弱网体验继续拆分，本次只处理抓帧上传体积，不改重试和请求状态。
  - 将抓帧从原始视频尺寸 + 固定 JPEG quality 0.62 改为自适应压缩。
  - 先限制长边到 1280，再按 0.5 / 0.45 / 0.4 质量尝试；必要时降到 960 或 720 长边。
  - 优先返回 40KB 以内的 JPEG；若仍超过目标，返回尝试结果里体积最小的一版。
  - `CapturedFrame.width/height/sizeKb` 现在记录实际上传帧尺寸和大小，方便用户看到压缩后的体积。
- Files modified:
  - frontend/src/hooks/useFrameCapture.ts
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR27
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Whitespace check | `git diff --check` | no whitespace errors | passed; only CRLF warnings | passed |
| TypeScript build | `node node_modules\typescript\bin\tsc --build frontend/tsconfig.json` | TypeScript build passes | passed | passed |
| Vite build | `node node_modules\vite\bin\vite.js build --config frontend/vite.config.ts` | production bundle builds | built `../dist` successfully | passed |
| Dev health | `GET /` and `GET /api/health` | frontend 200 and backend health JSON | frontend 200; health ok with `qwen-vl-plus` | passed |
| Browser desktop check | in-app browser `http://127.0.0.1:5173/` | no Vite overlay; primary start entry visible | passed; console warning/error list empty | passed |
| Real camera compression | camera capture on Safari/device | compressed frame near 40KB when possible | desktop environment has no camera permission path | blocked |

### PR28: AI 请求失败恢复提示
- **Status:** ready_for_pr
- Actions taken:
  - 按 `docs/design.md` P3 弱网失败恢复继续拆分，本次只优化失败反馈，不改 AI 请求生命周期。
  - 当 AI 请求失败且当前问题与画面仍满足重试条件时，右上状态卡提示“已保留问题和画面，可直接重试”。
  - 右侧当前步骤面板标题改为“提问失败，可直接重试”，详情说明已保留当前问题和画面。
  - 复用既有“重试提问 AI”按钮，避免新增第二条重试路径。
- Files modified:
  - frontend/src/App.tsx
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR28
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Whitespace check | `git diff --check` | no whitespace errors | passed; only CRLF warnings | passed |
| TypeScript build | `node node_modules\typescript\bin\tsc --build frontend/tsconfig.json` | TypeScript build passes | passed | passed |
| Vite build | `node node_modules\vite\bin\vite.js build --config frontend/vite.config.ts` | production bundle builds | built `../dist` successfully | passed |
| Dev health | `GET /` and `GET /api/health` | frontend 200 and backend health JSON | frontend 200; health ok with `qwen-vl-plus` | passed |
| Browser desktop check | in-app browser `http://127.0.0.1:5173/` | no Vite overlay; primary start entry visible | passed; console warning/error list empty | passed |
| AI error retry copy | failed AI request with retained frame/question | copy says input is retained and retry is available | requires real camera/AI failure path | blocked |

### PR25: 回答后自动追问聆听
- **Status:** ready_for_pr
- Actions taken:
  - 按 `docs/design.md` P3 收敛范围，只做回答后追问，不混入弱网体验优化。
  - 在 `useSpeechSynthesis` 中暴露自然朗读结束信号，区分正常结束与手动停止/取消。
  - 回答朗读自然结束后，如果摄像头、麦克风和语音识别均已就绪，自动清空旧问题并进入追问聆听。
  - 追问聆听状态下保留原有最终语音自动抓帧提问链路，让“那这个呢”类口语追问继续带上下文理解。
  - 追问聆听 15 秒内没有检测到新语音时自动停止，减少手机电量和麦克风占用。
- Files modified:
  - frontend/src/App.tsx
  - frontend/src/hooks/useSpeechSynthesis.ts
  - task_plan.md
  - findings.md
  - progress.md

## Test Results: PR25
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Whitespace check | `git diff --check` | no whitespace errors | passed; only CRLF warnings | passed |
| TypeScript build | `node node_modules\typescript\bin\tsc --build frontend/tsconfig.json` | TypeScript build passes | passed | passed |
| Vite build | `node node_modules\vite\bin\vite.js build --config frontend/vite.config.ts` | production bundle builds | built `../dist` successfully | passed |
| Dev health | `GET /` and `GET /api/health` | frontend 200 and backend health JSON | frontend 200; health ok with `qwen-vl-plus` | passed |
| Browser mobile check | viewport 390x844 | no horizontal overflow; one primary start entry; downstream actions disabled before camera | `scrollWidth=375`; main `开始对话` count 1; `对话/画面/提问` disabled | passed |
| Browser console | warning/error logs | no app runtime errors | only reduced-motion Framer Motion warning | passed |
