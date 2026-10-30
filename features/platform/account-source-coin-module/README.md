# @features/platform-account-source-coin-module

> [!CAUTION]
> **Status: UNSTABLE.** API may change while the coin module kinds plug in.

An [`AccountDataSource`](../../../domain/api/account-data) that reads coin modules directly, without the `generic-coin-framework` layer. For now it serves the `balance` kind.

- `createCoinModuleSource(host)`: the source, id `coin-module`.
  - `supports`: a descriptor whose network's currency has a registered coin module. No family list: the registry decides, so a currency without a coin module falls through to the next ranked source. A `utxo` descriptor is served only where the host says the coin module reads an xpub (`readsXpub`): none does today, since they read one address, so utxo accounts stay with FullSync.
  - `balance`: reads the coin module by the account's address, or its xpub for a `utxo` descriptor, and answers the account's native coin first, then its listed, non-blacklisted tokens. A native `spendableBalance` is `value - locked`.
    - `read.balance` reads one account.
    - `readBatch.balance` reads up to 10 accounts per call. It loads each currency's coin module once, then calls it once per account, at most 4 coin module calls in flight across every batch call of the source. Each account settles on its own: a failing account fails alone.
    - An account the coin module cannot answer completely falls through to the next source (`AccountDataNotServedError`): no balance read in the coin module (`getApi` resolves `undefined`), or tokens returned with no token resolver to list them.
- `CoinModuleHost`: what the source takes from the coin modules (`isCurrencySupported`, `getApi`, `blacklistedTokenIds`). The package cannot import `libs/`, so the app injects it: `createCoinModuleHost` in `@ledgerhq/live-common/account-data/coin-module/createCoinModuleHost` builds it on the coin module registry, with no `generic-coin-framework` layer. It serves the currencies whose family loader supports them and ships a local api.

Each app ranks it before the FullSync source in `src/config/account-data-setup.ts`, so FullSync stays the fallback. See [the account data layer](../../../docs/account-data-layer.md).
