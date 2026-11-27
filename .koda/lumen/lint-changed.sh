#!/usr/bin/env bash
# Lints only the packages whose files differ from develop, lockfiles aside. Typecheck and
# dependents build most of the repo first (a full `nx affected` ran for 19+ hours), so they are
# left to the PR's CI. A catalog-only bump changes no package, so nothing is linted.
set -eo pipefail
not_code=(':!**/pnpm-lock.yaml' ':!pnpm-workspace.yaml' ':!**/Podfile.lock' ':!.changeset' ':!.koda')
# Untracked files count too: a migration can add one, and this runs before the commit.
packages=$({ git diff --name-only origin/develop -- . "${not_code[@]}"; git ls-files --others --exclude-standard -- . "${not_code[@]}"; } | while read -r file; do
  dir=$(dirname "$file")
  while [ "$dir" != . ] && [ ! -f "$dir/package.json" ]; do dir=$(dirname "$dir"); done
  if [ "$dir" != . ]; then node -p "require('./$dir/package.json').name"; fi
done | sort -u)
if [ -z "$packages" ]; then
  echo "No package changed besides the lockfiles."
  exit 0
fi
NX_DAEMON=false timeout 1200 pnpm nx run-many -t lint --projects="$(echo $packages | tr ' ' ,)" --skip-nx-cache
