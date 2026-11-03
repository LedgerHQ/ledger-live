---
"@ledgerhq/wallet-cli": minor
---

`skill install` no longer needs `--force` to replace a skill that wallet-cli installed earlier; it still needs it for a skill edited since then. `skill install` and `skill doctor --fix` now delete the unedited files a newer skill dropped.
