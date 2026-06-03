---
"@ledgerhq/live-cli": patch
---

Detect missing native USB/HID bindings in the CLI and hint to run `pnpm build:device-deps`. The hint is printed at startup when the `node-hid` native module is not compiled, and again from the HID transport `open` hook when a binding-related error is thrown at runtime (e.g. proxy lazily opens the device).
