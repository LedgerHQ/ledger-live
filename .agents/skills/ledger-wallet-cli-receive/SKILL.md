---
name: ledger-wallet-cli-receive
description: Get and verify a Ledger receive/deposit address for a session account over USB. Use for "my address", "where do I deposit", with on-device verification.
---

# wallet-cli — receive

Get the receive/deposit address for a session account and verify it on the Ledger's trusted display, over USB. Networks: **bitcoin**, **ethereum**, **solana**.

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

> **Read first:** shared hardware-wallet safety rails in [`references/safety.md`](references/safety.md) (USB sandbox bypass, device contention, ambiguous-request handling, shared error table). For _why_ addresses are verified on the device, see the umbrella skill's `references/business-logic.md` (retrieve with `wallet-cli skill retrieve ledger-wallet-cli --file references/business-logic.md`) § Receive-address verification.

> **Sandbox:** `receive` is a device command — it **must** run with `dangerouslyDisableSandbox: true` (sandbox blocks USB). `--no-verify` still touches the device to derive the address.

> **Session first:** the `<account>` argument is a session label (e.g. `ethereum-1`). If the session is empty, run `account discover <network>` first (see the `ledger-wallet-cli-account-discover` skill).

---

## Intent map

| User says                                                     | Command              |
| ------------------------------------------------------------ | -------------------- |
| "where do I send funds to", "give me my address", "deposit address" | `receive <account>`  |

---

## receive

```bash
pnpm --silent wallet-cli start receive ethereum-1
pnpm --silent wallet-cli start receive ethereum-1 --no-verify  # skip on-device confirmation
```

`<account>` is a session label. By default the CLI asks the user to confirm the address on the device screen.

**If the on-screen address differs from the terminal address:** do not share or use the address. Have the user disconnect the device and run `genuine-check` (see the `ledger-wallet-cli-genuine-check` skill) before retrying. The device screen is the only trusted display — treat a mismatch as a possible compromise, not a glitch.

---

## Task errors

See [`references/safety.md`](references/safety.md) for the shared device/USB error table (USB timeout, device not detected, contention, rejected-on-device, locked device).
