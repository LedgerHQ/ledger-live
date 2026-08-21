---
"@ledgerhq/wallet-cli": patch
---

Fix `wallet-cli skill retrieve` returning stale command examples prefixed with `pnpm --silent wallet-cli start` instead of `wallet-cli`. The skills-embedding codegen (`scripts/generate-skills-manifest.mjs`) now rewrites the monorepo-only run instructions in `SKILL.md` — the same transform already applied when syncing the skill to `agent-skills` — before inlining it into the compiled binary, so the embedded skill matches how a globally-installed `wallet-cli` is actually invoked.
