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
