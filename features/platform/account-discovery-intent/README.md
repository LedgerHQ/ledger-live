# @features/platform-account-discovery-intent

> [!WARNING]
> **Status: UNSTABLE** — first implementation, its API may change.

The Device Intent of [account discovery](../account-discovery/README.md): the executor connects the device and opens the currency app, then the job runs `discoverAccounts` on that session. It emits `scanning` with the accounts found so far, then `done`, and reports them all through `onResult`. A failure ends on an `error` state that keeps the accounts found, as the Device Intent contract asks: the observable never errors.

The job stays signer-agnostic: the host gives `createDerive(connection)` for the app the executor opened, and `exists` from its account data router. A DMK-native signer per app plugs in there, without the job knowing the family.
