---
"@ledgerhq/wallet-cli": minor
---

Add a `skill` command group (`list`, `retrieve`, `install`) that ships the Ledger wallet-cli agent skill embedded inside the compiled binary, so `wallet-cli skill install` works with zero prior setup. Installs into the right location for most agents via `--agent` (`claude`, `cursor`, `codex`, or the generic `agents` → `.agents/skills`), with `--global` and `--dir` overrides.
