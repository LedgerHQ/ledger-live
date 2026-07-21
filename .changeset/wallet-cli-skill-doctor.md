---
"@ledgerhq/wallet-cli": minor
---

Add `wallet-cli skill doctor` to detect drift between installed agent skills and the skills shipped in the running binary (`up-to-date`, `outdated`, `modified-locally`, `missing`), with a conservative `--fix` self-heal that reinstalls outdated/missing skills and only overwrites locally modified ones under `--force`. Skills are now version-locked via a `.wallet-cli-skill.json` provenance sidecar written on install, and the `skill install` JSON envelope surfaces the wallet-cli version and per-skill content hashes.
