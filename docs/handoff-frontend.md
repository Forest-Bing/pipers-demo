# 前端交接文档 · 剩余页面实现

> **这份文件是给「新会话」看的。** 它自包含，不需要回溯任何历史对话。
> 更新时间：2026-11-19 · 对应代码状态见 §7 进度表

---

## 0. 五分钟上手

**你是谁、要做什么**：继续实现「国家管网管道巡检标记系统」的前端页面。这是一个地图 + 现场标记的双端 Web 应用（巡线员用手机、管理员用桌面后台），视觉要求「苹果风 + Liquid Glass」。

**已经做完的**：地图主界面的手机版和桌面版（2 屏），以及共享地基（UI 基元、mock 数据、路由、布局壳）。**剩余 7 屏**，见 §7。

**开始干活前必读**：
1. 本文 §2 铁律（12 条，违反即返工）
2. 本文 §5 你要做的那一屏的规格
3. `docs/ui-notes.md` 第 4 节（已知的 6 处有意偏差，**别当 bug 修**）

**不要做的**：不接高德、不接后端、不改已完成的页面布局、不自行发明设计稿里没有的字段和筛选器。

**技术栈**：React 19.3 + Vite 8 + TypeScript 7 + Tailwind CSS v3.4 + react-router 7 + lucide-react + clsx/tailwind-merge。

---

## 1. 代码基线

### 1.1 目录

```
frontend/src/
├── main.tsx                      # createBrowserRouter + RouterProvider
├── routes.tsx                    # 全量路由 + 角色守卫
├── index.css                     # @tailwind 三段 + @layer base/components
├── lib/
│   ├── cn.ts                     # clsx + tailwind-merge
│   ├── format.ts                 # 时间/距离/手机号/计数格式化
│   ├── auth.tsx                  # useAuth()：role = 'user' | 'admin'
│   ├── mock/
│   │   ├── types.ts              # User / Keypoint / Mark / Attachment / Pipeline
│   │   ├── users.ts              # 53 条用户
│   │   ├── keypoints.ts          # 14 条关键点
│   │   ├── marks.ts              # 7 条标记（含 marks / markCounts 导出）
│   │   └── pipelines.ts          # 1 条管段
│   └── store.tsx                 # 内存态 store（新建标记、停用用户等）
├── components/
│   ├── ui/                       # 18 个基元，见 §4
│   ├── layout/
│   │   ├── MobileShell.tsx       # 手机页外壳（顶栏三槽 + 安全区）
│   │   └── AdminLayout.tsx       # 后台壳（240px 导航 + 顶栏）
│   ├── map/                      # 已完成：地图页 9 个组件 + ZoomHint（画板 3）
│   │                             # 另有 LandingPointSheet（画板 4）+ MapPickState（长按状态机）
│   └── desktop/Sidebar.tsx       # 已完成：桌面侧栏
└── pages/
    ├── map/
    │   ├── MapPage.tsx           # 断点壳：lg 互斥两套
    │   ├── MapPageMobile.tsx     # 画板 2 ✅
    │   └── MapPageDesktop.tsx    # 画板 9 ✅
    ├── mark/
    │   └── NewMarkPage.tsx       # 画板 5 ✅
    ├── LoginPage.tsx             # 画板 1 ✅
    ├── MePage.tsx                # 画板 8 ✅
    └── admin/
        ├── UsersPage.tsx         # 画板 10 + 12 ❌
        └── MarksPage.tsx         # 画板 11 ❌
```

### 1.2 设计 token（`frontend/tailwind.config.js`，**已配好，直接用**）

| 用途 | 类名 | 值 |
| --- | --- | --- |
| 警告标记 | `alert` | `#FF3B30` |
| 普通信息 / 主按钮 | `info` | `#0A84FF` |
| 系统背景 | `canvas` | `#F2F2F7` |
| 后台导航底 | `admin-nav` | `#F7F7F9` |
| 主文字 / 次级文字 | `ink` / `ink-2` | `#1C1C1E` / `#8E8E93` |
| 分隔线 | `hairline` | `rgba(60,60,67,0.12)` |
| 卡片边框 | `card-line` | `rgba(60,60,67,0.08)` |
| 成功（仅「已同步」） | `success` | `#34C759` |
| 温和警示条 | `warn-soft` / `warn-ink` | `#FFF4E5` / `#B25E00` |
| 遮罩 | `scrim` | `rgba(0,0,0,0.25)` |
| 地图底 / 水系 / 绿地 | `map-base` / `map-water` / `map-green` | `#F7F7F5` / `#DCE9F5` / `#E8F0E4` |
| 管道线 | `pipeline` | `#45525E` |
| 关键点 | `stake` / `stake-test` / `valve` | `#5B6B7C` / `#30B0C7` / `#8E7BEF` |

圆角：`rounded-control`(10) / `card`(16) / `card-lg`(20) / `glass`(24) / `glass-lg`(28)
阴影：`shadow-glass` / `shadow-glass-inset` / `shadow-fab` / `shadow-pin`
动效：`ease-glass` + `duration-240` / `duration-320`

### 1.3 玻璃（`src/index.css` 的 `@layer components`，**已写好**）

| 类 | 用途 |
| --- | --- |
| `.glass` | 55% 白 + `blur(20px) saturate(180%)` + 顶部 1px 高光，r24。地图浮层的默认选择 |
| `.glass-strong` | 72% 白，用于信息密集的小胶囊 |
| `.glass-sheet` | 72% 白，仅顶部两角 r28。底部上滑面板 |
| `.glass-btn` | 44px 玻璃圆按钮 |
| `.card` | 白底 + r16 + 1px `card-line`，**无阴影**。后台表格/表单/抽屉专用 |

四个玻璃类都写了 `-webkit-backdrop-filter`，并在 `@supports not` 和 `prefers-reduced-transparency` 下降级。**不要再手写 backdrop-filter。**

### 1.4 断点策略

不做逐条 `md:` 微调。两套页面壳共存，CSS 互斥：

```tsx
// MapPage.tsx
<div className="lg:hidden"><MapPageMobile /></div>
<div className="hidden lg:block"><MapPageDesktop /></div>
```

- `< 1024px` 一律手机布局（横向拉伸也走手机布局）
- `>= 1024px` 走侧栏 + 地图
- 根容器用 `h-[100dvh]`，**不用 `h-screen`**（避开 iOS 地址栏）

### 1.5 地图交换点

`components/map/MapCanvas.tsx` 是唯一的地图交换点。它绝对定位铺满、**必须是第一个子元素**，所有玻璃浮层排在它之后靠 DOM 顺序决定层级，不靠 `z-index` 堆叠。`MapBackdrop` 是手绘 SVG 假地图，接高德时整块删除。

---

## 2. 铁律（12 条）

违反任何一条都要返工。这些是从 PRD 的决策和提示词的约束里提炼出来的，都是 AI 最容易自作主张的地方。

1. **不新造颜色。** 只用 §1.2 的语义名，禁止写裸十六进制。
2. **玻璃只用 `.glass / .glass-strong / .glass-sheet / .glass-btn`。** 不拼 `backdrop-blur-*`。
3. **后台不用玻璃。** 表格、表单、抽屉、弹窗全是白底 `.card`；只有顶栏、左导航、地图页浮层用玻璃。
4. **标记只有 `alert`（警告）和 `info`（普通信息）两类。** 绝不出现「严重/中等/轻微」「已认领」「已消除」「处理状态」。`Badge`、`MarkPin`、`SegmentedControl` 在类型层面就只接受这两个值，不要扩展。
5. **地图端只能按类型筛**（全部/警告/信息）。不得加时间、人员、严重程度筛选。
6. **登录页无注册、无微信登录、无忘记密码、无验证码、无「记住我」。** 账号只能由管理员创建。
7. **普通用户界面上不得出现任何后台入口。** 管理员不进地图页（决策 D5）。
8. **管理员自己那一行的「停用」必须禁用**（灰 + 锁图标 + tooltip「不能停用自己」）。系统**没有物理删除用户**的入口，账号只能停用。
9. **非本人创建的标记不显示「编辑」「删除」。**
10. **断点用 `lg`(1024)**，不要改成 768。根容器 `h-[100dvh]`。
11. **不套手机外壳**（无 iPhone 边框、无状态栏、无 Home 条）。
12. **未实现的导航项只做占位**（`EmptyState`「功能建设中」），不要自行发明表格字段。

---

## 3. 交互深度

目标是**可点击走通**，不是静态还原：

- 页面间真实跳转；tab / 筛选 / 弹窗 / 抽屉 / 表单输入都能操作
- 提交动作写入**内存态**（`lib/store.tsx`，`useState` + Context），给 toast 反馈，**刷新即重置**
- 照片与录音用占位：照片是渐变色块 + 序号，录音是静态波形 + 固定时长
- 所有未来要接接口的位置留 `// TODO: GET /api/marks?bbox=` 注释
- **不做**：假后端、IndexedDB 持久化、真实上传、真实录音

---

## 4. 共享地基（已完成，直接用，不要重造）

### 4.1 `lib/format.ts`

```ts
formatTime(iso: string): string        // '14:32'
formatDateTime(iso: string): string    // '2026-11-19 14:32'
formatDistance(m: number): string      // '86m' | '1.1km'（<1000 取整米，否则一位小数）
maskPhone(phone: string): string       // '138****6027'
formatCount(n: number): string         // '99+'（>99）
```

### 4.2 `lib/mock/`

- **users**：53 条。`active` 48 / `disabled` 5 / 本月新增 6。`[0]` 是当前登录管理员「李国强 · 管理员」`id: 'u-admin'`；`[1]` 是「张建国 · 巡线工」`id: 'u-zhang'`（手机号 `13800006027`）
- **keypoints**：14 条 = 加密桩 6 + 智能测试桩 5 + 阀室 3，编号 `JMZ-0421` 形式，带 `distance`（86m / 120m / 260m…）
- **marks**：7 条，`markCounts = { total: 7, alert: 3, info: 4 }`。`m1` 是画板 5/6 的示例（4 张图 + 37 秒录音 + 关键点 JMZ-0421）
- **pipelines**：1 条「西气东输二线 · 中卫—靖边段」

**注意**：现有地图页依赖 `marks` 和 `markCounts` 的导出名与 `MarkItem` 的 `distance`/`time`/`title`/`description` 字段。扩展字段可以，改字段名会打断已完成的页面。

### 4.3 `components/ui/` 基元

以 `frontend/src/components/ui/index.ts` 的导出为准（20+ 个）。核心是：

`Button`（primary/secondary/ghost/danger × sm/md × loading）、`TextButton`、`IconButton`、`TextField`、`TextArea`（字数计数）、`Select`、`SegmentedControl`、`Badge`、`StatusDot`、`Avatar`、`Switch`、`Sheet`、`Drawer`、`Modal`、`OverlayHeader`、`Pagination`、`EmptyState`、`ToastHost`、`StatCard`、`PhotoGrid`、`AudioBar`、`KeypointIcon`、`MarkPin`、`CurrentLocationDot`、`ClusterBubble`、`PipelineGlyph`。

**页面里只允许组合这些基元 + Tailwind 布局类**，不要就地重写一个按钮或输入框。如果基元不够用，**扩展基元**而不是在页面里内联一份。

布局壳另有两个：`MobileShell`（含 `NavText`）、`AdminLayout`。

### 4.4 布局壳

- `MobileShell`：`h-[100dvh]` + 顶部 44px 导航栏（left / title / right 三槽）+ 内容区 + `pb-[env(safe-area-inset-bottom)]`
- `AdminLayout`：240px 左导航（`bg-admin-nav`，实色，**不用玻璃**）+ 顶栏（面包屑 + 搜索 + 铃铛 + 头像）+ 内容区 `bg-canvas`。导航项「概览 / 用户管理 / 标记管理 / 关键点台账 / 审计日志」，未实现的点进 `EmptyState`

### 4.5 路由与角色

```
/login                 LoginPage           ✅
/                      MapPage             ✅
/mark/new              新建标记            ✅ B2
/mark/new/keypoint     关键点选择器        ❌ B3
/marks/:id             标记详情            ❌ B4
/me                    MePage              ✅
/admin/users           UsersPage           ❌ B5
/admin/marks           MarksPage           ❌ B6
```

`useAuth()` 返回 `{ user, role, login, logout }`，存 localStorage（key `pipe.session`）。

守卫：
- `role === 'user'` 访问 `/admin/*` → `/`
- `role === 'admin'` 访问 `/` 及手机端页面 → `/admin/users`
- 未登录 → `/login`（演示期默认已登录，避免反复被弹回）

---

## 5. 剩余 7 屏规格（写代码的唯一依据）

每屏按「布局 / 元素 / 示例文案 / 交互 / 状态 / 验收」组织。规格原文逐字摘自 `docs/pixso-ui-prompt.md` 第三节，不做二次概括。

---

### 画板 4「长按地图 · 选择落点」 `B1`

**已有参考**：这是地图页的一个状态，不是独立页面。在地图上长按（或点击 FAB 后）弹出。

**布局**：地图全屏不变，底部弹出一张玻璃面板（`glass-sheet`，圆角只在顶部 28px）。地图上落点处出现红蓝双色引脚预览点 + 脉冲环。

**元素**：
- 引脚预览点：`MarkPin` 双色态（上半红下半蓝，表达「类型未定」）+ 外层脉冲环（`animate-breathe`）
- 面板顶部：拖拽条 + 右上角「取消」文字按钮
- 标题「在此处添加标记」，副标题经纬度 `E 106.2718, N 37.5421`（`font-mono`）
- 三行选项，每行：左侧圆形图标（`bg-info/10` + `text-info`）、中间标题 + 灰色说明、右侧 `ChevronRight`

**示例文案（逐字）**：

| 标题 | 说明 |
| --- | --- |
| 使用当前位置 | GPS 定位，精度 ±8 米 |
| 使用此位置 | 长按拾取的地图坐标 |
| 关联关键点 | 从台账中选择加密桩、测试桩或阀室 |

**交互**：
- 「使用当前位置」→ 跳 `/mark/new?lng=&lat=`，位置标记为「当前位置」
- 「使用此位置」→ 跳 `/mark/new?lng=<拾取点>`
- 「关联关键点」→ 跳 `/mark/new/keypoint`
- 「取消」→ 关闭面板，清除预览点

**状态**：定位中（「使用当前位置」行右侧显示 `Loader2` 旋转，文案变「正在定位…」）/ 定位失败（该行说明变红「定位失败，请检查权限」，不可点）

**验收**：
- [ ] 脉冲环在预览点上，不遮挡其他元素
- [ ] 三个选项行高度 ≥56px，点击热区覆盖整行
- [ ] 「关联关键点」的说明文案里出现「测试桩」而非「智能测试桩」（原文如此，保留）

---

### 画板 5「添加标记 · 表单」 `B2`

**最复杂的一屏，建议单独一批做完再走。** 路由 `/mark/new`，可带 `?lng=&lat=&keypointId=`。

**布局**：`MobileShell`。顶部导航栏：左「取消」、中「新建标记」、右「提交」（蓝色文字按钮）。中间滚动表单区。底部固定玻璃条（`glass` + 安全区 padding）。

**表单区全部用白色实色 `.card` 分组，这里不用玻璃**（密集输入，玻璃会牺牲可读性）。分组间距 16px，页面左右 16px。

**分组与元素**：

1. **标记类型** —— `SegmentedControl`，左「警告」右「普通信息」。选中态：警告红底白字 / 信息蓝底白字。下方一行灰色说明（12px `text-ink-2`）：「警告与普通信息仅作分类，无处理流程」
2. **位置** —— 一行图标 + 「此处（长按拾取）」+ 右侧「重新选择」蓝色文字；下方一行 12px 小字显示坐标 `E 106.2718, N 37.5421`
3. **描述** —— 多行输入框，必填项左侧红星。右下角计数器 `{len}/500`，**实时计算，不要硬编码 38**
4. **照片** —— 3×3 九宫格（`PhotoGrid`），已上传 4 张为渐变色块 + 序号，剩 5 格虚线边框 + 灰色相机图标。分组标题右侧「4/9」。标题行下方「+ 拍照」「从相册选择」两个蓝色文字入口
5. **录音** —— 状态条：左侧红色圆形按钮 + 波形条 + 时长 `00:37 / 01:00` + 右侧删除图标。下方 12px 灰字「最长 60 秒，超时自动停止」

**底部固定条**：左侧「存为草稿」（次级文字），右侧主按钮「提交标记」（`bg-info`，约占宽度 60%，高 48，`rounded-control` 14px）

**示例文案（逐字，用于默认值）**：
> K12+300 处管线上方发现第三方施工取土，已现场制止并拍照留证

**交互**：
- 类型切换 → 徽章色、提交按钮不换色（提交按钮恒为信息蓝）
- 「重新选择」→ 打开落点面板（画板 4）或关键点选择器
- 点击空照片格 → 填入一张渐变色块占位，计数 +1
- 「提交标记」→ 校验描述非空 → 写入 store → toast「标记已提交」→ 返回 `/`
- 「存为草稿」→ toast「已存为草稿，待同步 +1」→ 返回 `/`
- 「取消」→ 若无输入直接返回；有输入弹二次确认「放弃本次编辑？」

**状态**：描述为空时提交按钮 `disabled`（50% 透明）/ 字数超 500 时输入框边框变 `alert`，计数器变红

**验收**：
- [ ] 描述计数器实时变化，示例文案实际长度不是 38 也算对
- [ ] 九宫格是 3 列，不是 4 张图撑满一行
- [ ] 底部条是玻璃，表单区是白色卡片（两者不能混）
- [ ] 页面里没有任何「严重程度」选项

---

### 画板 7「关键点选择器」 `B3`

**布局**：全屏页（不退化为弹层，独立路由 `/mark/new/keypoint` 更容易做返回）。顶部导航「选择关键点」+ 左「取消」。

**元素**：
- 玻璃搜索框（`.glass`，放大镜 + 占位「搜索编号或名称」）
- 类型筛选胶囊组：「全部 / 加密桩 / 智能测试桩 / 阀室」，选中为深色实底（`bg-ink text-white`），未选为白底 + `border-hairline`
- 列表：白 `.card`，每行左侧 `KeypointIcon`（三色三形状）、中间两行（名称在上 14px、编号在下 12px `text-ink-2`）、右侧距离（`font-mono` 12px）+ `ChevronRight`
- 列表顶部右侧一个小标签「按距离排序」（12px `text-ink-2`）

**示例文案**：可见 6–7 条。首条距离 `86m`，名称如「3# 阀室」，编号「JMZ-0421」

**交互**：
- 搜索 → 实时过滤（编号或名称包含即可，忽略大小写）
- 类型胶囊 → 单选取值过滤
- 点击某行 → 回 `/mark/new?keypointId=xxx&lng=&lat=`，标记位置显示「关键点 JMZ-0421 · 加密桩」
- 「取消」→ 返回上一页

**状态**：搜索无结果 → `EmptyState`「没有匹配的关键点」+ 副文案「试试搜索编号后四位」/ 列表项 ≥7 条时页面可滚动，搜索框吸顶

**验收**：
- [ ] 三种关键点图标肉眼可区分（12px 圆 / 12px 圆带光晕 / 14px 圆角方）
- [ ] 智能测试桩的淡青光晕是 20px，不能大到糊成一团
- [ ] 筛选只有类型，没有其他维度

---

### 画板 6「标记详情」 `B4`

**布局**：地图在上方约 55%，下方玻璃详情面板（顶部圆角 28px，`glass-sheet`）占 45%。手机端 `h-[100dvh]`。

**元素（自上而下）**：
- 拖拽条（36×4，`bg-ink/20`）
- 类型徽章（红底白字圆角小标签「警告」）+ 右侧「编辑」「删除」两个文字按钮
- 描述正文：16px，`leading-[1.6]`
- 位置信息行：图钉图标 + 「关键点 JMZ-0421 · 加密桩」+ 右侧「查看」
- 图片网格：2 列可横向滑动缩略图，右下角显示「1/4」
- 录音条：播放按钮 + 波形 + `00:37`
- 极淡分隔线 + 创建人：「张建国 · 巡线工」/「2026-11-19 14:32」

**交互**：
- 「编辑」→ 复用画板 5 的表单（预填当前值）；**只有 `creatorId === 当前用户 id` 时才显示「编辑」「删除」**
- 「删除」→ 二次确认「删除后不可恢复」→ 从 store 移除 → 返回 `/`
- 「查看」位置 → 地图居中到该点（当前可只做 toast「已定位到关键点」）
- 图片点击 → 全屏预览（可先只做占位）
- 返回 → 上一页

**状态**：标记不存在（如直接访问无效 id）→ `EmptyState`「标记不存在或已被删除」+ 「返回地图」按钮

**验收**：
- [ ] 地图与面板比例 55:45，面板不能吃掉地图上下文
- [ ] 非本人标记看不到编辑/删除
- [ ] 面板是玻璃，能透出下方地图的颜色

---

### 画板 10「管理后台 · 用户管理」 `B5`

**布局**：`AdminLayout`。左导航 240px，`bg-admin-nav`（`#F7F7F9` 实色，**不做玻璃**）。

**左导航**：
- 菜单项：概览 / 用户管理 / 标记管理 / 关键点台账 / 审计日志
- 选中态：蓝色左侧 3px 竖条 + 淡蓝底（`bg-info/10`）
- 底部管理员信息「李国强 · 管理员」

**顶栏**：面包屑「系统管理 / 用户管理」+ 右侧搜索、通知铃铛、头像

**内容区**：
- 标题行「用户管理」+ 右侧主按钮「+ 新增用户」
- 统计行：三张 `StatCard`（在册用户 48 / 已停用 5 / 本月新增 6）
- 筛选行：搜索框（占位「姓名 / 手机号」）、职位下拉、状态下拉、日期范围、右侧「导出」次级按钮
- 表格：列头 **姓名 / 职位 / 手机号 / 角色 / 状态 / 创建时间 / 操作**。8–10 行示例。状态列彩色圆点 + 文字（启用绿 / 停用灰）。操作列「编辑」「重置密码」「停用」三个文字链接，「停用」为灰红。**斑马纹 + 悬停行高亮**
- 底部分页：左「共 53 条」，右页码 + 每页条数选择

**关键约束（必须实现）**：当前登录管理员自己那一行（李国强），「停用」为**禁用态**：灰色 + `Lock` 图标 + `title="不能停用自己"`。产品没有删除用户的入口。

**交互**：
- 「+ 新增用户」→ 打开画板 12 弹窗
- 「编辑」→ 打开编辑弹窗（同画板 12 表单，预填；**编辑自己时「角色」单选禁用**）
- 「重置密码」→ 确认弹窗「将生成新密码并线下告知本人」→ toast「密码已重置」
- 「停用」→ 确认 → 该行状态变灰、统计卡「已停用」+1
- 搜索 / 职位 / 状态筛选 → 实时过滤表格，分页数字随之变化
- 「导出」→ toast「导出功能建设中」
- 导航点「概览 / 关键点台账 / 审计日志」→ `EmptyState`「功能建设中」

**验收**：
- [ ] 表格和筛选区是白色实色，不是玻璃
- [ ] 自己那行的停用按钮是禁用态且有锁图标
- [ ] 统计三个数字与 mock 数据对得上（48 + 5 = 53）
- [ ] 悬停行有背景变化，斑马纹肉眼可辨

---

### 画板 12「新建用户 · 弹窗」 `B5`

**布局**：在画板 10 上叠 `bg-scrim`（`rgba(0,0,0,0.25)`）遮罩，中央 520px 白卡，圆角 20px，`shadow-glass`。

**元素**：
- 标题「新增用户」+ 副标题灰色小字「账号创建后请将初始密码线下告知本人」
- 表单：
  - 姓名（必填）
  - 手机号（必填，提示「作为登录名，不可重复」）
  - 职位下拉：巡线工 / 段长 / 现场代表 / 技术员 / 监控室值班员 / 司机
  - 角色单选：普通用户 / 管理员
  - 初始密码（带「随机生成」文字按钮）
- 底部右对齐：「取消」次级按钮 +「创建账号」主按钮

**交互**：
- 「随机生成」→ 填入 8 位随机密码（字母+数字），并显示一个小「已复制」提示
- 手机号重复 → 字段下方红字「该手机号已存在」
- 「创建账号」→ 校验通过后加入 store，表格首行出现新用户，toast「账号已创建」→ 关闭弹窗
- 「取消」/ 点遮罩 / Esc → 关闭，若已填内容则二次确认

**状态**：提交中按钮 loading 300ms

**验收**：
- [ ] 弹窗宽 520px，不是撑满屏幕
- [ ] 表单字段与职位选项逐字一致
- [ ] 遮罩层不透出后台的色彩干扰

---

### 画板 11「管理后台 · 标记管理 + 详情抽屉」 `B6`

**布局**：`AdminLayout`，左导航选中「标记管理」。主列表占满内容区，右侧压一个 480px 抽屉（从右滑出，白色实底，左侧 1px 边框 + 大阴影）。

**列表行**（卡片式，不是传统表格）：
- 左：缩略图 56×56，圆角 8px（渐变色块占位）
- 中：描述两行截断（`line-clamp-2`）+ 下方元信息行（类型徽章 / 创建人 / 时间 / 坐标）
- 右：「查看」「删除」

**抽屉内容**：
- 顶部「标记详情」+ 关闭 `X`
- 类型徽章 + 创建人 + 时间
- 大图预览区（4 张小图纵向排列，第一张为主图）
- 描述全文
- 音频播放器（波形 + 播放键 + 时长）
- 位置：200px 高迷你静态地图缩略，标出该点（复用 `MapBackdrop` 缩小版即可）
- 底部固定操作区：左「删除标记」红色描边按钮 + 右「关闭」次级按钮
- 删除按钮上方一行极小的橙色警示文字（`text-warn-ink` 11px）：「删除后不可恢复，操作将记入审计日志」

**交互**：
- 「查看」→ 打开抽屉（右滑入 320ms `ease-glass`）
- 「删除」→ 确认后从 store 移除，列表刷新，抽屉关闭，toast「标记已删除」
- 「关闭」/ X / Esc → 抽屉滑出

**验收**：
- [ ] 抽屉宽 480px，左边缘有 1px 边框 + 明显阴影
- [ ] 迷你地图 200px 高
- [ ] 删除警示文字在按钮上方，不是下方

---

## 6. 每批的收尾动作

1. `npx tsc --noEmit` 必须零错误
2. `npm run build` 必须通过
3. 截图核对（方法见 §8）
4. **更新 §7 进度表**（这是下一个会话能无缝接上的唯一保证）
5. 如果引入了新的设计判断或与规格的偏差，追加到 `docs/ui-notes.md` 第 4 节

---

## 7. 进度表

| 批次 | 内容 | 状态 |
| --- | --- | --- |
| P0 | 交接文档 | ✅ |
| P1a | format + mock 数据 | ✅ |
| P1b | 18 个 UI 基元 + token | ✅ |
| P1c | 布局壳 + 路由守卫 | ✅ |
| P2 | 登录 / 我的 / 缩放提示 | ✅ |
| B1 | 长按落点 Sheet（画板 4） | ✅ |
| B2 | 新建标记表单（画板 5） | ✅ |
| B3 | 关键点选择器（画板 7） | ❌ 待做 |
| B4 | 标记详情（画板 6） | ❌ 待做 |
| B5 | 用户管理 + 新建用户（画板 10、12） | ❌ 待做 |
| B6 | 标记管理 + 抽屉（画板 11） | ❌ 待做 |

**下一批从这里开始：B3**

### 7.1 B1 / B2 落地记录（2026-11-19）

新增文件：

| 文件 | 作用 |
| --- | --- |
| `src/components/map/LandingPointSheet.tsx` | 画板 4 面板本体，导出 `LandingChoice` 联合类型；`geoFail` 控制定位失败态 |
| `src/components/map/MapPickState.tsx` | 长按拾取状态机：480ms 长按→双色引脚 + 面板；`?pick=1` 直接开、`?geo=fail` 失败态 |
| `src/pages/mark/NewMarkPage.tsx` | 画板 5 表单，路由 `/mark/new` |

改动文件：

- `MapPageMobile.tsx`：在 `MapCanvas` 之后插入一行 `<MapPickState />`，布局与层级顺序未动
- `routes.tsx`：`/mark/new` 由 `ComingSoon` 换成 `NewMarkPage`
- `components/ui/Overlay.tsx`：`Sheet` 增加 `scrim?: boolean`（默认 true，地图落点面板传 false）
- `components/ui/AudioBar.tsx`：增加 `tone?: 'info' | 'alert'`（录音态用红按钮）
- `index.css`：补 `prefers-reduced-motion` 降级

验收实测（375×812 无头截图 + DOM 断言）：

- 落点面板三行高度 57px（≥56），点击热区覆盖整行
- 提交链路：`/?pick=1` →「使用此位置」→ `/mark/new?lng=106.2721&lat=37.5447&src=picked` →「提交标记」→ `/` + toast「标记已提交」
- 长按层派发 `pointerdown` 480ms 后：面板出现、双色引脚出现
- 描述计数器读实际长度 33/500（示例文案本身 33 字，不是 38）

截图：`docs/design-ref/build-b1-pick.png`、`build-b1-geofail.png`、`build-b2-form.png`、`build-b2-form-lower.png`

---

## 8. 截图与比对（必须按这个来，否则会误判）

### 8.1 为什么不能直接截

Chrome 无头 `--screenshot` 直出页面会**丢弃带 `backdrop-filter` 的合成层**，导致玻璃浮层和实色 FAB 整块不出现。看起来像布局 bug，实际是截图方式的问题。本项目为此排查过一轮。

### 8.2 正确做法

在 `frontend/public/` 放一个 iframe 容器页：

```html
<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;overflow:hidden}iframe{display:block;border:0}</style>
</head><body><script>
const p = new URLSearchParams(location.search)
const f = document.createElement('iframe')
f.src = '/'
f.width = p.get('w') || '375'
f.height = p.get('h') || '812'
document.body.appendChild(f)
</script></body></html>
```

然后：

```bash
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
"$CH" --headless=new --disable-gpu --hide-scrollbars \
  --user-data-dir="C:/Users/Bing/AppData/Local/Temp/shot-$(date +%s)" \
  --window-size=375,812 \
  --screenshot="D:/CODE/Pipe/FullStack/docs/design-ref/build-xxx.png" \
  --virtual-time-budget=9000 \
  "http://localhost:5173/_shot.html?w=375&h=812"
```

三个要点：
- **必须走 iframe**，不能直接指 `localhost:5173/`
- **每次换一个 `--user-data-dir`**，否则 Chrome 读缓存返回旧页面
- 截完删掉 `public/_shot.html`，别提交

**切角色截图**：`_shot.html` 支持 `seed` 参数写入 localStorage。管理员页用
`?_shot.html?w=1440&h=900&p=/admin/users&seed=13900001001`，巡线员页不带 seed 即可（默认巡线员）。

### 8.3 比对

`docs/design-ref/compare.html` 可以拖滑杆把实现图叠在参考图上，错位会以重影直接暴露。新增页面的参考图存 `ref-<name>.png`，实现图存 `build-<name>.png`。

---

## 9. 新会话启动语（复制这段）

```
读 docs/handoff-frontend.md 和 docs/ui-notes.md，按 §7 进度表从 B1 开始。
本次只做 B1 和 B2 两批，做完跑 tsc --noEmit 和 npm run build，按 §8 出截图，然后更新 §7 进度表。
严格遵守 §2 的 12 条铁律，不要改动已完成的地图两屏布局，不要修 docs/ui-notes.md 第 4 节列出的已知偏差。
```

只做一批时，把上面第一行的「B1 和 B2」替换成对应批次号即可。
