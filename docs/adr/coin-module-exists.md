# ADR: A coin module tells whether an account exists

**Status:** Proposed (2026-11-09), for the coin modules team. Tracked in [LIVE-40835](https://ledgerhq.atlassian.net/browse/LIVE-40835); submitted as [ADR-077 in coin-modules](https://github.com/LedgerHQ/coin-modules/pull/1282), which is the copy to review.

## Context

Adding an account scans the seed: the device derives one account after another, and the wallet asks each one "has it any history?" until a gap of unused accounts closes the derivation mode. Account discovery now runs on account descriptors ([`@features/platform-account-discovery`](../../features/platform/account-discovery)): it asks the `existence` kind of the account data router ([`@domain/entity-account-existence`](../../domain/entity/account-existence)), `{ used: boolean }`.

Today only the full sync source answers it: one full `AccountBridge.sync()` of a placeholder account per candidate, operations and tokens included, to read a single boolean. A scan of one currency asks it at least `mandatoryEmptyAccountSkip + 2` times, so adding an account costs several full syncs per derivation mode. It also cannot answer a family whose sync needs more than the descriptor holds: TON restores its public key from the account, so the full sync source hands TON over (`syncsFromDescriptor: false`) and nothing answers.

The coin modules already read the chain behind every account the wallet holds (`getBalance`, `listOperations`), and most chains answer "is this address known" in one call: an account endpoint, a nonce, a transaction count.

## Decision

`CoinModuleApi` (in `@ledgerhq/coin-module-framework`) gains an optional read:

```ts
/**
 * Whether the address has any history: a transaction, or a balance of any asset. In as few
 * calls as the chain allows; `false` for an address the chain has never seen.
 */
exists?: (context: Context<ConfigType>, address: string) => Promise<boolean>;
```

- **Optional, no default.** `withDefaults` does not stub it: a module without `exists` is read by the next source, the full sync, as today.
- **Same subject as `getBalance`.** It takes the address the module already takes. For a UTXO account the subject is the xpub (see below).
- **Same answer as the legacy scan.** `true` exactly when the scan would have found the account used, including a family's own rule (VeChain does not count its empty VTHO token).
- **The coin service exposes it too.** The Network endpoints of the coin service and portfolio take the same address, so a remote source answers it without the wallet loading the module, and can take many addresses in one call (a batch reader, below).

The wallet side is done in the PoC of this ADR: the coin module source ([`@features/platform-account-source-coin-module`](../../features/platform/account-source-coin-module)) answers `existence` through `CoinModuleHost.getExistenceApi`, and live-common's host reads `exists` from any local module that has it. Ranked before the full sync, it serves every currency whose module implements it, and falls through for the others. TON implements it as the first module (`libs/coin-modules/coin-ton/src/logic/exists.ts`): one `/account` call, plus `/jetton/wallets` only for an address without a transaction or a balance, from the address alone.

### Descriptor to address: who does it

An account descriptor is either an address (account-based chains) or an xpub at an account path (UTXO). The question raised by the coin modules team is who turns a descriptor into what `exists` takes.

| Descriptor | Subject of `exists` | Who derives it |
| --- | --- | --- |
| `address` | the descriptor's `address` | nobody: the device already derived it during discovery |
| `utxo` | the xpub | the coin module (or the explorer behind it): new work, see below |

No coin module reads an xpub today: coin-bitcoin's `getBalance` and `listOperations` take one address, and scanning an xpub's receive and change chains still lives in the legacy bitcoin sync (`@ledgerhq/wallet-btc`). So `exists(xpub)` needs one of:

1. the module derives the first receive address(es) from the xpub and checks them on its explorer, moving that derivation from wallet-btc into coin-bitcoin;
2. the coin service or explorer takes the xpub, and the module passes it through.

Until then UTXO families keep the full sync fallback.

The wallet never derives addresses from a public key: that is chain-specific (address formats, workchains, script types), and the coin module owns it. The account data source maps a descriptor to its subject in one place, `subjectOf` in the coin module source, which is the only line to change if a module later wants the whole descriptor.

A family whose address is not derivable from what the device gives (an account to onboard first: Canton, Concordium, Aleo) does not implement `exists` from an address; it is out of scope here.

### Many addresses at once

Discovery derives a window of candidates, then asks their existence in the same tick (`window` in `discoverAccounts`), so the router can hand them to a source in one call. A coin service endpoint taking several addresses maps to a batch reader of the source (`readBatch.existence`), with no change to discovery. A local module stays one address per call: its reads are cheap, and the router already caps calls in flight per source.

## Consequences

- Adding an account costs one light read per candidate instead of a full sync, for every family that implements `exists`.
- TON accounts can be discovered without the public key.
- The full sync stays the fallback until every family implements `exists`; the parity of the two answers can be checked per family with the DevTools Accounts > Discovery page, which runs the scan through the router.
- `exists` joins `CoinModuleApi` in the framework repository; until it ships, TON declares it locally (`ExistsCapability` in `coin-ton/src/api/index.ts`) and live-common reads it structurally.

## Alternatives considered

- **Derive `exists` from `getBalance` and `listOperations({ limit: 1 })`.** Works for every module with no new method, but costs two reads (and often token lookups) where one would do, and cannot follow a family rule like VeChain's.
- **Keep the full sync.** Correct, but several full syncs per derivation mode, and no answer for TON.
- **Address derivation in the wallet.** Would let the wallet ask one address of an xpub, but duplicates per-chain address logic the coin modules already own.
