---
name: detox-next-gen-specs
description: Read when writing or changing a test spec (e2e/*.test.ts) in the detox-next-gen Detox suite.
---

# Writing specs (`e2e/`)

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

## Env gating

Speculos specs gate on `hasSpeculosEnv` and use `maybeDescribe` so they auto-skip without
`SEED` + (`COINAPPS` or `REMOTE_SPECULOS`).

## Add a spec

1. Pick userdata for the state you need: `skip-onboarding`, `skip-onboarding-w40`, or `device-ready`.
2. `beforeAll`: `launchApp()` → `loadConfig(<userdata>)` → `launchSpeculos(<app>)` (only if a device is needed).
3. Drive the flow via `app.*`; keep device / Speculos choreography inline.
