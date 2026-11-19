# 前端 UI 落地说明

> 来源：Pixso 设计稿（`DnsTj0HmTwyTWH1iOoUkhA`，页面 `0:1`）→ React 19 + Tailwind v3 手写组件。
> 生成日期：2026-11-19

## 1. 设计 token

全部落在 `frontend/tailwind.config.js` 的 `theme.extend`，不要写散落的十六进制。

| 用途 | 类名 | 值 |
| --- | --- | --- |
| 警告标记 | `text-alert` / `bg-alert` | `#FF3B30` |
| 普通信息 / 主色 | `info` | `#0A84FF` |
| 系统背景 | `canvas` | `#F2F2F7` |
| 主文字 / 次级文字 | `ink` / `ink-2` | `#1C1C1E` / `#8E8E93` |
| 分隔线 | `hairline` | `rgba(60,60,67,0.12)` |
| 成功 | `success` | `#34C759` |
| 管道线 | `pipeline` | `#45525E` |
| 关键点 | `stake` / `stake-test` / `valve` | `#5B6B7C` / `#30B0C7` / `#8E7BEF` |
| 圆角 | `rounded-control/card/card-lg/glass/glass-lg` | 10 / 16 / 20 / 24 / 28 |
| 阴影 | `shadow-glass` / `shadow-glass-inset` / `shadow-fab` / `shadow-pin` | — |
| 缓动 | `ease-glass` + `duration-240/320` | `cubic-bezier(.32,.72,0,1)` |

**玻璃效果统一用 `src/index.css` 的 `@layer components` 工具类**，不要用 `backdrop-blur-*` 拼：

- `.glass` — 55% 白 + `blur(20px) saturate(180%)` + 顶部 1px 高光 + 48px 外阴影，r24
- `.glass-strong` — 72% 白，信息密集小胶囊
- `.glass-sheet` — 72% 白，仅顶部两角 28px 圆
- `.glass-btn` — 44px 玻璃圆按钮

三处都同时写了 `-webkit-backdrop-filter`，并在 `@supports not` 和 `prefers-reduced-transparency` 下降级为纯色（PRD §6.1 要求）。

## 2. 断点策略

**不做逐条 `md:` 微调**。两套页面壳共存，用 CSS 互斥：

```tsx
// src/pages/map/MapPage.tsx
<div className="lg:hidden"><MapPageMobile /></div>
<div className="hidden lg:block"><MapPageDesktop /></div>
```

- `< 1024px` 一律手机布局（横向拉伸也走手机布局）
- `>= 1024px` 走 380px 侧栏 + 地图
- 根容器用 `h-[100dvh]`，不用 `h-screen`（避开 iOS 地址栏）

## 3. 地图交换约定（重要）

`src/components/map/MapCanvas.tsx` 是**唯一的地图交换点**：

```tsx
<div className="absolute inset-0 bg-map-base">
  <MapBackdrop />           {/* 降级底图：无 Key / SDK 失败时显示 */}
  <div id="map-canvas" />   {/* 高德挂载点，canvas 由 SDK 自己插入 */}
</div>
```

- `MapCanvas` 绝对定位铺满且必须是**第一个子元素**；所有玻璃浮层排在它之后，靠 DOM 顺序决定层级，不靠 `z-index` 堆叠。
- 有 Key 时：`loadAMap()` → `new AMap.Map(#map-canvas)`，地图就绪后 `MapBackdrop` 淡出。浮层组件仍未改动。
- 无 Key / SDK 加载失败：`MapBackdrop` 继续显示，界面不会白屏——它是**降级底图，不是"接入后删除"**。
- 地图实例通过 `src/lib/map-runtime.ts` 的订阅（`useMapInstance`）暴露给兄弟组件。不用 Context，是为了不在两屏地图页面里加 Provider、不动已验收的 DOM 结构。
- 像素 ↔ 经纬度：`map.containerToLngLat` / `map.lngLatToContainer`。高德底图是 **GCJ-02**，台账若是 WGS-84 需先转换（见 PRD §坐标）。
- 高德自带的 `.amap-logo` / `.amap-copyright` 是 `z-index:10` 绝对定位元素，必须用 CSS 抬到 `bottom: 246px`（手机），否则会盖住底部玻璃卡片。见 `src/index.css` 末尾。
- 缩放用 `map.setZoom(z, true)`（立即生效）。带动画时，动画期间 `containerToLngLat` 读到的是中间帧坐标。

### 3.1 覆盖物层（`MapOverlay`）

DOM 顺序：`MapCanvas` → `MapOverlay` → `MapPickState` → 其余浮层。覆盖物层整体 `pointer-events: none`，只有图钉按钮是 `auto`，否则会吃掉地图拖动。

- **用 React 叠加层，不用 `AMap.Marker`**：图钉复用 `MarkPin`（双色规则不重写）、位置由 `lngLatToContainer` 算出、聚合只是一次数组计算。
- 平移缩放后重算像素：订阅 `useMapTick()`（`notifyViewChange` 用 rAF 合并，避免拖动时每帧多次重渲染）。
- 视口尺寸用 `useMapSize()`，**不要读 `map.getSize()`**：实测高德 2.0 在 iframe / 断点壳里会返回 `0×0`，而 DOM 已经是 375×812。
- 断点壳两套布局同时挂载，只有一个地图实例。`MapCanvas` 等容器**有尺寸才创建地图**（`display:none` 那套不启动），`MapOverlay` 再用「地图容器是不是自己父节点的子节点」判断归属，隐藏那套不渲染，否则同一批图钉会出现两遍、坐标按另一套尺寸算。
- 关键点聚合按 **72px 屏幕网格**（`zoom < 15` 时），单个点仍画图标，多个点画 `ClusterBubble` 计数；点击聚合 → `setZoom(16)` + 居中。
- `VIEW_PAD` 保持 0：给正数会让贴边图钉被容器裁掉半个。


## 4. 与设计稿的已知偏差

这些是**有意为之**，不是漏做：

| 偏差 | 原因 |
| --- | --- |
| 筛选条只保留一个「仅看警告」蓝色胶囊 | 设计稿把同一个筛选器的两种状态（灰字 + 蓝底）同时画了出来，重复。按一个可切换按钮实现，静态展示选中态 |
| 右侧四个地图控件 + 蓝色 FAB + 「待同步」胶囊可见 | 设计稿把它们放在 `left:315 top:560` 等位置，被底部卡片（`top:568`）完全压住而看不见。已改为锚定在卡片上方，保证可点 |
| 底部卡片高度 244px（设计稿 300px） | 设计稿卡片 `top:568 + height:300 = 868`，超出 812 画板被裁。改为贴底 244px，使卡片顶边落在 568，视觉与设计稿一致 |
| 列表缩略图为渐变色块 | 设计稿是现场照片，但该类资源在 D2C 的 `resourceManifest` 里没有 guid，无法导出 |
| 字体用 `PingFang SC` 系统栈 | 设计稿用 `Noto Sans SC`。PRD §6.1 明确要求苹果系统字体栈，中文度量会有 1–3px 差异 |
| 地图上新增图钉/关键点/聚合气泡 | 设计稿的地图层只有路网与管线，没画覆盖物。PRD 要求的关键点、标记、当前位置需要落到地图上，按「标记图钉 + 关键点图标 + 蓝点」三层实现 |
| 关键点 `zoom < 15` 才聚合 | PRD D9 只要求「按缩放级别聚合」，没给阈值。15 级时 14 个点刚好散得开；上真实台账（500–5000 条）时应改成按视口密度自适应 |
| 标记图钉不做聚合 | PRD D9 的聚合要求只针对关键点。缩到 13 级以下 7 个图钉会叠在一起，如果现场当天标记变多需要补同样一层 |
| 单点关键点点击只弹 toast | 规格没定义关键点点击行为（v1 详情页也只服务标记）。用 toast 提示编号+名称+类型，不做成页面，避免新增未定义路由 |
| 登录页多一行极小演示提示 | 需要说明「13900001001 为管理员、其他手机号为巡线员」才能演示角色切换。正式环境删除 |
| 「我的」页左上加了返回图标 | 设计稿只有大标题，没有返回入口，纯手机 Web 会走进死路 |
| 缩放过度提示通过 `/?zoom=province` 触发 | 它是地图页的一个状态，没有独立路由。用查询参数展示，不改变默认布局 |
| 落点面板（画板 4）用 `/?pick=1` 触发，失败态用 `?geo=fail` | 同上：长按是交互入口，截图与演示需要一个可寻址的 URL |
| 落点面板不铺 `bg-scrim` 遮罩 | 设计稿是「地图全屏不变」的一个状态，压暗会削弱地图上下文。给 `Sheet` 加了 `scrim={false}`，面板外侧点击穿透到地图，可连续重新拾取 |
| 地图 FAB 仍然直接进表单，未改为先弹落点面板 | §5 B1 括号里写了「或点击 FAB 后」，但改 FAB 会动到已验收的地图屏交互。表单内可用「重新选择」调起面板，路径等价 |
| 表单「重新选择」复用同一张落点面板 | 画板 5 与画板 4 是同一个拾取组件，避免两套坐标逻辑漂移 |
| 右侧地图控件从 4 个变 5 个（新增「选点」） | 接真地图后，长按拾取层不能再常驻拦截（会吃掉拖动与双指缩放），需要一个显式入口。图标 `Crosshair`，激活时实底 `bg-info` |
| 选点模式下顶部多一条 36px 提示条 | 模式本身不可见，不给提示用户不知道要长按。只在选点模式存在，退出即消失，不占常驻布局 |
| 桌面端没有「选点」按钮 | 桌面没有长按习惯，也有「添加标记」直达入口；v1 不在桌面做地图拾取 |
| 底图默认用高德标准样式 | 设计稿要 `#F7F7F5` 极简路网，需要在控制台建自定义地图样式。`VITE_AMAP_STYLE_ID` 留空即用默认，拿到样式 ID 后改环境变量即可切换 |
| 高德 logo/版权被抬到底部卡片上沿（`bottom: 246px`） | 它们是 `z-index:10` 的绝对定位元素，会盖在玻璃卡片上。不做 z-index 军备竞赛，改为抬进卡片与「待同步」胶囊之间的窄带；桌面端仍贴底边 |
| 录音删除后显示「点击录音」虚线占位 | 设计稿只画了已有录音的状态，没有空态；补最轻量的回填入口，不新增字段 |
| 新增 `prefers-reduced-motion` 全局降级 | 原 CSS 只降级了透明度，没有降级动效。此条也让无头截图能取到稳定终态 |
| 底部内边距写成 `calc(12px_+_env(...))` | `calc(12px+env(...))` 缺空格是非法 CSS，`padding-bottom` 会被整条丢弃（已修 Sheet 与表单底部条；`MePage` 仍是旧写法，见 §7） |
| 详情页左上加了玻璃返回按钮 | 设计稿没有返回入口，纯手机 Web 会走进死路（与「我的」页同一处理） |
| 详情页「编辑」复用 `/mark/new?edit=<id>`，不新开路由 | 画板 6 只要求复用画板 5 的表单，加个查询参数比复制一份表单更稳 |
| 详情页内容超过 45% 面板时面板内滚动 | 设计稿按固定内容高度画的；真实内容是 4 图 + 录音 + 创建人，45% 装不下 |
| 用户表当前登录行加一个「我」小标签 | 规格只要求自己那行停用为禁用态；不加标记的话「为什么这行点不了」无从解释 |
| 已停用用户的操作列显示「启用」 | 规格只写了「停用」；已停用的行再显示「停用」没有意义，做成可逆开关 |
| 日期范围用两个原生 `<input type="date">` | 规格只写「日期范围」，没有说控件形态；原生控件零依赖且能真正过滤 |
| 抽屉的「删除」用行内二次确认 | 规格只说「确认后从 store 移除」，没定义确认形态；后台不用弹窗叠弹窗 |
| 字段校验红字改到输入框下方 | 原基元把 error 渲染在标题行右侧（和 hint 抢位置），规格明确要求「字段下方红字」 |
| 后台「概览 / 关键点台账 / 审计日志」已完成 | B7 落地：概览用 div 堆叠柱 + conic-gradient 环形图（不引图表库）；台账按桩号排序（接口默认按距离）；审计日志只读 |

## 5. 验收数值（375 宽，容差 ≤2px）

用 `el.getBoundingClientRect()` 对照，已实测通过：

| 元素 | 设计值 | 实现值 |
| --- | --- | --- |
| 搜索胶囊 | `x16 y16 343×48` r24 | 一致 |
| 筛选条 | `x16 y72 343×40` r14 | 一致 |
| 地图控件 | `44×44`，间距 12，`x315` | 一致（纵向起点因可见性修正下移） |
| FAB | `x303 y492 56×56` r28 | 一致 |
| 待同步胶囊 | 高 36 r18 | 一致（纵向位置因可见性修正） |
| 底部卡片 | `w359` r28，顶边 568 | 一致 |

### 5.1 B3–B6 实测规格（无头 Chrome 1440×900 / 375×812）

| 元素 | 要求 | 实现 |
| --- | --- | --- |
| 关键点列表行 | 首条 `86m`、编号 `JMZ-0421` | 一致（14 条，按距离升序） |
| 关键点图标 | 12 圆 / 12 圆 + 20 光晕 / 14 圆角方 | 一致（valve 为 `rounded-[3px]`） |
| 详情页地图:面板 | 55 : 45 | 一致（`h-[55%]` / `h-[45%]`） |
| 新建用户弹窗 | 520 宽 | 一致（`Modal width={520}`） |
| 标记抽屉 | 480 宽 + 左 1px 边 + 大阴影 | 一致（`Drawer width={480}`） |
| 抽屉迷你地图 | 200 高 | 一致 |
| 用户表统计 | 48 / 5 / 6，且 48+5=53 | 一致（来自 store，新建用户后同步变化） |

## 6. 截图与比对

- 参考图：`docs/design-ref/ref-mobile-375.png`、`ref-desktop-1440.png`（Pixso `take_screenshot`）
- 实现图：`docs/design-ref/build-mobile.png`、`build-desktop.png`
- 叠加比对：浏览器打开 `docs/design-ref/compare.html`，拖动滑杆看重影

**取图注意**：Chrome 无头直出（`--screenshot` 直接指向页面）会丢掉带 `backdrop-filter` 的合成层，导致玻璃浮层和 FAB 不出现。必须用 iframe 容器页间接截取，或直接在真实浏览器里看。

## 7. 待办

- ~~接入高德 JS API~~ 已完成（`lib/amap.ts` + `MapCanvas`；`MapBackdrop` 转为降级底图保留）
- ~~地图覆盖物~~ 已完成（`MapOverlay.tsx`：关键点 + 标记图钉 + 当前位置，关键点按缩放聚合，见 §3.1）
- 管道线图层未画：mock 只有 `pipelineId`，没有几何数据
- 标记图钉未聚合：缩到 13 级以下会叠在一起（PRD 未要求）
- 高德自定义地图样式（`VITE_AMAP_STYLE_ID`）待控制台调色后填入
- 用真实接口替换 `src/lib/mock-marks.ts`
- 补齐其余 10 屏设计稿后，按同样方式落到 `src/pages/`
- `src/pages/MePage.tsx` 的 `pb-[calc(20px+env(safe-area-inset-bottom))]`、`pt-[calc(12px+env(safe-area-inset-top))]` 同样是缺空格写法，底部/顶部安全区实际未生效。属已完成页面，未在 B1/B2 动它，留给下一批顺手修
- `src/components/map/MarkSheet.tsx` 的 `pb-[env(safe-area-inset-bottom)]` 写法正确，无需处理
