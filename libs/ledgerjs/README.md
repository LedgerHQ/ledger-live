# libs/ledgerjs

> [!IMPORTANT]
> This folder is deprecated and in transition. Do not add packages here, and do not treat it as
> documentation for how to talk to a Ledger device.

## Use the DMK

The supported way to communicate with a Ledger device is the
[Ledger Device Management Kit (DMK)](https://developers.ledger.com/docs/device-interaction/integration/how_to/dmk),
maintained in [device-sdk-ts](https://github.com/LedgerHQ/device-sdk-ts). New integrations — inside
this repository or outside of it — must use the DMK.

## What is left here

The `hw-transport-*`, `hw-app-*` and remaining utility packages under `packages/` are kept only
until they move to [LedgerHQ/ts-libs](https://github.com/LedgerHQ/ts-libs). They stay where they are
so the extraction stays a plain folder move; treat them as frozen. Packages that graduate out of
this transition move up to `libs/*` instead (see [libs/README.md](../README.md)).
