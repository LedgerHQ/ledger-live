# @domain/entity-analytics-consent

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the analytics consent renewal feature.

Canonical data model for analytics consent: the privacy policy version value object and the
stored consent state (`consentDate` + `privacyPolicyVersion`).

Policy versions carry major/minor semantics — a major bump means analytics consent must be
renewed, a minor bump means the privacy policy only needs an acknowledgement. See
[ADR: Analytics Consent Renewal](https://ledgerhq.atlassian.net/wiki/spaces/Engagement/pages/7249592355).

## Exports

- `parsePolicyVersion` — `unknown` → `{ major, minor, normalized }` or `null` when invalid
- `policyVersionSchema` — accepts `1`, `"1"`, `"1.0"`, `"2.10"`; rejects `1.2`, `"01.2"`, `"1.2.3"`, `"v1.2"`
- `parseStoredPolicyVersion` — same, but tolerates the decimal numbers (`1.4`) that clients released before LIVE-29593 wrote after coercing a `"<major>.<minor>"` flag value. Use it for stored state, `parsePolicyVersion` for remote config
- `comparePolicyVersions` — major before minor, numeric minor ordering
- `parseConsentDate` — `unknown` → `Date` or `null`; strict RFC 3339 (via `@shared/schema-primitives`) so a corrupted date cannot pass as a valid consent
- `analyticsConsentInfoSchema` / `AnalyticsConsentInfo` / `defaultAnalyticsConsentInfo` — stored consent state; `privacyPolicyVersion` accepts legacy numbers and normalized strings so no migration is needed
- `mockAnalyticsConsentInfo` (via `@domain/entity-analytics-consent/schema.mock`)

The consent decision itself lives in `@features/flow-analytics-consent`.

## Testing

```sh
pnpm test
pnpm typecheck
```
