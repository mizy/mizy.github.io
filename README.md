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
