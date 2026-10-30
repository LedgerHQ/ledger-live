# @features/platform-device-onboarding

> [!CAUTION]
> **Status: UNSTABLE** — The shared onboarding API is under active development.

Headless device onboarding shared by Ledger Wallet Desktop and Ledger Wallet Mobile. It drives a
device from the moment the app has a DMK session on it to the moment the app knows what to open
next, and contains no React, screens, navigation or transport of its own.

Design and rationale live in the [technical plan](https://ledgerhq.atlassian.net/wiki/spaces/Engagement/pages/7354843176/1+Device+onboarding+shared+logic).

## What it does

- Reads the device and routes it: the legacy flow, the pre-seed checks, or an interrupted update
- Waits for the user once, on entry, before it touches a device it can drive
- Runs the mandatory genuine check and the firmware check, and offers an available update
- Shows the on-device waiting screen to an unseeded touchscreen while the checks run
- Hands the OS update over to the app's own update flow, then re-reads the device
- Follows naming, PIN, seed creation and restore by reading the onboarding step — it never sets them
- Handles a lock, a transport loss and a quit from any state
- Reports where it got to, and leaves the session open for the app

## Mental model

The machine **decides**. The host (the app) **acts**. Only the host touches the world.

```
          world (device, live session, navigation, Redux)
                 ▲                                   ▲
                 │ reads the live session            │ runs the effects
          ┌──────┴──────────┐                 ┌──────┴────────────┐
          │      HOST       │                 │  provided action   │
          │  stampSession   │                 │  leaveOnboarding   │
          └──────┬──────────┘                 └──────▲────────────┘
                 │ { type, sessionId }               │ entry of a final state
                 ▼                                   │
 event ──► [ machine: next = f(context, event) ] ────┘
```

The machine is **pure**: the next state comes only from the current state and the event. It never
reads the live session, the store or the navigation.

Why: when the machine read the live session itself, the session could change with no event. The
same event could then give a different result, and the log could not show why.

## Driving the machine

The app opens a DMK session and starts the machine with the session id as data.

```ts
const actor = createActor(
  deviceOnboardingMachine.provide({
    actions: { leaveOnboarding: (_, { reason }) => leave(reason) },
  }),
  { input: { dmk, sessionId, deviceId, deviceModelId, offerSync } },
).start();
```

Screens show the current state and send the user's events: `CONTINUE`, `RETRY`, `SKIP`, `CLOSE`,
`QUIT`, `USER_ACCEPT`, `USER_DECLINE`. `CONTINUE` starts the flow after the first device read, and
leaves the success screen once both checks have passed. That screen stays up until the user
continues, so Ledger Sync is not opened before they can see it. A session change while it is up
runs the checks again. A firmware update shows the screen again, even when the device keeps the
same session id.

The app also sends what only it can see: `LOCKED`, `UNLOCKED` and `TRANSPORT_LOST` from
`sessionListener`, and `FIRMWARE_UPDATE_FLOW_CLOSED` when its firmware update flow returns on a
session that can still be read. `FIRMWARE_UPDATE_RECONNECT_REQUIRED` means that flow returned after
the device rebooted: the machine waits, and the host opens the next session.

### The session

`context.sessionId` is the session the machine talks to. Only 3 events change it:

| Event | When the app sends it |
|---|---|
| `SESSION_READY` | When the new session is open. It leaves `awaitingSession` and `awaitingSessionAfterFirmwareUpdate`. Watch the session after sending it on the post-update wait: a lock reported before the transition would be ignored. |
| `SESSION_CHANGED` | When the app moves to a new session in the middle of a run. |
| `FIRMWARE_UPDATE_FLOW_CLOSED` | When the firmware update returns on a session that can still be read. |

The app sends these events without the id. `stampSession(event, currentSessionId)` adds it,
because only the app knows the live session.

Why events: a session change is then in the log and in tests, like any other step.

Two rules for the app:

- Send `SESSION_CHANGED` **before** you watch the new session. Why: a locked device reports `LOCKED`
  as soon as it is watched, and unlock polling must start on the new session.
- After a `TRANSPORT_LOST`, open the new session, restart `sessionListener` on it, and only then send
  `SESSION_READY`. Why: a listener on the dead session cannot report the new one.

A new session starts the checks over (firmware answer, genuine failure, paused checks), because they
belong to the old session. A genuine result is kept only for the session it was made on. A firmware
update reboots onto a new session and drops that result, so the genuine check runs again.

### The exit

Every final state runs the `leaveOnboarding` action once, with one reason. The lib does nothing in
it: the app gives it with `provide`. Why: the lib does not know the app's store or navigation, and
an action on the final state runs exactly once, so the app needs no "did it run already?" check.

The machine output also carries the session id, the device and the reason.

| Reason | Meaning |
|---|---|
| `completed` | The setup is done, or the device was already set up, and the app did not pass `offerSync`. |
| `offerLedgerSync` | The device is set up (just now or before), and the app passed `offerSync`. |
| `legacyFallback` | The device needs the old onboarding flow. |
| `resumeFirmwareUpdate` | The device is in bootloader or OSU mode: a firmware update was interrupted. |
| `userQuit` | The user quit. |

The session stays open after the exit, so the app can keep using it.

## Key exports / concepts

- `deviceOnboardingMachine` — the flow. `machine.ts` is the graph, `context.ts` the bookkeeping
- `stampSession` — adds the live session id to the session events. The app calls it, not the machine
- `OnboardingEvent`, `DeviceOnboardingInput`, `DeviceOnboardingContext`, `DeviceOnboardingOutput` —
  the language the machine and the screens speak
- `rules.ts` — the pure decisions the transitions ask. Every model takes the flow on any firmware
  version that can be read
- `actors/` — the only code that talks to the device: `readDeviceState`, `genuineCheck`,
  `firmwareCheck`, `toggleEarlyCheck`, `seedPolling`, `unlockPolling`. Each gets the session id as
  input and reports through events only
- `withRetries`, `createRetryPolicy` — back the retries of the device checks, so a failure event
  means the retries are done
- `sessionListener` — maps DMK session status changes to onboarding events. The app owns the
  subscription, since it owns the session
- `ToggleEarlyCheckCommand` — the `e0 03` APDU, which DMK exposes no command for. Import DMK's own
  once it ships
- `device/` — what two actors each share, kept out of `actors/` so those read as onboarding policy
- `./testing` — a test kit (a kit with only the methods a test needs, and streams a test can push to)

## Usage context

Consumed by `apps/ledger-live-desktop`, `apps/ledger-live-mobile`, `@devtools/device-onboarding`, and `@devtools/bindings`.
The apps open the session, send its events, give `leaveOnboarding` and render the screens. The package
imports neither app, nor `live-dmk-desktop`, `live-dmk-mobile`, or
any legacy onboarding flow.

## Validation

```sh
pnpm nx run @features/platform-device-onboarding:build
pnpm nx run @features/platform-device-onboarding:typecheck
pnpm nx run @features/platform-device-onboarding:test
pnpm nx run @features/platform-device-onboarding:lint
```
