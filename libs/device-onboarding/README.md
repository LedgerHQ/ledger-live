# @ledgerhq/device-onboarding

> [!CAUTION]
> **Status: UNSTABLE** — The shared onboarding API is under active development.

Headless device onboarding shared by Ledger Wallet Desktop and Ledger Wallet Mobile. It drives a
device from the moment the app has a DMK session on it to the moment the app knows what to open
next, and contains no React, screens, navigation or transport of its own.

Design and rationale live in the [technical plan](https://ledgerhq.atlassian.net/wiki/spaces/Engagement/pages/7354843176/1+Device+onboarding+shared+logic).

## What it does

- Reads the device and routes it: the legacy flow, the pre-seed checks, or an interrupted update
- Runs the mandatory genuine check and the firmware check, and offers an available update
- Shows the on-device waiting screen to an unseeded touchscreen while the checks run
- Hands the OS update over to the app's own update flow, then re-reads the device
- Handles a lock, a transport loss and a quit from any state
- Reports where it got to, on a live session the app keeps using

## Driving the machine

The app opens a DMK session, starts the machine on that device, and subscribes to it.

```ts
const actor = createActor(deviceOnboardingMachine, {
  input: { dmk, ports, deviceId, deviceModelId, offerSync },
}).start();
```

Screens render the current state and send the user's events: `CONTINUE`, `RETRY`, `SKIP`, `CLOSE`,
`QUIT`, `USER_ACCEPT`, `USER_DECLINE`. The app pushes in what it alone observes: `LOCKED`,
`UNLOCKED`, `TRANSPORT_LOST` and `SESSION_READY` from `sessionListener`, and
`FIRMWARE_UPDATE_FLOW_CLOSED` when its OS update flow returns control.

The app owns the session for the whole run — it opens it, reconnects after a transport loss, and
keeps it open when the machine exits. The machine only reads `currentSessionId()`, and re-reads it
on every device call, so a reconnection needs no restart.

Every exit carries the session id, the device, and one reason. This phase reaches
`legacyFallback`, `resumeFirmwareUpdate` and `userQuit`; `offerLedgerSync` and `completed` land
with the setup phase.

## Key exports / concepts

- `deviceOnboardingMachine` — the flow. `machine.ts` is the graph, `context.ts` the bookkeeping
- `DeviceOnboardingPorts` — the session lifecycle each app implements, and nothing else
- `OnboardingEvent`, `DeviceOnboardingInput`, `DeviceOnboardingContext`, `DeviceOnboardingOutput` —
  the language the machine and the screens speak
- `rules.ts` — the pure decisions the transitions ask. Only the Nano SP and Nano X have a firmware
  floor; the Nano S always takes the legacy flow
- `actors/` — the only code that talks to the device: `readDeviceState`, `genuineCheck`,
  `firmwareCheck`, `toggleEarlyCheck`, `seedPolling`. Each reports through events only
- `withRetries`, `createRetryPolicy` — back the retries of the first three, so a failure event from
  them means the retries are exhausted
- `sessionListener` — maps DMK session status changes to onboarding events. The app owns the
  subscription, since it owns the session
- `ToggleEarlyCheckCommand` — the `e0 03` APDU, which DMK exposes no command for. Import DMK's own
  once it ships
- `device/` — what two actors each share, kept out of `actors/` so those read as onboarding policy

## Usage context

Consumed by `apps/ledger-live-desktop` and `apps/ledger-live-mobile`, which supply the port and
render the screens. The package imports neither app, nor `live-dmk-desktop`, `live-dmk-mobile`, or
any legacy onboarding flow.

## Validation

```sh
pnpm nx run @ledgerhq/device-onboarding:build
pnpm nx run @ledgerhq/device-onboarding:typecheck
pnpm nx run @ledgerhq/device-onboarding:test
pnpm nx run @ledgerhq/device-onboarding:lint
```
