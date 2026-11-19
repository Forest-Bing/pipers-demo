# 前端部署到 Vercel

> 适用仓库：`Forest-Bing/pipers-demo`（monorepo：`frontend/` 是 React + Vite，`backend/` 是 FastAPI）
> 目标：把 `frontend/` 发布成公网可访问的站点。当前前端全部走本地 mock，不依赖后端，因此**只部署 frontend 即可**。

---

## 0. 前置检查

| 项 | 要求 | 现状 |
| --- | --- | --- |
| 代码已推到 GitHub | 有 `origin` 且分支是 `main` | ✅ `https://github.com/Forest-Bing/pipers-demo.git` |
| 工作区干净 | 没有未提交改动 | ✅ |
| 本地能构建 | `npm run build` 通过 | ✅ |
| `frontend/vercel.json` | 提供 SPA 重写，避免刷新子路由 404 | ✅ 已添加 |
| 高德 Key 白名单 | 加入 Vercel 域名，否则地图白屏 | ⚠️ 需手动加（见第 5 节） |

`frontend/vercel.json` 内容（已就位，不用改）：

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

`rewrites` 是给 `createBrowserRouter` 用的：直接访问 `/admin/users` 或刷新页面时，Vercel 上并不存在这个文件，必须回落到 `index.html` 再由前端路由接管。静态资源（`/assets/*.js`、`/shape_logo.svg`）优先命中真实文件，不受影响。

---

## 1. 方式 A：GitHub 导入（推荐）

优点：之后每次 `git push` 到 `main` 自动重新部署，不用本地装任何东西。

### 1.1 登录并导入

1. 打开 <https://vercel.com>，点 **Sign Up / Log in**，选择 **Continue with GitHub** 并授权。
2. 登录后点 **Add New… → Project**。
3. 在 **Import Git Repository** 列表里找到 `pipers-demo`，点 **Import**。
   - 如果列表里没有，点右侧 **Adjust GitHub App Permissions**，把该仓库授权给 Vercel。

### 1.2 配置项目（这一步最容易出错）

在 **Configure Project** 页面：

| 字段 | 填什么 | 说明 |
| --- | --- | --- |
| **Project Name** | `pipers-demo` 或任意 | 决定默认域名 `xxx.vercel.app` |
| **Framework Preset** | `Vite`（通常自动识别） | 识别到就无需手动改 |
| **Root Directory** | **`frontend`** ⚠️ | **必须改**。仓库根目录没有 `package.json`，不改会直接报 “No framework detected” / build 失败 |
| **Build Command** | `npm run build`（默认即可） | 内部为 `tsc --noEmit && vite build`，会顺带做类型检查 |
| **Output Directory** | `dist`（默认即可） | |
| **Install Command** | `npm install`（默认即可） | |

> 改了 **Root Directory** 之后，Vercel 会自动去 `frontend/vercel.json` 读配置，构建上下文也变成 `frontend/`，这正是我们要的。

**Node 版本**：`Vite 8` 要求 `^20.19.0 || >=22.12.0`。`frontend/package.json` 已声明 `"engines": { "node": "22.x" }`，Vercel 会据此选择 22.x 运行时。若构建日志里出现 Node 版本不符的报错，到 **Settings → General → Node.js Version** 手动选 `22.x` 即可。

**依赖安装**：仓库里有 `package-lock.json`，Vercel 会按锁文件安装，版本不会漂移。

### 1.3 填环境变量（关键）

展开 **Environment Variables**，逐条添加（对应 `frontend/.env.example`）：

| Name | Value | 环境 |
| --- | --- | --- |
| `VITE_AMAP_KEY` | 你的高德 Web端(JS API) Key | Production + Preview + Development 全勾 |
| `VITE_AMAP_SECURITY_CODE` | 高德安全密钥 securityJsCode | 同上 |
| `VITE_AMAP_STYLE_ID` | 如 `amap://styles/xxxx` 后面的那串；用默认样式可留空不填 | 同上 |

⚠️ **`.env.local` 不会被上传**：它写在 `.gitignore` 的 `*.local` 里，Vercel 拉不到。Vite 的环境变量是**构建时**注入的，所以只在 Vercel 后台填才生效。

⚠️ 变量名必须带 `VITE_` 前缀，且**不能**写成 `.env` 里那种带引号的形式，值直接粘原文。

### 1.4 部署

点 **Deploy**，等 1–2 分钟。成功后会给出：

- 生产域名：`https://<project-name>.vercel.app`
- 每次 push 的 Preview 域名：`https://<project-name>-<hash>-<scope>.vercel.app`

### 1.5 部署后立刻验证

| 检查 | 期望 |
| --- | --- |
| 打开根域名 | 停在 `/login` 登录页（未登录不会自动进地图） |
| 用巡线员账号登录 | 进地图，能看到底图瓦片和管道线 |
| 直接在地址栏输 `/admin/users` 并回车 | 若已用管理员登录 → 正常打开；未登录 → 跳 `/login`。**不应出现 404** |
| 手机端打开 | 布局正常（Vercel 自带 HTTPS，定位权限可用） |

---

## 2. 方式 B：Vercel CLI（不走 GitHub 自动部署）

适合想本地一条命令上线的场景。**注意：CLI 部署不会自动带上 `.env.local`。**

```bash
# 1) 安装
npm i -g vercel

# 2) 登录（浏览器里点一下授权）
vercel login

# 3) 进入前端目录 —— 必须在 frontend 里执行，不要用仓库根目录
cd D:/CODE/Pipe/FullStack/frontend

# 4) 首次部署（会连续问几个问题）
vercel
```

首次运行时的交互选择：

| 提问 | 回答 |
| --- | --- |
| Set up and deploy? | `Y` |
| Which scope? | 选自己的账号 |
| Link to existing project? | `N` |
| What's your project's name? | `pipers-demo` |
| In which directory is your code located? | `./` |
| Want to modify these settings? | `N`（会自动识别 Vite） |

接着补环境变量（每个变量一条命令，`production` 可换成 `preview`/`development`）：

```bash
vercel env add VITE_AMAP_KEY production
vercel env add VITE_AMAP_SECURITY_CODE production
# 可选
vercel env add VITE_AMAP_STYLE_ID production
```

最后发布生产：

```bash
vercel --prod
```

> 环境变量必须在**部署之前**加好；先部署后加变量，要重新 `vercel --prod` 才会打进构建产物。

---

## 3. 环境变量改了怎么办

Vercel 的 Vite 项目是**构建时**注入变量，所以：

- 在 **Settings → Environment Variables** 改了值 → 必须 **Deployments → 最新一条右侧 ⋯ → Redeploy**（勾选 *Use existing Build Cache* 可取消，避免吃到旧产物）。
- 只改 `VITE_AMAP_STYLE_ID` 这类，也需要重新构建，刷新页面无效。

---

## 4. SPA 路由与 `vercel.json`

- 已有 `frontend/vercel.json` 负责回落，**不需要**在 Dashboard 里手动配 rewrites。
- 如果以后把 `vercel.json` 删掉，Vercel 对 Vite 预设通常也能处理 SPA；但显式保留更稳，尤其是 `/admin/*` 这类深链接。
- 不要加 `"cleanUrls"`、`"trailingSlash"` 之类，会和前端路由的路径匹配打架。

---

## 5. 高德地图白名单（必做，否则地图白屏）

Vercel 域名对高德来说是陌生来源，不加白名单会报 `INVALID_USER_SCODE` 或直接空白。

1. 打开 <https://console.amap.com/dev/key/app>，找到你创建的那个 **Web端(JS API)** Key。
2. 点右侧 **设置** → **域名白名单**（有的版本叫「安全密钥 / 域名白名单」）。
3. 添加（不带 `https://`、不带路径、不带端口）：

   ```
   pipers-demo.vercel.app
   ```

4. 如果用了自定义域名，再加一条自定义域名。
5. 保存后**几分钟内生效**，刷新部署好的站点即可。

> ⚠️ 每次 push 生成的 **Preview 域名是随机 hash**，高德白名单不支持通配，所以：
> - 只在生产域名上验收；
> - 或者给项目绑定一个固定域名（见第 7 节），预览也走固定域名。

---

## 6. 常见报错对照

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `No framework detected` / build 找不到 `package.json` | Root Directory 没设成 `frontend` | Settings → General → Root Directory 改为 `frontend`，重新部署 |
| 构建成功但页面空白、控制台 `INVALID_USER_SCODE` | 缺 `VITE_AMAP_SECURITY_CODE`，或变量没在 Redeploy 前加 | 补变量后 Redeploy |
| 地图白屏 + 提示 KEY 校验失败 | 域名不在高德白名单 | 第 5 节 |
| 刷新 `/admin/users` 返回 404 | `vercel.json` 没被读到（Root Directory 指错） | 确认 `frontend/vercel.json` 存在且 Root Directory 正确 |
| 构建卡在 `tsc --noEmit` 报类型错 | 本地没跑 `npm run build` 就推了 | 本地先 `npm run build` 通过再推 |
| `Unsupported engine` / Vite 报 Node 版本过低 | Vercel 选了 20.x 而 Vite 8 要求 ≥22.12 | Settings → General → Node.js Version 选 `22.x` 后 Redeploy |
| 改了样式/文案但线上没变 | 命中了构建缓存 | Redeploy 时取消 *Use existing Build Cache* |

---

## 7. 绑定自定义域名（可选）

1. Project → **Settings → Domains** → **Add**，输入域名（如 `pipe-demo.example.com`）。
2. 按提示到 DNS 服务商加记录：
   - 子域名 → `CNAME` 指向 `cname.vercel-dns.com`
   - 根域名 → Vercel 会给 `A` 记录 IP，或用 `ALIAS/ANAME`
3. 等 Vercel 显示 **Valid Configuration**，证书自动签发。
4. **别忘了把这个域名加进高德白名单**。

---

## 8. 安全提醒

当前前端是演示形态：所有数据是 mock，存在浏览器 `localStorage`；`lib/mock/users.ts` 里有明文初始密码。部署到公网后**任何人拿到链接都能看到这些账号和密码**，仅适合内部演示。接真实后端前，不要把真实人员信息或真实管线坐标放进种子数据。
