# wallet-cli — shared hardware-wallet safety rails

Cross-cutting rules for every device-touching wallet-cli flow (`account discover`, `receive`, `send`, `swap execute`, `genuine-check`). Read this alongside a task skill before running a device command. For _why_ these rules exist, see `references/business-logic.md`, which ships only with the `ledger-wallet-cli` umbrella skill — it is not co-located next to this file, so retrieve it rather than following a local link (`wallet-cli skill retrieve ledger-wallet-cli --file references/business-logic.md`).

Run from repo root: `pnpm --silent wallet-cli start <command> [flags]`

---

## USB sandbox bypass

`account discover`, `receive`, `send`, `genuine-check`, and `swap execute` **must** run with `dangerouslyDisableSandbox: true` — the sandbox blocks USB syscalls, which surfaces as a USB timeout error. The umbrella skill's `earn deposit`/`earn withdraw` (unless `--dry-run`) and every `ring` command need it too — `ring encrypt`/`decrypt`/`keys`/`destroy` require the bypass even though they never touch the device. Commands that only reach Ledger's backend (`session`, `balances`, `operations`, `swap quote`, `swap status`, `assets`, `earn yields`, `earn positions`) do **not** need the bypass.

If a device command fails with a USB timeout, surface that it needs `dangerouslyDisableSandbox: true` and **ask for confirmation before re-running with the bypass**. If the timeout fires on a command that should not need USB, investigate rather than disabling the sandbox by reflex.

## Device contention

Never run two device commands in parallel — the USB HID channel does not multiplex, so concurrent processes corrupt each other's APDU exchange (symptom: `[object Object]` or garbled APDU output). This applies even to read-only flows like `genuine-check`. Run device-touching commands **sequentially**.

## Device readiness

Before running a device command, briefly describe what you're about to do. The CLI prompts for device interaction itself — **don't time out or kill the command**. If the device is locked, keep the command running (it resumes once unlocked) and ask the user to enter their PIN.

## On-device confirmation is the source of truth

The host machine cannot be trusted: malware can swap a clipboard or render a different address/amount than the device actually derived or will sign. The Ledger screen is the only trusted display. Always have the user verify the address/amount/recipient/fees on the device, and treat any mismatch as a possible compromise — not a glitch.

## Ambiguous requests — ask, don't guess

If a required parameter is missing or unclear (no recipient for `send`, no network for `account discover`, an amount with no ticker), stop and ask. A wrong guess on a hardware-wallet flow can mean irreversible fund loss.

## Out of scope — say no, don't improvise

If the user asks for any of the following, surface that wallet-cli does not support it yet rather than constructing a command:

- NFTs (mint, transfer, view).
- OpenPGP-compatible output or key-share / multi-recipient encryption (the `ring` commands encrypt with a per-user Ledger Key Ring, not a shareable key).
- `send`, `receive`, `operations`, or `swap execute` on testnets and layer 2s (e.g. Base).
- Custom chains beyond **bitcoin**, **ethereum**, **solana** (mainnet + supported testnets).

---

## Shared errors

| Error                                                                                                 | Cause                                                | Fix                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[✖] Timed out talking to the Ledger over USB. The device may be busy or locked. Retry the command.` | sandbox blocking USB, or device busy/locked          | Surface that the command needs `dangerouslyDisableSandbox: true` and **ask for confirmation before re-running with the bypass**. The bypass is expected for device commands; if this fires on a non-device command, investigate before bypassing.                                                                              |
| `[object Object]` or garbled APDU output                                                              | two device commands running in parallel (contention) | Run device-touching commands sequentially — never in parallel tool calls.                                                                                                                                                                                                                                                   |
| `[✖] Ledger not detected. Plug in, unlock, retry.` (exit code 3)                                     | device powered off or unplugged                      | Ask the user to power on the device, unlock it, and connect via USB, then re-run the command.                                                                                                                                                                                                                                |
| `[✖] Rejected on device. No action taken.`                                                           | user rejected a sign request on device               | The rejection was deliberate. **Ask the user whether to retry or abort** — do not auto-retry. If they retry, have them review amount, recipient, and fees on the device before approving.                                                                                                                                     |
| `[✖] Rejected on device. App was not opened.`                                                        | user rejected the app-open prompt on device          | Ask the user to confirm the app-open prompt on the device and re-run the command.                                                                                                                                                                                                                                           |
| `device-state … awaiting_approval … reason: unlock` (JSON stream)                                     | device locked                                        | Keep the command running — the CLI resumes automatically once unlocked. Ask the user to unlock the device with their PIN.                                                                                                                                                                                                    |
