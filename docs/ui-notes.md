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
  <MapBackdrop />           {/* 纯装饰，接入高德时整块删除 */}
  <div id="map-canvas" />   {/* 高德挂载点 */}
</div>
```

- `MapCanvas` 绝对定位铺满且必须是**第一个子元素**；所有玻璃浮层排在它之后，靠 DOM 顺序决定层级，不靠 `z-index` 堆叠。
- 接高德时只改 `MapCanvas` 内部（`new AMap.Map(mapCanvas)`），浮层组件一行不动。
- `MapBackdrop` 是手绘 SVG（浅灰底 + 白路网 + 深灰管线），仅用于还原设计稿观感，**不是真实地图**。

## 4. 与设计稿的已知偏差

这些是**有意为之**，不是漏做：

| 偏差 | 原因 |
| --- | --- |
| 筛选条只保留一个「仅看警告」蓝色胶囊 | 设计稿把同一个筛选器的两种状态（灰字 + 蓝底）同时画了出来，重复。按一个可切换按钮实现，静态展示选中态 |
| 右侧四个地图控件 + 蓝色 FAB + 「待同步」胶囊可见 | 设计稿把它们放在 `left:315 top:560` 等位置，被底部卡片（`top:568`）完全压住而看不见。已改为锚定在卡片上方，保证可点 |
| 底部卡片高度 244px（设计稿 300px） | 设计稿卡片 `top:568 + height:300 = 868`，超出 812 画板被裁。改为贴底 244px，使卡片顶边落在 568，视觉与设计稿一致 |
| 列表缩略图为渐变色块 | 设计稿是现场照片，但该类资源在 D2C 的 `resourceManifest` 里没有 guid，无法导出 |
| 字体用 `PingFang SC` 系统栈 | 设计稿用 `Noto Sans SC`。PRD §6.1 明确要求苹果系统字体栈，中文度量会有 1–3px 差异 |
| 地图无图钉/关键点/聚合气泡 | 设计稿的地图层实际只有路网与管线，并未画图钉。图钉待接高德后用 React 组件叠加 |
| 登录页多一行极小演示提示 | 需要说明「13900001001 为管理员、其他手机号为巡线员」才能演示角色切换。正式环境删除 |
| 「我的」页左上加了返回图标 | 设计稿只有大标题，没有返回入口，纯手机 Web 会走进死路 |
| 缩放过度提示通过 `/?zoom=province` 触发 | 它是地图页的一个状态，没有独立路由。用查询参数展示，不改变默认布局 |

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

## 6. 截图与比对

- 参考图：`docs/design-ref/ref-mobile-375.png`、`ref-desktop-1440.png`（Pixso `take_screenshot`）
- 实现图：`docs/design-ref/build-mobile.png`、`build-desktop.png`
- 叠加比对：浏览器打开 `docs/design-ref/compare.html`，拖动滑杆看重影

**取图注意**：Chrome 无头直出（`--screenshot` 直接指向页面）会丢掉带 `backdrop-filter` 的合成层，导致玻璃浮层和 FAB 不出现。必须用 iframe 容器页间接截取，或直接在真实浏览器里看。

## 7. 待办

- 接入高德 JS API（替换 `MapCanvas` 内部，删除 `MapBackdrop`）
- 用真实接口替换 `src/lib/mock-marks.ts`
- 补齐其余 10 屏设计稿后，按同样方式落到 `src/pages/`
