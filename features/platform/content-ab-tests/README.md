# `@features/platform-content-ab-tests`

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change as Desktop and Mobile copy A/B tests land.

Parses Engagement copy-experiment payloads from the dedicated Firebase project
`content-ab-tests-lw` and holds the last valid map in memory.

This is **not** `@features/platform-feature-flags`. That package resolves known
`FeatureId`s from the `ledger-live-*` Remote Config projects. Copy A/B tests use
a second Firebase project, dynamic `feature_*` keys, and a different payload
(`enabled`, i18n copy keys, optional `trackingConfiguration`).

Shared helpers that Desktop and Mobile both need (validity rules, copy-key maps,
analytics `ab_tests` shaping) belong here. Each app only owns Firebase SDK init
and calls `setContentAbTests(parseContentAbTests(getAll(rc)))`. Missing or invalid
payloads leave an empty map so `app.json` stays the runtime default.

Firebase keys follow `feature_<snake_case>`. In-app ids are the camelCased suffix
(`feature_upgrade_banner` → `upgradeBanner`). There is no closed FeatureId catalog to
invert, so names with internal digits (`web3hub`) will not round-trip; prefer camelCase
ids without digits when creating experiments.

## Exports

| Symbol | Behaviour |
| --- | --- |
| `parseContentAbTests` | Maps a Remote Config `getAll()` payload to valid experiment entries. |
| `parseContentAbTestPayload` | Validates one JSON value. |
| `getContentAbTests` / `setContentAbTests` / `subscribeToContentAbTests` | In-memory store shared by analytics and copy override. |
| `setContentAbTestOverride` | Debug/local mock; wins over the last remote payload. |
