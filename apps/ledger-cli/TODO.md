# ledger-cli — Known Issues & TODOs

## Critical: DMK macOS SIGKILL (IOUSBHost)

**Status**: Blocked on upstream fix in `@ledgerhq/device-transport-kit-node-hid`

**Symptom**: `zsh: killed` — process killed by the OS with no error message when trying to use the
Device Management Kit (DMK) transport on macOS.

**Root cause**: `@ledgerhq/device-transport-kit-node-hid` uses the `usb` npm package to claim USB
interfaces via `IOUSBHost`. macOS terminates the process with `EXC_BREAKPOINT + SIGKILL` when a
non-privileged process tries to exclusively claim a USB interface that the OS already owns (the
Ledger HID device).

**Current workaround**: The default code path uses `@ledgerhq/hw-transport-node-hid` (node-hid
based, no IOUSBHost claiming) which is safe on macOS. This means device detection works, but we
lose the DMK's ability to automatically prompt for unlock / open-app on the device.

**DMK mode**: Set `DMK=true` to opt into the full DMK path (works on Linux):
```bash
DMK=true pnpm ledger-cli discover-accounts --currency ethereum
```

**What needs fixing**: The `@ledgerhq/device-transport-kit-node-hid` package should use node-hid
(like `hw-transport-node-hid` does) instead of the `usb` package for macOS compatibility. The
`usb` package's IOUSBHost USB interface claiming is what triggers the SIGKILL.

**Code references**:
- `src/dmk.ts` — `withDeviceAppDMK()` is the full DMK implementation (behind `DMK=true`)
- `rslib.config.ts` — FIXME comment about re-adding DMK to externals when fixed

---

## Minor: Device app not verified

In the default (non-DMK) mode, `withDeviceApp()` detects device connection via
`TransportNodeHid.listen` but cannot verify that the correct app is open. The user must manually
open the right app before running commands. A better UX would check the current app name and
prompt if needed.

---

## Future: Fast account discovery (no sync)

`discover-accounts` currently runs a full bridge `scanAccounts()` which syncs each account against
the blockchain. A faster mode could derive addresses directly from the device without syncing:
- Use `getDerivationModesForCurrency()` + `runDerivationScheme()` from `@ledgerhq/coin-framework`
- Call `getAddress()` per path + index
- Return descriptors immediately (no balance data)
- Implement as `--fast` flag on `discover-accounts`
