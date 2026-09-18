# wallet-cli - business logic

Concepts and product rules behind the wallet-cli commands. Load when the user asks _why_ something works the way it does, or when surfacing context for a safety rule that the main skill states tersely.

For the command surface, errors, sandbox/device rules, and informal-request mapping, see the main `SKILL.md` in this skill folder.

---

## Genuine check

**What it is.** A cryptographic verification that the connected device is a genuine Ledger. Genuine Ledger devices hold a private key embedded during manufacturing - only a device with that key can produce the proof required by the check. The device signs a challenge; Ledger verifies the result.

**When to run it.**

- First time a user connects a device through wallet-cli.
- Before any high-value flow (large `send`, swap, key-share export).
- After a device has been out of the user's possession.

**What it does _not_ prove.**

- That the device has not been physically tampered with (anti-tamper is a separate concern).
- That the seed phrase backup is intact.
- That the firmware running on the device is the latest version.

---

## Receive-address verification on the trusted display

The host machine cannot be trusted: malware can swap a clipboard, intercept the CLI output, or render a different address than the one the device actually derived. The Ledger screen is the only display the user can trust - that's why the CLI always asks the user to compare, and why a mismatch must be treated as a possible compromise rather than a glitch.

---

## Sessions

**What a session is.** A persisted record of which accounts the CLI has discovered on the connected device. `account discover` populates the session; `session view` shows it; `session reset` clears it.

**What a session is _not_.** It is not authorization. It is not signing material. It is not synced across machines. Re-running `account discover` on a different machine produces the same accounts (deterministic from the seed), but the session itself is local.

**A passphrase changes the seed.** After a user adds a BIP-39 passphrase, the derived accounts change and the existing session is no longer valid. Reset and re-discover.

---

## Sandbox bypass

The Claude Code sandbox blocks USB syscalls by default, so any wallet-cli command that needs the device hardware can't reach it from inside the sandbox - that's why device-touching commands require `dangerouslyDisableSandbox: true`. Commands that only hit Ledger's backend don't need USB and don't need the bypass.

**How the CLI diagnoses it.** wallet-cli cannot detect "I am sandboxed" - there is no syscall for that. It infers it from one signal only: the OS refused access to a device it had already enumerated. On Linux, libusb enumerates by reading sysfs, which a sandbox permits, and only needs the `/dev/bus/usb` node to *open* the device - so "seen but not openable" means the host blocked us. That inference is reported as `likely_cause: "sandbox_blocking_usb"` - `likely`, not certain, because a missing udev rule on Linux produces the same refusal with no sandbox involved.

Consequences worth knowing:

- `agent_hint` is emitted whenever the cause is host-side. No environment sniffing is involved - there is no agent detection anywhere in the CLI. Its text is conditional ("If you are running this through Claude Code, Codex CLI, Cursor, or another sandboxed agent..."), so it reads correctly for a human as well - and an agent whose environment wallet-cli cannot recognise, which is the case that most needs the bypass instruction, still receives it. `user_hint` covers the terminal case alongside it.
- A **busy** device (`LIBUSB_ERROR_BUSY`, e.g. Ledger Live holding the interface) is never reported as `sandbox_blocking_usb`. It falls back to `unknown`, because "disable your sandbox" is bad advice when the fix is to quit Ledger Live.
- The discovery wait is 60 s and is **not** shortened by `--device-timeout`, which bounds the unlock/confirm wait only.
- An unplugged device is reported as `error.code: "disconnected"` (exit 3), not `USB_TIMEOUT`, but it still carries `likely_cause: "device_not_present"` and the `docs` link - so `likely_cause` is the field to read on any USB failure, whichever code came with it.

---

## Device contention

The USB HID channel to a Ledger device does not multiplex. Two concurrent wallet-cli processes will both try to drive the secure channel and corrupt each other's APDU exchange. This applies even to seemingly read-only flows like `genuine-check`, which opens the secure channel just like signing flows do.
