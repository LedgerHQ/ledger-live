---
"@ledgerhq/wallet-cli": patch
---

Fix `--no-verify` (and other `--no-<flag>` negations) being silently ignored. bunli's parser drops unknown flags, so `--no-verify` was a no-op and the device verification screen still appeared. argv is now pre-processed to rewrite `--no-<flag>` to `--<flag>=false`.
