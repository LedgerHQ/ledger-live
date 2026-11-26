# @domain/entity-account-context

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

What an account needs beside its `AccountDescriptor` to be read in full. The descriptor is the account's identity, shared and logged; a secret such as the Aleo view key never goes in it (see [ADR-0002 discussion](https://github.com/LedgerHQ/architecture-as-code/pull/587#issuecomment-7133386155)), so it lives here, keyed by `AccountUUID`.

## Scope

- **Holds** `AccountContext`: `viewKey`, the Aleo view key the device gives once the user approves it, so the account's private records can be read.
- **Written by** the account discovery completion step for an account not added yet, once the device gave the data, and mirrored from the held legacy accounts by `connectAccountContextsStore`, as `connectAccountsStore` mirrors their descriptors.
- **Read by** what rebuilds the full account: the legacy `Account`, whose id keeps the view key as custom data. Later, other reads that need it, such as the portfolio API.
- **Out of scope**: persistence. The legacy `Account` id is the persisted copy; the slice mirrors it.

## Model

- `AccountContext`: every field optional, named for what it is, not for a family. A new field is data a read needs that the descriptor must not hold.
- The slice keys each `AccountUUID` to its context. `accountContextReceived` merges into it, `accountContextRemoved` drops it.
- `legacyAccountContextsSynced` replaces the contexts of the held accounts and drops those of removed ones, leaving a candidate's context alone. Each legacy account converts once; one that fails is retried once it changes, and reported once.
- `selectAccountContext(state, accountUUID)`. Apps mount the slice at `accountContext` and call `connectAccountContextsStore` next to `connectAccountsStore`.
- `redactAccountContextAction` / `redactAccountContextState` replace each context field with `[REDACTED]` for Redux DevTools and action logs.
