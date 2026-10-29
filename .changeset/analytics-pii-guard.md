---
"@shared/analytics": minor
"live-mobile": minor
---

Scrub personal data from every analytics event before delivery: blockchain addresses, hashes, extended public keys, Ledger account ids, emails, explorer link ids and values under sensitive keys. In `development` and `test`, `track` rejects with `AnalyticsPiiError` and the event is not sent (`blocked_pii`). In other environments the values are replaced with `[REDACTED:<kind>]` and the published event carries `piiFindings`. The mobile analytics console shows the `blocked_pii` status.
