---
"@ledgerhq/wallet-cli": minor
---

Make every wallet-cli failure machine-actionable through one universal error contract.

- Every JSON-mode error envelope now carries a machine-readable `error.code` (`unknown` is the fallback) plus a `retryable` flag, an optional `hint`, and optional structured `details`. Device errors keep their DeviceState code and gain the structured payload previously dropped from final envelopes (`wrong_app`: `{expected, found}`; `app_not_installed`: `{appName}`; `device_ambiguous`: `{candidates: [{id, name, model, transport}]}`).
- Unknown flags are now rejected strictly with exit 64 (code `unknown_flag`) before any device or network work, instead of being silently dropped — a typo'd `--dry-run` can no longer escalate into a live signing flow. The other usage failures (`invalid_flag_value`, `missing_required_flag`, `unknown_command`, `invalid_transport`, `device_ambiguous`) also exit 64.
- Three intentional exit-code changes: an invalid `WALLET_CLI_TRANSPORT` value now exits 64 instead of 2, so exit 2 is reserved for a human rejecting on the device; `locked` gets its own exit code 7 instead of sharing 6 with `timeout`; and "no Ledger device found" is now a structured `device_not_found` error exiting 3 instead of generic prose exiting 1.
