---
"@ledgerhq/wallet-cli": major
---

feat(wallet-cli): attribute USB failures with likely_cause and agent_hint

A device command that cannot reach the Ledger now reports why. JSON error envelopes carry
`likely_cause` (`sandbox_blocking_usb`, `device_not_present`, `app_not_open`, `unknown`), an
`agent_hint` spelling out the sandbox bypass when the cause is host-side, a `user_hint`, and a
`docs` link. Previously every connect failure — device absent, host blocking USB, device busy —
was flattened into `code: "unknown"` with a message naming only the device.

Breaking for consumers matching on the error code: a timeout is published as
`error.code: "USB_TIMEOUT"` instead of `"timeout"`. NDJSON `device-state` progress events keep the
internal `"timeout"`. A scan that completes without finding a Ledger is now `disconnected`
(exit 3) rather than `unknown` (exit 1), and carries `likely_cause: "device_not_present"`.
