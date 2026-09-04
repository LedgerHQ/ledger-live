---
"@shared/api-services": patch
"@domain/api-card-management": patch
---

Name the fields a Card response was rejected on.

- A schema failure reported only `expected string, received undefined`, naming no field, because RTK Query keeps just the thrown error's message unless the api converts it.
- `catchSchemaFailure` now lists every failing path, so one run reports them all.
- The rejected value is never carried into the error: a Card response holds the cardholder's name and PAN digits.
- An internal wallet with no address memo answers with the key absent, not `null`, so `addressMemo` is nullish.
