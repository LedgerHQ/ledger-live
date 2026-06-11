---
"@ledgerhq/wallet-cli": minor
---

Add device discovery and selection so the CLI no longer silently connects to whichever device was discovered first.

- A read-only `devices` command lists every reachable Ledger across transports (USB and BLE) — name, transport, id, model — without connecting or signing, and hints to unlock a device that is missing.
- `--device <name|id>` on every device command (account discover, genuine-check, receive, send, swap execute), or globally via `WALLET_CLI_DEVICE` (the flag takes precedence). It matches by a case-insensitive name substring (so `--device nano` works without quoting a multi-word name) or by a transport-id prefix.
- The transport is inferred from the chosen device, so `--device` works without setting `WALLET_CLI_TRANSPORT`: the CLI scans all transports, finds where the selector matches, and connects there. With no selector it uses the only reachable device, or — when several are reachable — refuses to guess and lists the candidates.
