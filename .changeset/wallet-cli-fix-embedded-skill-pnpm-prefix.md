---
"@ledgerhq/wallet-cli": minor
---

Fix the embedded agent skill diverging from the copy published to `agent-skills`, and make the two artifacts share one transform.

- `wallet-cli skill retrieve` no longer returns stale examples prefixed with `pnpm --silent wallet-cli start`. The canonical `SKILL.md` is authored for monorepo contributors; the standalone rewrite to plain `wallet-cli <command>` (already applied when syncing to `agent-skills`) was missing from the codegen that inlines the skill into the binary.
- The embedded skill is now consistently named `wallet-cli-usage` — the name the published copy already used — across `skill list`, the manifest, `skill retrieve`, install directories and the `.wallet-cli-skill.json` sidecar, instead of the monorepo source's directory name.
- `ledger-wallet-cli` keeps working as a lookup alias in `skill retrieve` and `skill install`, so previously documented commands don't break. It resolves to the canonical skill and never installs a second copy under the old name; `skill list` shows only `wallet-cli-usage`. `skill doctor` now reports a pre-rename install directory as superseded rather than ignoring it (it never deletes it).
- The transform is implemented once in `scripts/standalone-skill-transform.mjs` and used by both the binary codegen and the `agent-skills` sync workflow, which previously duplicated it as a `sed` pipeline. It now asserts its own output — expected input markers present, nothing monorepo-only surviving — so a reworded source fails the build instead of silently shipping instructions a standalone user cannot follow.
- Skill collection now refuses any symlink resolving outside the skills tree, in both the binary codegen and the `agent-skills` export, so a symlink committed inside a skill directory cannot pull unrelated repo content into a published artifact.
