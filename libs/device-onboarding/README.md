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
- `readDeviceState`, `genuineCheck`, `firmwareCheck`, `toggleEarlyCheck`, and `seedPolling` are the
  actors the machine invokes to interrogate the device. Each reports through events only.
- `withRetries` and `createRetryPolicy` back the retries of the first three, so a failure event
  from them means the retries are exhausted. An actor accepts a `retryPolicy` to override them.
- `ToggleEarlyCheckCommand` carries the `e0 03` APDU. DMK exposes no such command and the ticket
  that was to add one was abandoned, so this is the one piece of device knowledge the package
  holds on its own. It is meant to be deleted, not built on: import DMK's command once it ships.

`readDeviceState` reports `DEVICE_STATE_UNREADABLE` rather than a failure when the onboarding step
is missing, since `isOnboarded` stays usable, and `seedPolling` stays quiet in that case. The
catalogue version of DMK decodes no step, so that is the answer for every device until it does.

The step names in `OnboardingStep` are DMK's own, so reading one is a membership check and this
package holds no copy of the decoding. The seed word count is validated the same way, against the
three lengths the product supports.

Every genuine check failure carries the raw failure DMK returned, as `FIRMWARE_UPDATE_AVAILABLE`
carries `update`. The machine never reads it: `genuineFailed` is one state but not one screen, and
an unreachable backend and a forced My Ledger provider both arrive as an `HttpFetchApiError`, so
only the app, which holds the provider setting, can resolve which drawer to open.

`toggleEarlyCheck` never fails: the on-device screen is a courtesy, so a device that left the
welcome step, a firmware that does not know the APDU and a transport error all report
`EARLY_CHECK_UNAVAILABLE` and leave the checks themselves still to run.

## What `src/device/` holds

Four files, none of them onboarding policy, each of them shared by two actors so that inlining one
would mean writing it twice. `onboardingState.ts` sends `GetOsVersion` and reads the answer as a
`DeviceOnboardingState`, answering `null` for as long as the onboarding step and the seed progress
are absent from DMK's response type, and compares two of them for the poller. `deviceAction.ts`
turns a device action, an observable of intermediate states, into the promise the retry helper can
wrap. `errors.ts` tells a refusal, a lost secure channel and an unreachable catalogue apart by tag,
since `HttpFetchApiError` and `WebSocketConnectionError` are not on DMK's barrel.
`toggleEarlyCheckCommand.ts` is the `e0 03` command itself. Keeping them here is what lets
`src/actors/` read as onboarding policy alone.

## Validation

```sh
pnpm nx run @ledgerhq/device-onboarding:build
pnpm nx run @ledgerhq/device-onboarding:typecheck
pnpm nx run @ledgerhq/device-onboarding:test
pnpm nx run @ledgerhq/device-onboarding:lint
```
