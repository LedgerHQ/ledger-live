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
the current state of the machine, the context fields worth watching, the event log, the exit
reason, and one button per event the machine accepts right now.

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

`context` takes primitives under the closed list of names exported as `watchedContextFields`, and
the view renders nothing outside that list. `verdictMatchesSession` is the row to watch: the
machine discards the genuine attestation when the session id moved under it, which is the failure
this tool exists to catch, and nothing else on screen shows it. Derive it from the raw
`genuineVerdict`, never from the machine's own accessor, or the row can only ever agree with
`isGenuine`.

The closed list is a privacy boundary, not a style choice. This panel runs while a recovery phrase
is being entered, and it is read over shoulders and pasted into bug reports, so it must not be able
to print `seedWordIndex`, `seedPhraseWordCount`, a device id, or `lastGenuineFailure.failure` —
which is untyped and, for a fetch error, holds the backend URL and the response body. Two other
fields answer to the same rule rather than to a host's discretion: an event `detail` is a closed
set of three shapes, not free text, and the exit contract drops the machine's `device.id` and keeps
`sessionId`, which tells two runs apart without naming the hardware.

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
