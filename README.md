# mizy — projects & apps

Static GitHub Pages project directory. The homepage is a project launcher, not a résumé.

## Maintain the directory

- Add or update apps in `assets/projects.js`. Keep each destination verified and public.
- `PROJECTS` contains ready-to-open apps and creative collections. `SOURCE_PROJECTS` contains tools and earlier open-source projects, including source-only work.
- Use a working Pages URL for an app. Link source-only projects to their actual repository, never an invented app route.
- Keep visible page copy free of personal identity information. Do not import private repository content or history into this public homepage.
- New apps can live at their own repository Pages URL. No homepage router or build step is needed.
- The independent `mz-3d-print/` collection is maintained separately; homepage changes must preserve it.

Preview with a static HTTP server. Test desktop and mobile, search, category filters, empty/reset states and destination links before publishing.

## DOM-first homepage

The root page is semantic HTML: real headings, links, articles, search and filter controls. All content and navigation work without WebGPU. `assets/projects.js` contains verified public applications and source-only projects; do not invent a Pages route for a source project.

Application cards use verified screenshots captured from their public interfaces in clean browser contexts. The 3D printing card uses a privacy-safe model preview. All cards have equal layout prominence and standard HTML links. No decorative 3D or GPU effects are used where they do not help identify the project.

Historical descriptions were checked against the public mizy profile README history and project READMEs. The original MiniGL/DragonBones introduction is preserved in natural Chinese; no profile statistics, private project names or personal identity details are imported.

## PWA / 离线

站点可安装为 PWA，入口在根目录：

- `manifest.json`：应用名、图标（`assets/icons/`）、启动路径 `/`、`display: standalone`
- `sw.js`：Service Worker，作用域 `/`。预缓存项目目录页、3D 打印档案页、离线页和 12 张模型预览
- `offline.html`：没有网络且页面未缓存时的兜底页
- `assets/pwa.js`：在根页和 `mz-3d-print/` 下注册 Service Worker

缓存规则：

- 导航请求：先走网络，成功就写入缓存；断网时回落到缓存，再回落到 `offline.html`
- 模型预览图：缓存优先
- 页面 CSS / JS / manifest：先用缓存，同时后台更新
- `.3mf` / `.stl` / `.step` 下载文件与跨域请求不经过 Service Worker，始终走网络

改动上述预缓存列表或离线页后，必须把 `sw.js` 里的 `CACHE_VERSION` 加一，旧缓存会在下次激活时清掉。

## 自动上线

- **推送即发布**：Pages 走 `main` 分支根目录，push 上去构建完成后线上就更新，不需要额外动作。
- **每次推送先自检**：`.github/workflows/check-site.yml` 跑 `node tools/check-site.mjs`，校验和、下载链接、预览图、manifest 图标、Service Worker 预缓存清单任一项对不上就红叉。
- **3D 打印档案每天自动同步**：`.github/workflows/sync-3d-print.yml` 每天 02:17（北京时间）从 `mizy/mz-3d-print` 拉最新 `main`（含 Git LFS），重新生成公开页面；有变化就提交并触发 Pages 构建，没变化什么都不做。也可以在 Actions 里手动 `workflow_dispatch`。

### 3D 打印档案是生成物

`mz-3d-print/index.html`、`files/`、`checksums.json` 都由脚本生成，别手改：

- `tools/print-public.json`：公开哪些模型、公开叫什么名字、每个文件对应上游哪条路径 —— 这是唯一的人工决定点
- `tools/print-page.html`：页面骨架，`{{FILTERS}}` / `{{CARDS}}` / `{{COUNT}}` 三个占位符
- `tools/export-3d-print.mjs`：读清单 + 上游仓库，复制文件、转 webp 预览、重算校验和、写出页面

本地重生成：

```bash
git clone git@github.com:mizy/mz-3d-print.git ../mz-3d-print   # 上游模型库，需 git lfs pull
node tools/export-3d-print.mjs --source ../mz-3d-print
node tools/check-site.mjs
```

加一个新模型：在上游确认文件真实存在（不是 LFS 指针），在 `tools/print-public.json` 里加一条 `project`（自定义匿名名、标签、文件映射、预览图来源），跑一遍导出脚本即可。清单里没有的模型不会出现在公开页上 —— 含个人姓名、未验证或授权不清的模型留在上游，不往这里加。
