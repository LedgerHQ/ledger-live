# @devtools/device-onboarding

> [!CAUTION]
> **Status: UNSTABLE** — Shipped ahead of its hosts; the props contract will move with them.

DevTool for the shared device onboarding flow of
[`@ledgerhq/device-onboarding`](../../libs/device-onboarding/README.md). It is how that flow is run
against a real device before any onboarding screen exists, and the only consumer of it until the
screens land.

Design and rationale live in the
[technical plan](https://ledgerhq.atlassian.net/wiki/spaces/Engagement/pages/7354843176/1+Device+onboarding+shared+logic).

## What it does

Renders the flow and nothing else: the connected device with its model, transport and session id,
the context with each nested field named, the log, and the exit reason.

The device name sits under the status. The log reads upward. The newest state is on top.
The event that led there sits under that state. The buttons sit above the newest state.
A faded box labeled Possible lists states this step can reach. Those lines are not the log.
`auto` means the machine may move there with no event.

**The tool runs no machine.** The host owns the session and drives `deviceOnboardingMachine`; this
package receives what the host observes through `DeviceOnboardingToolProps` and calls back with
`connect`, `send` and `reset`. That is what keeps it identical on both apps, where only the session
port and the navigation differ.

The model and the transport appear in the device label because neither is cosmetic here: the flow
branches on touchscreen versus nano, and it behaves differently over BLE and USB.

## Props

`DeviceOnboardingToolProps`, built by each host:

- `status`, `device`, `state`, `context`, `events`, `exit`, `error` — what the host observes
- `sendableEvents` — what the host offers to send, as whole `OnboardingEvent` values rather than
  types: `snapshot.can` needs the payload to answer, and the machine dereferences it. Each entry
  carries an optional `label`, which a host needs when it offers one type several ways
- `connect`, `send`, `reset` — the host's own callbacks

A host offers only events it owns and has already made valid. `SESSION_READY` in particular means
"the session I re-opened is ready": offering it before calling `openSession` again lets the machine
re-read a device that is no longer there. When the transport goes away mid-run the host sets
`device` to null, which re-enables Connect — that is where the session gets re-opened, and only
then does `SESSION_READY` belong in `sendableEvents`.

`context` takes simple values under the closed list `watchedContextFields`. The screen prints
nothing outside that list. `verdictMatchesSession` is the row to watch: the machine drops the
genuine check when the session id moved. The host builds that row from the raw `genuineVerdict`.

This panel runs while a recovery phrase is being entered. It is read over shoulders and pasted into
bug reports, so the context list must not print seed progress, a device id, or `failure`. `failure`
is untyped and, for a fetch error, holds the backend URL and the response body.

Tap an event to open its payload as a list. That list can show `seedWordIndex` and
`seedPhraseWordCount`. It still skips `failure`, a device id, and any value that is a URL. The
short `detail` on the closed line stays a closed set of three shapes. The exit contract drops the
machine's `device.id` and keeps `sessionId`.

## Allowed imports

A tool package may import **no** `@devtools/*` package — not the shell, not the registry, not
another tool. See [Tool boundaries](../README.md#tool-boundaries) for the full rules and why.

What this package does import:

- `@ledgerhq/device-onboarding`, type-only — the library the tool exercises, app-agnostic and
  carrying the event and exit reason types that make the props contract exact
- `@ledgerhq/lumen-ui-react` and `@ledgerhq/lumen-ui-rnative` — the views

Everything from the app arrives as props, built in `@devtools/bindings`. A need for more data is a
new prop, never a new import.

## Validation

```sh
pnpm nx run @devtools/device-onboarding:typecheck
pnpm nx run @devtools/device-onboarding:test
pnpm nx run @devtools/device-onboarding:lint
```
