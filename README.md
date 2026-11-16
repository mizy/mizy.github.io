# mizy — projects & apps

Static GitHub Pages project directory. The homepage is a project launcher, not a résumé.

## Maintain the directory

- Add or update apps in `assets/projects.js`. Keep each destination verified and public.
- `PROJECTS` contains ready-to-open apps and creative collections. `ARCHIVE` contains earlier open-source experiments.
- Use a working Pages URL for an app. Link source-only projects to their actual repository, never an invented app route.
- Keep visible page copy free of personal identity information. Do not import private repository content or history into this public homepage.
- New apps can live at their own repository Pages URL. No homepage router or build step is needed.
- The independent `mz-3d-print/` collection is maintained separately; homepage changes must preserve it.

Preview with a static HTTP server. Test desktop and mobile, search, category filters, empty/reset states and destination links before publishing.

## Canvas homepage

The root page uses one visible canvas. `assets/space.js` renders real signed-distance 3D geometry using WebGPU and composites a Canvas 2D UI texture into the same output. Text, buttons, hit testing, selection and navigation are drawn/handled on the canvas. No visible HTML overlay is used.

Controls: arrow keys or mobile horizontal swipe switch projects; Enter opens the selected project; A opens the archive; Escape returns; P pauses animation; Tab cycles controls and leaves the canvas at the end. Click the archive button for older projects.

WebGPU requires a supported browser and secure context (HTTPS or localhost). A visibly labeled Canvas 2D compatibility renderer preserves all navigation if WebGPU is unavailable or the device is lost. `?compat` explicitly tests this path. The compatibility renderer is not represented as 3D/WebGPU.

Performance: max 30 render submissions per second, DPR capped at 1.5, no rendering in hidden tabs, and no repeated submissions when paused. Honors reduced motion. No analytics, external fonts, remote artwork or personal identity data are loaded by the homepage.
