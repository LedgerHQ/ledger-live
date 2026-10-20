# Nightly E2E devices

The Speculos device each scheduled E2E run uses: desktop in `test-ui-e2e-only-desktop.yml`, iOS and
Android in `test-mobile-e2e-reusable.yml`. Manual dispatches ignore it and use `speculos_device`.

- `rotation.json` maps each weekday to a device per platform. An entry is either a device or
  `{ "evenWeek": ..., "oddWeek": ... }`, picked by ISO week parity. `fallback` covers any other day.
- `resolve.mjs` prints `desktop_device=`, `ios_device=` and `android_device=` lines for today (UTC),
  or for a `YYYY-MM-DD` argument. The workflows append them to `$GITHUB_OUTPUT`.

`resolve.test.mjs` checks the rotation:

- the three platforms use different devices each weekday
- all six devices run every week, in even and odd weeks
- iOS never gets `nanoS` or `nanoSP`: they have no Bluetooth, so they can't pair with an iPhone

Broadcast days are not configured here. They follow the cron schedules in the two workflows
(desktop Monday, iOS Wednesday, Android Friday), so the shared QAA accounts broadcast from one
platform at a time.

```bash
node e2e/tooling/nightly-devices/resolve.mjs 2026-10-21
node --test e2e/tooling/nightly-devices/resolve.test.mjs
```
