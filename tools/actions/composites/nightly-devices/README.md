# Nightly E2E devices

Composite action giving the Speculos device each scheduled E2E run uses: desktop in
`test-ui-e2e-only-desktop.yml`, iOS and Android in `test-mobile-e2e-reusable.yml`. Its outputs are
`desktop_device`, `ios_device` and `android_device`. Manual dispatches don't call it and use
`speculos_device`.

`rotation.json` maps each weekday to a device per platform. An entry is either a device or
`{ "evenWeek": ..., "oddWeek": ... }`, picked by ISO week parity. A day without an entry fails the run.

`resolve.test.mjs` checks the rotation. It runs in the "Test CI Scripts" job of `test-additional.yml`:

- the three platforms use different devices each weekday
- all six devices run every week, in even and odd weeks
- iOS never gets `nanoS` or `nanoSP`: they have no Bluetooth, so they can't pair with an iPhone

Broadcast days are not configured here. They follow the cron schedules in the two workflows
(desktop Monday, iOS Wednesday, Android Friday), so the shared QAA accounts broadcast from one
platform at a time.

```bash
node tools/actions/composites/nightly-devices/resolve.mjs 2026-10-21
node --test tools/actions/composites/nightly-devices/resolve.test.mjs
```
