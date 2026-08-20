---
"@ledgerhq/live-common": patch
---

Stop treating a failed live-app catalog fetch as an empty catalog. The fetch used to swallow network errors and resolve to `[]`, which `RemoteLiveAppProvider` then stored as a successful (but empty) registry with `error: null` and did not refetch for 30 minutes — so a transient failure at startup left every live app unresolvable ("App not found") for the whole session. Errors now propagate, a failed refresh keeps the previously loaded catalog, and a failure is retried with backoff instead of waiting for the next scheduled refresh
