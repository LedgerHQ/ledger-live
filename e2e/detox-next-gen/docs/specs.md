---
name: detox-next-gen-specs
description: Read when writing or changing a test spec (specs/<feature>/*.test.ts) in the detox-next-gen Detox suite.
---

# Writing specs (`specs/`)

Specs live in `specs/<feature>/` and are `*.test.ts` only. Reusable cross-page flows, setup,
and the parameterized test runners (`*.runner.ts`) live in `flows/<feature>/`.

A spec is orchestration. Drive the app **only through `app.*`** (page objects) — no raw
`element` / `by` / `web` matchers and no inline element helpers in a spec.

## What stays inline (it isn't UI)

- **Device**: `device.disableSynchronization()`, `device.takeScreenshot()`. (Opening a deeplink belongs on a page object, e.g. `openViaDeeplink()`.)
- **Speculos / device signing**: live-common helpers from `@ledgerhq/live-common/e2e/speculos` (`verifyAmountsAndAcceptSwap`, `expectValidAddressDevice`, …) and raw Speculos HTTP button presses.

## Detox-sync discipline

A tap that starts an APDU stream the device must confirm (account discovery, verify
address, signing) leaves the request pending, so Detox's wait-for-idle **deadlocks**.

- Call `device.disableSynchronization()` **immediately after** that tap.
- Native `waitFor` / handles still work with sync off (they poll the UI directly).
- Pattern (see the swap specs): the page waits for the next screen with sync **on** (clean transition), then the spec disables sync **before** the APDU-triggering tap.

## Lifecycle (`startSession` / `endSession`)

Boot and teardown live in `helpers/session.ts`, so specs don't repeat the
`launchApp` → `loadConfig` → `launchSpeculos` orchestration:

```ts
let handle: SpeculosHandle;
beforeAll(async () => {
  handle = await startSession({ userdata: "device-ready", speculosApp: "Ethereum" });
});
afterAll(() => endSession(handle));
```

- Omit `speculosApp` for UI-only specs — `startSession` returns nothing and `endSession()` just closes the app.
- A bespoke device dance (the swap blind-signing toggle, the CEX two-app boot) calls `launchSpeculos` / `shutdownSpeculos` directly on top of `startSession`.

Use a plain `describe` — there is **no auto-skip**. Speculos specs require `SEED` +
(`COINAPPS` or `REMOTE_SPECULOS`); without it the `beforeAll` Speculos boot fails (not skips).

## Add a spec

1. Pick userdata for the state you need: `skip-onboarding`, `skip-onboarding-w40`, or `device-ready`.
2. `beforeAll`: `startSession({ userdata, speculosApp? })`; `afterAll`: `endSession(handle)`.
3. Drive the flow via `app.*`; keep device / Speculos choreography inline.
