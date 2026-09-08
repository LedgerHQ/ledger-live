# @ledgerhq/device-onboarding

> [!CAUTION]
> **Status: UNSTABLE** — The shared onboarding API is under active development.

Headless device-onboarding contracts and state-machine actors shared by Ledger Wallet Desktop
and Ledger Wallet Mobile.

## Boundaries

The package owns device interactions and routing decisions. It contains no React, screens,
navigation, analytics, or platform transport implementation. Each app supplies
`DeviceOnboardingPorts`; the package never imports `live-dmk-desktop`, `live-dmk-mobile`, or a
legacy onboarding flow.

The app owns the DMK session lifecycle. It opens the session before starting the machine,
passes the DMK instance into the machine, reconnects after a transport loss, and keeps the
session open when the machine exits.

## Public API

- `DeviceOnboardingPorts` defines session lifecycle and legacy firmware-update boundaries.
- `OnboardingEvent`, `DeviceOnboardingInput`, and `DeviceOnboardingContext` define the language
  used by the future state machine.
- `DeviceOnboardingOutput` identifies the connected device and the reason the machine exited.
- `sessionListener` maps DMK session status changes to onboarding events.

## Validation

```sh
pnpm nx run @ledgerhq/device-onboarding:build
pnpm nx run @ledgerhq/device-onboarding:typecheck
pnpm nx run @ledgerhq/device-onboarding:test
pnpm nx run @ledgerhq/device-onboarding:lint
```
