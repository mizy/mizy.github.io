#!/bin/zsh
# 本机自动同步 3D 打印档案：拉上游 → 重新导出公开页 → 自检 → 有变化就提交并推送。
# 由 launchd 定时调用（com.mizy.print-sync，每天 09:10 / 21:10，唤醒后补跑）。
# 上游仓库是私有的，CI 拿不到，所以同步放在本机跑。

set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

SITE="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$HOME/projects/mz-3d-print"

echo "[$(date '+%F %T')] sync start"

if [ ! -d "$SOURCE/models" ]; then
  echo "source repository missing: $SOURCE"
  exit 0
fi

# 只拦已跟踪文件的改动；未跟踪的新文件允许出现（部分当前 3MF 还没提交）。
if [ -n "$(git -C "$SOURCE" status --porcelain --untracked-files=no)" ]; then
  echo "source repository has uncommitted tracked changes; skipping publish"
  exit 0
fi

git -C "$SOURCE" pull --ff-only --quiet || echo "source pull failed; exporting current checkout"
cd "$SITE"
git pull --ff-only --quiet

node tools/export-3d-print.mjs --source "$SOURCE"
node tools/check-site.mjs

git add mz-3d-print
if git diff --cached --quiet; then
  echo "no changes"
  exit 0
fi

git commit --quiet -m "chore: sync 3D print archive"
TOKEN="$(gh auth token)"
git -c credential.helper='!f() { echo username=x-access-token; echo "password=$TOKEN"; }; f' push --quiet origin HEAD
echo "pushed $(git rev-parse --short HEAD)"
