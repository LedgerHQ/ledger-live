# @features/platform-account-discovery

> [!WARNING]
> **Status: UNSTABLE** — first implementation, its API may change.

Account discovery as a stream: `discoverAccounts(host, { currencyId })` is an `Observable<DiscoveredAccount>`, in the order of the legacy `scanAccounts`. It answers "which accounts does this seed have on this currency", and nothing else: no `Account`, no sync, no store.

Each `DiscoveredAccount` carries a descriptor, so `discoverAccounts`, the host types, `registerDiscoveredAccounts` and completion (`completion.ts`) come from `@features/platform-account-discovery/descriptor`, which lint keeps to the edges (`ACCOUNT_DESCRIPTOR`, see [`docs/account-models`](../../../docs/account-models)). The root entry holds the errors and `ScannedAccount`, what the UI holds.

`registerDiscoveredAccounts(dispatch, isHeld)` is the operator the edge pipes the scan through: it registers each descriptor in the `discoveredAccounts` slice of [`@domain/entity-account`](../../../domain/entity/account), so `useAccountData` reads the account before it is added, and emits a `ScannedAccount` (`{ accountUUID, candidate, status }`). `isHeld` skips UUIDs already in the accounts slice, so a rediscovered saved account does not re-enter the register after promotion. The flow dispatches `discoveredAccountsCleared` when it ends or rescans.

```mermaid
flowchart LR
  D["@domain/entity-derivation<br/>candidateOf(currency, mode, index)"] --> S[discoverAccounts]
  S -- "derive(candidate)" --> H1["host: device<br/>(Device Intent session)"]
  H1 -- AccountDescriptor --> S
  S -- "readStatus(descriptor)" --> R["account data router<br/>kind: accountStatus"]
  R --> X1[full sync source]
  S -- DiscoveredAccount --> REG[registerDiscoveredAccounts]
  REG -- descriptor --> DA["discoveredAccounts slice"]
  REG -- ScannedAccount --> U[UI / add account flow]
```

## What the host gives

- `derive(candidate, signal)`: the `AccountDescriptor` of an `AccountCandidate`, its key derived on the device (an xpub for a UTXO account, a hex extended public key for Cardano and Kaspa, an address otherwise). Throws an `UnsupportedDerivation` when the device app has no such mode: the mode is skipped. Resolves `null` to end the mode there, keeping the accounts found before it, as the legacy scan's iterate does (Celo on an app too old for a path). Resolves `{ descriptor, keyHasMoreAccounts }` for an account looked up from a key (Hedera): while the key lists more accounts after it, an empty one does not count toward the gap limit, as the legacy `keyHasMoreAddresses`.
- `readStatus(descriptor, signal)`: whether the account was ever used, and its gate. `statusThroughRouter(router)` reads the `accountStatus` kind ([`@domain/entity-account-status`](../../../domain/entity/account-status)) from the app's sources.

## What it knows

The rules of `@domain/entity-derivation`: the modes of the currency, the gap limit, `startsAt`, non-iterable modes, the indexes a mode leaves to another, which mode offers a new account. Every used account is emitted, then the first empty account of a mode that can create one; a mode stops after `mandatoryEmptyAccountSkip` consecutive empty accounts. Each carries its `AccountStatus`: its gate tells an account to onboard first (Canton, Concordium).

## How fast

Each mode is scanned in order, one derivation at a time. While an account's status loads, the device derives the next account only when the mode reaches it whatever that status is: the empty accounts before it leave room under the gap limit (`mandatoryEmptyAccountSkip`), or its key lists more accounts. The device and the network overlap in modes with a gap limit, and the device derives exactly what the legacy scan derives.

## Failures and cancellation

- A failure surfaces once the scan reaches that account; nothing past the gap limit is asked.
- The scan fails only once the device is idle: a derivation started ahead is aborted and settles first.
- Unsubscribing aborts the `signal` handed to `derive` and `readStatus`, and starts no new derivation or status read. `statusThroughRouter` forwards it to the router, which stops the source once no other read waits for the account.

## Parity notes

- The legacy env scan rules (`KEYCHAIN_OBSERVABLE_RANGE`, `SHOW_LEGACY_NEW_ACCOUNT`) are `ScanRules` the host passes in the options.
- Parity with the legacy scan also depends on the host: its `derive` must give the descriptor the legacy scan would store, and its `readStatus` the `used` the legacy scan would compute.

## Completion

Some families cannot add a discovered account as it is: its sync needs data only the device gives, often once the user approves it. Completion is the optional device step after the user selected accounts; it is exported from `/descriptor` because it takes and returns descriptors. That data never enters the descriptor: it is the account's context (`@domain/entity-account-context`).

- `splitSelection(selected, needsCompletion)` splits a selection into the accounts ready to add and those needing the step. `needsCompletion` comes from the host (the coin module loader's `accountCompletion`), so this package never names a family.
- `CompleteAccounts(selected)` streams an `AccountCompletionEvent` per account: `waiting`, `awaiting-approval` (only for a step that asks an approval), then `completed` with the account context the device gave, or `refused`, or `failed` when the device derives another account on that path (not settled: a new run asks it again). The descriptor stays as discovered. Any other error, a disconnect included, errors the stream: the Device Intent decides whether to retry.
- `completionStates(selected, events)` folds the events, keyed by the descriptor as discovered. `failPending` and `dropPending` settle the accounts a failed or stopped batch did not reach, keeping the approved ones. `mergeCompletionStates` lays a retry's states over the previous attempt's: a settled account is never prompted again.

A completed state carries a secret: never log or display it. The host hands it to the sync that adds the account.
