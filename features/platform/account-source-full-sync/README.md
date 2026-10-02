# @features/platform-account-source-full-sync

> [!CAUTION]
> **Status: UNSTABLE** — New package; API still being designed.

An account data source that will serve every datum from one full account sync.

## Responsibility

`FullSyncSource` implements `AccountDataSource` from
[`@domain/api-account-data-source`](../../../domain/api/account-data-source). It is an empty shell:
it has no datum method and `supports` returns `false`, so the router always falls through. Methods
arrive with the first `@domain/entity-account-*` slices. The legacy sync it will run is injected by
the app, never imported here.
