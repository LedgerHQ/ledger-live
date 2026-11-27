# @domain/entity-account-context

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

What an account needs beside its `AccountDescriptor` to be read in full. The descriptor is the account's identity, shared and logged; a secret such as the Aleo view key never goes in it (see [ADR-0002 discussion](https://github.com/LedgerHQ/architecture-as-code/pull/587#issuecomment-7133386155)), so it lives here, keyed by `AccountUUID`.

## Scope

- **Holds** `AccountContext`: `viewKey`, the Aleo view key the device gives once the user approves it, so the account's private records can be read.
- **Meant to be written by** the account discovery completion step, once the device gave the data.
- **Meant to be read by** what rebuilds or reads the full account, such as the legacy `Account`, a coin module's account status read or the portfolio API.
- **Out of scope**: persistence. The slice is in memory until a store owns it.

## Model

- `AccountContext`: every field optional, named for what it is, not for a family. A new field is data a read needs that the descriptor must not hold.
- The slice keys each `AccountUUID` to its context. `accountContextReceived` merges into it, `accountContextRemoved` drops it.
- `selectAccountContext(state, accountUUID)`. Apps mount the slice at `accountContext` when they adopt it.
