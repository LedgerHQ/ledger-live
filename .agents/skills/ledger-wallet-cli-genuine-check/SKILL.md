---
name: ledger-wallet-cli-genuine-check
description: Verify a connected Ledger is genuine over USB. Use for "is this real", "verify authenticity", "bought off eBay".
---

# wallet-cli — genuine-check

Cryptographically verify that the connected Ledger is genuine, over USB. The device signs a challenge that Ledger's backend verifies.

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Read first:** shared hardware-wallet safety rails in [`references/safety.md`](references/safety.md) (USB sandbox bypass, device contention, shared error table). For _what the check does and does not prove_, see the umbrella skill's `references/business-logic.md` (retrieve with `wallet-cli skill retrieve ledger-wallet-cli --file references/business-logic.md`) § Genuine check.

> **Sandbox:** `genuine-check` is a device command — it **must** run with `dangerouslyDisableSandbox: true` (sandbox blocks USB).

> **Dashboard only:** unlike other device commands, `genuine-check` targets the **dashboard** and has no auto-launch path. If any currency app is open it exits immediately with `[✖] Wrong app. Open Ledger dashboard.` (exit code 4). Ensure the device is unlocked and on the dashboard before running.

---

## Intent map

| User says                                                | Command         |
| -------------------------------------------------------- | --------------- |
| "is this Ledger real", "verify authenticity", "I bought this off eBay" | `genuine-check` |

---

## genuine-check

```bash
pnpm --silent wallet-cli start genuine-check
pnpm --silent wallet-cli start genuine-check --output json  # only if a downstream caller needs to parse the result
```

**Preconditions:** device unlocked and on the dashboard (exit any open app); host has internet access (the secure channel reaches Ledger's backend — offline runs fail).

---

## Task errors

| Error                                                | Cause                                                                                                      | Fix                                                                                                                                                                                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[✖] Wrong app. Open Ledger dashboard.` (exit code 4) | `genuine-check` invoked while a currency app is open. It targets the dashboard and has no auto-launch path. | Ask the user to exit the foreground app on the device (short-press both buttons on the app's main screen until `Quit` shows, then confirm), then re-run `genuine-check`. Other device commands auto-prompt the correct app launch. |

See [`references/safety.md`](references/safety.md) for the shared device/USB error table (USB timeout, device not detected, contention, locked device).
