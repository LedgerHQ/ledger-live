# @features/platform-account-discovery

> [!CAUTION]
> **Status: EXPLORATION.** API still being designed.

Account discovery as a stream: `discoverAccounts(ports, { currencyId })` is an `Observable` of
`DiscoveredAccount`, each holding an `AccountDescriptor`. It replaces `scanAccounts` for the question
"which accounts does this seed have on this currency".

## What it is given, not what it knows

Two ports, injected:

- `derive(request)`: the key of one account, on the device. The scanner computes the path (scheme,
  index, account level) and the host answers with an xpub (UTXO) or an address. live-common provides
  `deriveOnDevice(deviceId)` with the legacy resolvers.
- `exists(descriptor)`: whether the account has any history. In the apps it is
  `AccountDataRouter.exists`, which asks the first source with a `supportsExists` and an `exists`.
  A source answers however is cheapest for it: `CoinModuleSource` asks for one operation, then a
  non-zero balance. Another source can use an index lookup.

## What it knows: the legacy rules, as a table

`derivationModes.ts` is a copy of `derivation.ts` as data: the derivation modes, the modes of each
currency, the gap limit (`mandatoryEmptyAccountSkip`), `startsAt`, non-iterable modes, the indexes a
mode leaves to another, and which mode offers a new account. It does not depend on `libs/`.
`libs/ledger-live-common/src/account-data/discoveryParity.test.ts` compares it with the legacy
derivation for every supported currency, so the two cannot drift.

The scan is the one of `makeScanAccounts`: mode by mode, index by index; every used account is
emitted, then the first empty account of a mode that can create one; a mode stops after
`mandatoryEmptyAccountSkip` consecutive empty accounts. A mode the device does not support
(`UnsupportedDerivation`) is skipped.

## What is quicker

Derivations are serial (one device), the existence checks are not. `lookahead: n` checks the next
`n - 1` accounts of a mode while the current one is decided. Decisions are still taken in order, so
the emitted accounts are the same whatever `n`; the cost is up to `n - 1` wasted checks past the
gap limit. Unsubscribing aborts what is in flight.

## Not covered yet

- Families scanned with an address lookup (`getAddressLookup`: several addresses per derived key).
- A source for accounts the app does not hold, other than `CoinModuleSource`: `FullSyncSource`
  needs the account in the store, so currencies outside the coin module families cannot be scanned.
- Token-only history is covered only through a non-zero balance.
