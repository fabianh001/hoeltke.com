#!/usr/bin/env bash
# Restore completed audio on retries, or persist the generated edition without retriggering sendout.
set -euo pipefail
mode="${1:?Expected restore, publish, or check}"
slug="${2:?Expected issue slug}"
if [[ ! "$slug" =~ ^[a-zA-Z0-9]+([-_][a-zA-Z0-9]+)*$ ]] || [[ "$slug" == preview ]]; then
  echo "Invalid newsletter slug" >&2; exit 1
fi
md="src/content/digest/$slug.md"
audio="public/audio/digest/$slug.mp3"
manifest="public/audio/digest/$slug.json"
source_blob="$(git hash-object "$md")"
git fetch origin main
if [[ "$(git rev-parse "origin/main:$md")" != "$source_blob" ]]; then
  echo "Reviewed copy changed on main; sendout held. Run Newsletter again for $slug." >&2
  exit 1
fi
if [[ "$mode" == check ]]; then exit 0; fi

if [[ "$mode" == restore ]]; then
  if git cat-file -e "origin/main:$audio" 2>/dev/null && git cat-file -e "origin/main:$manifest" 2>/dev/null; then
    git restore --source=origin/main --worktree -- "$audio" "$manifest"
  fi
  exit 0
fi
if [[ "$mode" != publish ]]; then echo "Expected restore, publish, or check" >&2; exit 1; fi

git config user.name "ai-weekly-bot"
git config user.email "actions@github.com"
git add -- "$audio" "$manifest"
if git diff --cached --quiet; then
  revision="$(git rev-parse origin/main)"
else
  git commit -m "digest: audio edition $slug"
  published=false
  for attempt in 1 2 3; do
    git fetch origin main
    if [[ "$(git rev-parse "origin/main:$md")" != "$source_blob" ]]; then
      echo "Reviewed copy changed on main; sendout held. Run Newsletter again for $slug." >&2
      exit 1
    fi
    if ! git rebase origin/main; then git rebase --abort; exit 1; fi
    if git push origin HEAD:main; then published=true; break; fi
  done
  if [[ "$published" != true ]]; then echo "Could not publish audio; sendout held." >&2; exit 1; fi
  revision="$(git rev-parse HEAD)"
fi
if [[ "$(git rev-parse "origin/main:$md")" != "$source_blob" ]]; then
  echo "Reviewed copy changed on main; sendout held." >&2; exit 1
fi
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then echo "revision=$revision" >> "$GITHUB_OUTPUT"; fi
echo "Published audio edition $slug at $revision"
