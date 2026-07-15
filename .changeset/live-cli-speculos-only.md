---
"@ledgerhq/live-cli": major
---

Trim the CLI to its internally-used, Speculos-only commands and drop all non-Speculos transports.

Kept commands: `getAddress`, `liveData`, `send`, `tokenAllowance`, `generateAddresses`, `generateAppJson`, `generateUtxoAddresses` (e2e), and `version`. All other commands — including `proxy` and `botTransfer` — are removed.

The CLI no longer ships USB/HID (`node-hid`, `usb`, `@ledgerhq/hw-transport-node-hid`) or HTTP-proxy (`@ledgerhq/hw-transport-http`) transports; only the Speculos transports remain. Passing a non-Speculos device id now fails with an explicit error pointing to the Ledger Live desktop/mobile app or `@ledgerhq/wallet-cli`. The `pnpm build:device-deps` helper is removed as there are no native device bindings left to build.
