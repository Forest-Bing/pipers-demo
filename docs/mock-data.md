# Mock 数据与 Mock API

> 前端演示层说明。真实后端见 `docs/PRD.md` §4（数据模型）与 §5（接口清单）。
> 目的：不连数据库也能完整走通「登录 → 看地图 → 加标记 → 后台管理 → 重置」全链路。

---

## 1. 目录

```
src/lib/
├── api/
│   ├── db.ts          # 演示库：localStorage 读写、种子灌入、版本迁移、审计日志写入
│   └── index.ts       # mock API：按 PRD §5 的路径组织，带 120–320ms 模拟延迟
├── mock/
│   ├── types.ts       # 前端模型（users / keypoints / marks / pipelines / audit）
│   ├── users.ts       # 28 个账号（2 管理员 / 26 用户，3 停用，6 本月新增）
│   ├── keypoints.ts   # 60 个关键点（沿管线弧长生成，加密桩 42 / 智能测试桩 12 / 阀室 6）
│   ├── marks.ts       # 15 条标记（警告 6 / 信息 9，其中 2 条待同步）
│   ├── pipelines.ts   # 中俄东线 · 济南—泰安段，带 GCJ-02 顶点串
│   └── rng.ts         # 确定性伪随机，保证每次刷新数据一致
├── geo.ts             # 距离与「沿折线取点」工具
├── store.tsx          # 页面用的数据仓库：首帧读缓存 + 调 API 对齐 + 写操作走 API
└── auth.tsx           # 登录态：校验密码、会话落 localStorage
```

## 2. 数据规模与地理基准

| 项 | 值 |
| --- | --- |
| 地图中心 | `117.0555, 36.6545`（济南市历下区 / 市中区交界），缩放 15 |
| 管段 | 中俄东线 · 济南—泰安段（国家管网山东公司），10 个顶点的 LineString |
| 关键点 | 60 个，铺在管线 t=0.42–0.57（约 5.1km）区间，含 ±28m 横向抖动 |
| 标记 | 15 条，13 条挂关键点、2 条自由落点；2 条 `pending`（待同步） |
| 用户 | 28 个，手机号唯一，职位覆盖 PRD 的 6 种枚举 |
| 审计日志 | 预置 8 条，之后每次写操作自动追加 |

关键点编号规则 `SD-ZED-1101…1160`（SD 山东 / ZED 中俄东线），阀室命名 `6#…11# 阀室`。

## 3. 测试账号

| 角色 | 手机号 | 密码 | 说明 |
| --- | --- | --- | --- |
| 巡线员 | `13800006027` | `123456` | 张建国，可建/改/删自己的标记 |
| 管理员 | `13900001001` | `admin123` | 李国强，进后台，无地图权限（D5） |
| 其余 26 个 | 见用户管理列表 | `123456` | 每个手机号都能登录，含 3 个停用账号 |

登录页底部「测试版说明」直接列出前两个账号，**点击即自动填入**；管理员页签用普通账号登录会提示切换。

未登录状态访问任何页面（`/`、`/me`、`/admin/*`）都会被路由守卫重定向到 `/login`，并把原地址记在 `location.state.from`，登录成功后回到该页；角色不匹配时回各自首页（用户 → 地图，管理员 → `/admin/users`）。会话保存在 `localStorage` 的 `pipe.session`，刷新不掉登录；点「退出登录」写入 `userId: null` 后回到登录页。

## 4. API 映射

| 前端方法 | 对应 PRD 接口 | 说明 |
| --- | --- | --- |
| `authApi.login` | `POST /auth/login` | 校验密码 / 停用 / 角色页签；写登录审计 |
| `authApi.me` | `GET /auth/me` | 按 userId 取用户 |
| `marksApi.list` | `GET /marks?bbox=&zoom=&kind=` | `zoom<11` 抛 413「请放大地图查看」 |
| `marksApi.get` | `GET /marks/{id}` | 404 兜底 |
| `marksApi.create` | `POST /marks` | 标题、创建人、时间由「服务端」派生 |
| `marksApi.update` | `PATCH /marks/{id}` | 仅创建者或管理员 |
| `marksApi.remove` | `DELETE /marks/{id}` | 硬删除 + 审计（D2） |
| `marksApi.listAdmin` | `GET /admin/marks` | 分页 + 类型 + 关键词 |
| `marksApi.saveDraft` / `syncDrafts` | `POST /marks/drafts`、`POST /marks/sync` | 弱网队列 |
| `usersApi.list/create/update` | `/admin/users` | 手机号唯一、不能停用/降级自己 |
| `usersApi.resetPassword` | `POST /admin/users/{id}/reset-password` | 返回一次性新密码 |
| `keypointsApi.list` | `GET /keypoints` | 可按类型筛 |
| `pipelinesApi.list` | `GET /pipelines` | 客户端目前直接读种子 |
| `auditApi.list` | `GET /admin/audit-logs` | 数据已备好，页面仍占位 |
| `demoApi.reset` | —（演示专用） | 恢复种子数据 |

接后端：把 `src/lib/api/index.ts` 里每个函数体换成 `fetch`，签名不变，页面零改动。

## 5. 持久化

| key | 内容 |
| --- | --- |
| `pipe.demo.db` | 整个演示库（marks / users / keypoints / pipelines / auditLogs / drafts），带 `version` |
| `pipe.session` | `{ userId, token }`；`userId: null` 表示已显式退出 |

- 改动种子数据后把 `db.ts` 的 `DB_VERSION` +1，旧缓存会自动丢弃重建；
- 「我的 → 演示数据 → 重置演示数据」等价于清空 `pipe.demo.db` 并回种子；
- 私有模式 / 配额满时写入失败只打 `console.warn`，不阻断演示。

## 6. 与设计稿的差异

- 照片仍是 Tailwind 渐变色块占位（不引入真人现场照片），字段已按 `photos: string[]` 预留；
- 管道线由 `components/map/PipelineLayer.tsx` 用 `AMap.Polyline` 绘制（PRD D10），标记/关键点仍是 React 叠加层；
- 类型筛选条现在是真的可切换（`map-runtime` 的 `kindFilter`），不再是静态选中态。
