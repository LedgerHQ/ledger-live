---
name: analytics
description: Read when adding or changing product analytics events. Import track from @shared/analytics and React adapters from @shared/analytics-react.
---

# Product analytics

The API is [`shared/analytics/README.md`](../../../shared/analytics/README.md). React adapters are [`shared/analytics-react/README.md`](../../../shared/analytics-react/README.md).

- Import `track` and `trackPage` from `@shared/analytics`. Import `Track`, `TrackPage`, and `TrackScreen` from `@shared/analytics-react`.
- Do not add imports through app barrels (`~/analytics`, `~/renderer/analytics/segment`, `Track.ts`, `TrackPage.ts`). Those shims remain until [LIVE-35992](https://ledgerhq.atlassian.net/browse/LIVE-35992).
- Register the Segment client, consent, `identify`, extra props, and props filter only in the app `segment.ts`.
- Flow packages may keep an injected `track` helper so tests can pass a fake. They must not import an app barrel.
- In tests, mock `@shared/analytics` (and `@shared/analytics-react` when the component is under test). Do not mock `~/analytics`.
- Do not put PII in event payloads. See [detect-data-leaks](../detect-data-leaks/SKILL.md) and [client-ids](../client-ids/SKILL.md).

Portfolio charts (`@ledgerhq/wallet-analytics`) are a different package. Consent models stay in their own READMEs; apps only wire them into `setEnabledFn` and `updateIdentify`.
