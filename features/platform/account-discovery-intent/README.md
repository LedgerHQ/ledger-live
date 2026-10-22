# @features/platform-account-discovery-intent

> [!CAUTION]
> **Status: EXPLORATION** — API still being designed.

The Device Intent of [account discovery](../account-discovery/README.md): the executor connects the device and opens the currency app, then the job runs `discoverAccounts` on that session. It emits `scanning` with the accounts found so far, then `done`, and reports them all through `onResult`.

The job stays signer-agnostic: the host gives `createDerive(connection)` for the app the executor opened, and `exists` from its account data router. A DMK-native signer per app plugs in there, without the job knowing the family.
