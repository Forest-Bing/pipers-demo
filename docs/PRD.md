# 国家管网管道巡检标记系统 · 需求文档

| 项 | 内容 |
| --- | --- |
| 版本 | v1.2 |
| 日期 | 2026-11-19 |
| 状态 | 已确认（基于 13 项决策 D1–D13 编写） |
| 定位 | 演示 / 试点原型，**不直接承载真实生产数据** |
| 变更 | v1.2：部署平台**回退到 Vercel**（前端静态 + 后端 Python Functions），数据库**继续使用 Neon**；v1.1 的 EdgeOne Pages 方案作废（保留于决策记录 D12） |

> 文中标记 ⚠️ 的条目为**已知限制或风险**，不是待办事项。

---

## 1. 项目目标与范围

为管道部门提供"地图 + 现场标记"工具：巡线人员在管道沿线记录隐患与普通信息，管理员维护人员台账。

### 1.1 本期做（v1）

- 高德地图展示：管道线、关键点（加密桩 / 智能测试桩 / 阀室）、标记点、用户当前位置
- 现场添加标记：三种落点、两类标记、文字 + 最多 9 张照片 + 最多 1 段录音
- 管理员后台：账号管理、标记列表与删除

### 1.2 本期不做（明确排除）

| 不做 | 原因 |
| --- | --- |
| 警告处置流程（认领 / 核实 / 消除） | 决策 D1：警告与普通信息仅作类型区分，无生命周期 |
| 片区 / 管段级数据隔离 | 决策 D7：所有普通用户可见范围一致 |
| 统计报表、数据导出 | 需求未提出 |
| 离线地图、PWA | 高德不提供免费离线瓦片，成本远超其他模块 |
| 消息推送、站内通知 | 需求未提出 |
| 视频附件 | 需求未提出 |

---

## 2. 用户与权限

### 2.1 角色

| 角色 | 登录方式 | 权限边界 |
| --- | --- | --- |
| 普通用户 | 手机号 + 密码 | 查看地图、创建标记、编辑/删除**自己创建的**标记。**不能自行注册** |
| 管理员 | 手机号 + 密码 | 用户管理、标记列表查看与删除。**无地图写入权限**（决策 D5），是纯后台角色 |

### 2.2 普通用户字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| 姓名 | 文本 | 是 | |
| 职位 | 枚举 | 是 | 巡线工 / 段长 / 现场代表 / 技术员 / 监控室值班员 / 司机 |
| 手机号码 | 文本 | 是 | **唯一，作为登录名** |

### 2.3 账号规则

- 所有账号必须由管理员在后台创建，系统不提供任何注册入口
- 初始密码由管理员建号时直接指定，不强制首次登录修改（决策 D6）
- 账号只能**停用**，不能物理删除（保留历史标记的 `created_by` 引用完整性）
- 管理员可重置任意用户密码；忘记密码只能走管理员重置
- ⚠️ 管理员不能停用、删除或降级自己，防止锁死唯一管理员账号
- ⚠️ **安全基线刻意从简**：无登录失败锁定、无强制改密、token 存 localStorage。因此 `audit_logs` 只能证明"某账号执行了某操作"，不能证明是本人操作

---

## 3. 功能需求

### 3.1 地图主界面（用户端）

| 需求项 | 规则 |
| --- | --- |
| 底图 | 高德地图 JS API，需 **Web 端（JS API）Key** + **安全密钥 jscode** |
| 图层 | ① 管道线 ② 关键点 ③ 标记 ④ 用户当前位置 |
| 当前位置 | 浏览器 Geolocation API；需 HTTPS（Vercel 默认分配证书）；需用户授权 |
| 数据拉取 | 前端传当前视野 `bbox` + `zoom`，后端只返回该范围数据（决策 D7） |
| 缩放过远 | 后端限制单次返回条数上限，前端提示"请放大地图查看" |
| 关键点渲染 | 500–5000 条量级：缩小按类型聚合为数字气泡，放大到一定级别才渲染独立图标（决策 D9） |
| 标记视觉 | 仅两种：**警告（红）** / **普通信息（蓝）**。不分严重程度，无筛选项（决策 D4） |

### 3.2 添加标记

**落点方式（三种，需求原文）**

| 落点 | 交互 | 存储 |
| --- | --- | --- |
| 当前位置 | 一键使用 GPS 坐标 | `lng/lat` = 当前定位 |
| 任意位置 | 长按地图拾取坐标 | `lng/lat` = 拾取点 |
| 关键点 | 从预存台账中选择 | `lng/lat` 继承台账坐标，同时写 `keypoint_id` |

**标记内容**

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| 类型 `kind` | 是 | `alert`（警告）/ `info`（普通信息） |
| 文字描述 | 是 | 警告和普通信息都可填 |
| 照片 | 否 | 最多 9 张，类型与两类标记无差别（决策 D3） |
| 录音 | 否 | 最多 1 段，≤ 60 秒 |

**采集与上传（决策 D11）**

1. 拍照：`<input type="file" accept="image/*" capture="environment">`，或相册选图
2. 录音：MediaRecorder，webm/opus，超 60 秒自动停止
3. 前端压缩：长边压至 1280px、质量 0.7，目标 ≤200KB/张；同时生成缩略图
4. 上传：`POST /marks/upload-token` 取临时凭证 → **浏览器直传腾讯云 COS** → 把返回 URL 随标记一起提交
5. 服务端**不接收图片二进制**，规避 Vercel 函数 4.5MB 请求体上限（9 张照片必超，一张 2MB 的也就刚够）

**弱网处理（决策 D11 补充，可降级）**

- 提交时先把表单 + 图片写入 IndexedDB，状态标记为 `pending`
- 上传成功后才真正写入业务提交；失败则保留草稿，界面显示"待同步 N 条"
- 恢复网络后自动重试，失败 3 次转为手动重试按钮

### 3.3 标记编辑与删除

- 创建者和管理员可编辑**文字描述**、**追加**照片和录音（不能替换/删除他人已上传的附件）
- 删除为**硬删除**（决策 D2），权限：
  - 创建者可删除自己创建的标记
  - 管理员可删除任何标记
- 删除动作必须级联：删 `attachments` 记录 → 异步删除 COS 对象 → 写入 `audit_logs`
- 所有编辑 / 删除行为都写入 `audit_logs`（因为数据库不留痕，日志是唯一追溯手段）

### 3.4 管理后台

| 模块 | 功能 |
| --- | --- |
| 用户管理 | 列表分页、搜索（姓名/手机号）、新增、编辑姓名·手机号·职位、重置密码、停用/启用 |
| 标记管理 | 分页列表（时间倒序，可按类型筛选）、详情（文字 + 图片 + 播放录音）、删除 |
| 无地图页 | 管理员不进入地图界面（决策 D5） |

⚠️ 因 D2 已授予管理员删除标记的权限，标记列表是其唯一入口，必须实现。

---

## 4. 数据模型

PostgreSQL（Neon）+ PostGIS。

### 4.1 表结构

**`users`**

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| id | uuid | PK |
| name | varchar(64) | not null |
| phone | varchar(20) | unique, not null |
| password_hash | varchar(255) | not null |
| position | varchar(20) | not null（枚举值见 2.2） |
| role | varchar(10) | not null，`admin` / `user` |
| status | varchar(10) | not null，`active` / `disabled` |
| created_by | uuid | FK users.id |
| created_at | timestamptz | default now() |

**`pipelines`**（多管段设计，单段场景退化为 1 条记录）

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| id | uuid | PK |
| code | varchar(32) | unique |
| name | varchar(128) | |
| geom | geometry(LineString, 4326) | not null |

**`keypoints`**（预存资产台账，决策 D8）

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| id | uuid | PK |
| type | varchar(20) | not null：加密桩 / 智能测试桩 / 阀室 |
| code | varchar(64) | unique |
| name | varchar(128) | |
| lng | double precision | not null |
| lat | double precision | not null |
| pipeline_id | uuid | FK pipelines.id，可空 |

**`marks`**

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| id | uuid | PK |
| kind | varchar(10) | not null，`alert` / `info` |
| lng | double precision | not null |
| lat | double precision | not null |
| description | text | not null |
| keypoint_id | uuid | FK keypoints.id，可空 |
| created_by | uuid | FK users.id |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

**`attachments`**

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| id | uuid | PK |
| mark_id | uuid | FK marks.id **ON DELETE CASCADE** |
| type | varchar(10) | `image` / `audio` |
| url | text | not null |
| thumb_url | text | 图片缩略图 |
| size | integer | 字节 |
| duration | integer | 音频秒数 |
| created_at | timestamptz | default now() |

**`audit_logs`**

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| id | bigserial | PK |
| actor_id | uuid | FK users.id |
| action | varchar(32) | `create` / `update` / `delete` / `login` / `reset_password` 等 |
| target_type | varchar(32) | `mark` / `user` / `keypoint` |
| target_id | varchar(64) | |
| detail | jsonb | 快照与变更摘要 |
| created_at | timestamptz | default now() |

### 4.2 索引

- `marks(created_at desc)`
- `marks(created_by)`
- `attachments(mark_id)`
- `keypoints(code)`、`keypoints(type)`
- `pipelines` 上建 GiST：`CREATE INDEX ON pipelines USING GIST (geom)`

### 4.3 坐标系约定（重要）

- **数据库统一存储 WGS-84（SRID 4326）**
- 高德地图渲染使用 **GCJ-02**，展示层做一次转换（前端用 `AMap.convertFrom` 或本地算法）
- 手机 GPS、台账坐标、标记坐标全部按 WGS-84 入库
- ⚠️ 若甲方台账本身是 GCJ-02（高德坐标），必须先统一到 WGS-84 再入库，否则整张地图偏移 100–600 米

---

## 5. 接口清单

> **路径前缀说明（Vercel 特性）**：后端入口为仓库根目录的 `api/index.py`，由 `vercel.json` 的 rewrite 把 `/api/*` 转发到该函数；平台会剥掉 `/api` 前缀，因此 FastAPI 内部路由**不写** `/api`（如 `/marks`），而前端请求的是完整路径 `/api/marks`。前端与函数部署在**同一个 Vercel 项目**、同一域名下，**无需配置 CORS**。

### 5.1 认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/auth/login` | 手机号 + 密码，返回 token + 用户信息 |
| POST | `/auth/logout` | 清 token |
| GET | `/auth/me` | 当前用户 |
| PATCH | `/auth/password` | 修改自己的密码 |

### 5.2 地图数据（需登录）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/pipelines` | 返回全部管段 GeoJSON（数量少，可全量） |
| GET | `/keypoints?bbox=` | 按视野返回关键点，超限时返回聚合点 |
| GET | `/marks?bbox=&zoom=&kind=` | 按视野返回标记；`zoom` 过低时返回 `too_wide` 提示 |
| GET | `/marks/{id}` | 标记详情（含附件） |

### 5.3 标记写入（需登录）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/marks/upload-token` | 返回 COS 临时上传凭证（10 分钟有效） |
| POST | `/marks` | 创建标记（先传文件，再提交 URL 列表） |
| PATCH | `/marks/{id}` | 编辑描述 / 追加附件 |
| DELETE | `/marks/{id}` | 硬删除（创建者或管理员） |

### 5.4 管理端（需 admin）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/admin/users` | 分页 + 搜索 |
| POST | `/admin/users` | 创建账号 |
| PATCH | `/admin/users/{id}` | 编辑姓名 / 手机号 / 职位 / 状态 |
| POST | `/admin/users/{id}/reset-password` | 重置密码 |
| GET | `/admin/marks` | 标记分页列表 |
| DELETE | `/admin/marks/{id}` | 删除标记（复用普通删除接口亦可） |
| POST | `/admin/keypoints/import` | 关键点台账导入（Excel/CSV），返回逐行错误报告 |
| POST | `/admin/pipelines/import` | 管道几何导入 |

---

## 6. 技术方案

| 层 | 选型 | 关键约束 |
| --- | --- | --- |
| 前端 | React 19 + Vite + TypeScript（仓库已有骨架），**静态托管于 Vercel** | 移动端优先，单页应用；需配置 SPA 回退 |
| 后端 | **FastAPI on Vercel Functions（Python 运行时）** | 入口 `api/index.py`；请求体 ≤4.5MB；函数默认超时约 10 秒（可延长）；解压后包体积 ≤250MB |
| 数据库 | **Neon PostgreSQL + PostGIS（保持原方案）** | 免费额度 1GB；必须使用 Neon **pooler** 连接串；⚠️ 位于境外，见 §9.2 |
| 对象存储 | 腾讯云 COS | 新用户 50GB × 6 个月免费；默认域名可直接外链、无需备案 |
| 地图 | 高德地图 JS API | 需 Web 端 Key + jscode |

### 6.1 视觉风格：苹果风 + Liquid Glass

- 系统字体：`-apple-system, "PingFang SC", "Helvetica Neue"`
- 玻璃面板：`background: rgba(255,255,255,.55)` + `backdrop-filter: blur(20px) saturate(180%)` + `1px` 内描边高光 + 大圆角（20–28px）
- 层级：地图全屏 → 悬浮玻璃卡片（底部信息面板、顶部搜索）→ 弹层
- 动效：`cubic-bezier(.32,.72,0,1)`，时长 240–320ms，只做位移/透明度，不做弹跳
- ⚠️ `backdrop-filter` 在中低端安卓机上有掉帧风险，需提供 `prefers-reduced-transparency` 降级为纯色半透明

### 6.2 部署拓扑（Vercel 单项目）

```
                    ┌─ 静态资源（React 构建产物，Vercel CDN）
浏览器 ──同一域名──┤─ /api/*  → Vercel Functions (Python + FastAPI)
                    │                    └─ Neon Postgres (pooler，境外)
                    ├─ 高德 JS API
                    └─ 腾讯云 COS（浏览器直传，不经过函数）
```

- **前后端放在同一个 Vercel 项目、同一个域名**，用 `vercel.json` rewrite 打通 `/api/*`，因此不存在 CORS 问题
- 静态资源走 Vercel CDN；函数为 serverless，冷启动明显（首请求可能 1–3 秒）
- 函数侧限制：body ≤4.5MB、默认超时约 10 秒、解压后包体积 ≤250MB
- ⚠️ 数据库在境外，函数在境外，用户在国内——**每一次地图数据请求都要跨境往返**，这是这套架构固有的延迟成本

### 6.3 项目结构与构建配置

```
<仓库根>
├── api/
│   └── index.py              # 唯一函数入口：sys.path 注入 backend/，导出 FastAPI app
├── backend/                  # 业务代码（不会被 Vercel 识别为函数路由）
│   ├── app/...               # 现有骨架，路由定义不带 /api 前缀
│   └── requirements.txt
├── frontend/                 # React + Vite
├── vercel.json               # rewrite: /api/* → /api/index；SPA 回退
└── docs/PRD.md
```

| 配置项 | 值 |
| --- | --- |
| 构建命令 | `cd frontend && npm ci && npm run build` |
| 输出目录 | `frontend/dist` |
| 函数目录 | `api/`（Vercel 自动识别为 Serverless Function） |
| 依赖文件 | `backend/requirements.txt`（需通过 `includeFiles` 或根目录 `requirements.txt` 让 Vercel 安装） |
| 本地开发 | `vercel dev`（一次启动静态与函数） |
| SPA 回退 | `vercel.json` rewrites：非 `/api/*` 的未匹配路径 → `/index.html` |

**实现要点**

- `api/index.py` 里 `sys.path.insert(0, <backend 绝对路径>)` 后 `from app.main import app`；FastAPI 路由前缀为 `/`（`/api` 已被 rewrite 剥离）
- ⚠️ **必须使用 Neon pooler 连接串**：serverless 每次调用可能新建进程，直连会耗尽 Neon 连接数
- 连接池不要开太大（pooler 侧建议 ≤5），否则并发一上来就报 `too many connections`
- 台账导入等耗时接口注意默认超时（约 10 秒），要么分批，要么在 `vercel.json` 为单个函数延长 `maxDuration`
- Excel 解析用 `openpyxl` 即可，不必引入 pandas（包体积和冷启动都更友好）

### 6.4 Vercel Hobby 配额与部署步骤

| 项 | Hobby（免费） | 是否够用 |
| --- | --- | --- |
| 带宽 | 100 GB/月 | 静态资源走 CDN、图片走 COS，够 |
| 函数调用 | 100 万次/月 | 按 50 人日常使用，够 |
| 函数执行时长 | 默认约 10 秒，可配置延长（Hobby 有上限，低于 Pro） | 导入接口需分批 |
| 函数请求体 | **4.5 MB** | 必须 COS 直传 |
| 函数包体积 | 解压后 ≤250 MB | 远够 |
| 自定义域名 + HTTPS | 支持 | 免费 |
| **商业使用** | ❌ Hobby 条款为**个人非商业用途** | ⚠️ 国企试点严格讲不符合条款，合规需 Pro（约 $20/人/月） |

> 配额数值以 Vercel 官方 Limits / Pricing 页为准（2026-11 核对），该平台免费档政策变动较频繁，动手前复核一次。

**部署步骤（按顺序）**

1. 仓库根目录创建 `api/index.py`，导出 FastAPI 的 `app`；创建 `vercel.json` 配置 rewrite 与 SPA 回退
2. Vercel 控制台 → 导入 Git 仓库 → 框架选 Vite（或 Other）
3. 构建配置：命令 `cd frontend && npm ci && npm run build`，输出目录 `frontend/dist`
4. 在项目 Settings → Environment Variables 配置**服务端**变量：`DATABASE_URL`（Neon **pooler** 串）、`COS_SECRET_ID`、`COS_SECRET_KEY`、`COS_BUCKET`、`JWT_SECRET`
5. 前端构建期变量（会打进产物，仅公开信息）：`VITE_AMAP_KEY`、`VITE_AMAP_SECURITY_CODE`、`VITE_COS_BASE_URL`
6. 绑定自定义域名（可选）→ 把域名加入**高德 Key 白名单**和 **COS 跨域规则**
7. 部署后用 `/api/health` 验证函数与数据库连通

⚠️ 高德 Key 与安全密钥写在前端会被别人盗用配额，Hobby 没有服务端密钥代理能力，v1 接受该风险。

---

## 7. 非功能需求

| 项 | 要求 |
| --- | --- |
| 首屏 | 4G 网络下 ≤3 秒可交互（地图瓦片除外） |
| 单次标记提交 | 9 张照片 + 1 段录音，≤10 秒完成（4G） |
| 图片 | 单张 ≤200KB，长边 1280px，服务端不接收二进制 |
| 兼容性 | iOS Safari 16+、Android Chrome 110+、桌面 Chrome/Edge 最新版 |
| 权限 | 定位与麦克风均需用户显式授权，拒绝后功能降级但页面不崩 |
| 日志 | 所有写操作（含删除）必须落 `audit_logs` |
| 函数执行 | 单次请求 ≤10 秒（导入类接口单独延长 maxDuration），不得出现超时中断 |
| 函数体积 | 解压后 ≤250MB（Vercel 限制） |
| 跨境延迟 | 函数与数据库均在境外，接口 P95 响应目标 ≤800ms（含跨境往返），冷启动单独容忍到 3 秒 |

---

## 8. 验收标准

1. 管理员建号后，该用户可用手机号 + 初始密码登录，且界面无任何管理入口
2. 地图拖动/缩放后仅加载视野内标记；缩到省级时出现"请放大地图"提示
3. 提交一条含 9 张照片的警告，网络面板中图片请求直连 COS 域名，不经后端
4. 断网提交 → 提示"已存本地，待同步"；恢复网络后自动上传成功
5. 管道线与关键点在地图上的位置与台账坐标实际位置偏差 <20 米
6. 普通用户删除他人标记返回 403；管理员删除任意标记成功且 `audit_logs` 有记录
7. 管理员尝试停用自己时被拒绝并给出提示
8. 前后端部署在同一个 Vercel 项目，`/api/*` 由 `api/index.py` 处理，浏览器控制台无 CORS 报错

---

## 9. 风险与前置任务

### 9.1 实施前置任务

| # | 事项 | 阻塞什么 |
| --- | --- | --- |
| 1 | 申请高德开放平台账号，创建 **Web 端（JS API）Key** 与 **安全密钥 jscode**，把 Vercel 域名（`*.vercel.app` + 自定义域名）加入白名单 | 地图完全不可用（否则报 `INVALID_USER_SCODE`） |
| 2 | 开通腾讯云 COS，建桶，创建子账号 AK/SK，配置跨域规则（允许 Vercel 域名 PUT/GET） | 照片/录音无法上传 |
| 3 | 创建 Vercel 项目并接入 Git 仓库；准备 `api/index.py` 与 `vercel.json` | 无法部署 |
| 4 | 确认 Neon 项目已开启 PostGIS 扩展，并取到 **pooler** 连接串 | 管道线无法存储；直连串会打爆连接数 |
| 5 | 准备管道几何数据与关键点台账（Excel 或 GeoJSON） | 地图上无管线与关键点 |
| 6 | **确认台账坐标系是 WGS-84 还是 GCJ-02** | 错则全线偏移，返工极痛 |

### 9.2 风险

| 级别 | 风险 | 说明 |
| --- | --- | --- |
| **高（架构级）** | 全链路境外 | Vercel（计算与静态）+ Neon（数据库）均在境外。管道坐标、阀室位置、隐患照片全部流向境外，国内用户每次请求跨境往返。**正式上线几乎必然要求数据不出境或走内网，届时前后端与数据库都需替换为国内云，本方案仅适用于演示与试点，禁止承载真实生产数据** |
| 中 | Vercel 条款限制 | Hobby 计划为**个人非商业用途**，国企项目严格讲不符合；合规需升级 Pro（约 $20/人/月） |
| 中 | Vercel 域名国内访问不稳 | `*.vercel.app` 在国内可能被干扰，演示时建议绑自定义域名 |
| 中 | 请求体与超时 | 函数 body ≤4.5MB、默认超时约 10 秒。虽然媒体已走直传，但大文件与批量导入仍会撞限制 |
| 中 | 高德个人 Key 配额 | 个人开发者账号有日调用量上限，商用需企业认证 |
| 中 | COS 流量费 | 免费额度只抵存储，公网流出流量按量计费（约 0.5 元/GB）；需在控制台设日消费告警 |
| 中 | COS 免费期到期 | 6 个月后转按量，50GB 约 6 元/月 |
| 低 | Neon 免费额度 | 1GB 存储 + 100 CU-hours/月，文本数据够用；闲置 5 分钟自动挂起，首次请求有冷启动 |
| 低 | 信息堆积 | 警告无处置流程，仅靠人工删除清理，长期可能积累大量过时标记 |

---

## 10. 待定事项

| # | 事项 | 默认处理 |
| --- | --- | --- |
| 1 | 管道几何数据格式（Excel 顶点串 / GeoJSON / SHP） | 按 Excel 顶点串设计导入接口，支持 GeoJSON 视为增强 |
| 2 | 台账坐标系 | 按 WGS-84 入库，展示层转 GCJ-02 |
| 3 | 离线策略是否降级为"直接报错" | 默认实现本地草稿 + 自动补传；可省 2–3 天工期 |
| 4 | 关键点与管段的关联是否必填 | 默认 `pipeline_id` 可空 |
| 5 | 是否升级 Vercel Pro（解除非商用限制、放宽超时） | 默认 Hobby 做演示；对外交付前需决策 |

---

## 附录：决策记录（Decision Log）

| 编号 | 决策 | 结论 |
| --- | --- | --- |
| D1 | 警告与普通信息的关系 | 单表 + `kind` 字段区分，**无处置状态机**；警告靠人工删除清理 |
| D2 | 删除策略 | **硬删除**；创建者删自己的，管理员删全部；靠 `audit_logs` 追溯 |
| D3 | 附件规格 | 独立 `attachment` 表；最多 9 图 + 1 录音（≤60s）；两类标记同等支持 |
| D4 | 警告严重程度 | **不分级**，统一视觉，无筛选器 |
| D5 | 管理员在地图上的权限 | **无写入权限**，纯后台角色，不使用地图界面 |
| D6 | 登录方式 | 手机号 + 密码，管理员指定初始密码；不强制改密、无失败锁定 |
| D7 | 数据可见范围 | 所有普通用户一致；按地图视野 bbox 拉取，无片区隔离 |
| D8 | 关键点来源 | **系统预存资产台账**，非现场临时创建 |
| D9 | 关键点量级 | 500–5000 条，按缩放级别聚合分层展示 |
| D10 | 管道线 | 需要在地图上绘制，使用 PostGIS LineString，多管段 |
| D11 | 媒体存储 | 腾讯云 COS 直传，后端只发临时凭证；弱网走 IndexedDB 草稿补传 |
| D12 | ~~部署平台（EdgeOne）~~ **已作废** | ~~前后端部署在腾讯云 EdgeOne Pages 免费版~~。v1.1 方案，v1.2 回退为 Vercel，见 D13 |
| D13 | 部署平台（最终） | 前端静态 + 后端 Python Functions 均部署在 **Vercel 同一项目**，用 `vercel.json` rewrite 打通 `/api/*`；数据库**继续使用 Neon**（保留 PostGIS）。代价：全链路境外、Hobby 非商用、body ≤4.5MB、默认超时约 10 秒 |
