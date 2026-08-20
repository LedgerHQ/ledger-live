# Gaps found in the code that no LIVE-361xx ticket covers

Verified against the working tree on 2026-08-19 (branch `wip/hedera-generic-adapter`).
GAP A (custom account discovery) has its own file: `GAP-A-buildIterateResult.md`.

---

## GAP B — no `families/hedera/transaction.ts`, so the generic transaction does not round-trip

**Severity: blocker for staking, silent.**

The loader still points Hedera at the coin module's serializer:

`libs/ledger-live-common/src/coin-modules/loaders.ts:238`
```ts
loadTransaction: () => import("@ledgerhq/coin-hedera/transaction").then(m => m.default),
```

That serializer (`libs/coin-modules/coin-hedera/src/transaction.ts:24+`) revives the **legacy** shape:
`memo`, `maxFee`, `properties`, `assetReference`, `assetOwner`. It knows nothing about `valId`,
`fees`, generic `mode`, `feesStrategy` or `familySpecificData`.

Every family already on the generic adapter has a family-local `transaction.ts` for exactly this —
`families/tezos/transaction.ts`, `families/stellar/transaction.ts`, `families/evm/transaction.ts`.
The framework says so explicitly:

> "There is no generic raw-to-transaction converter — each family's own `fromTransactionRaw`
> enumerates the fields it revives … or a flow rebuilding from `Operation.transactionRaw` crafts a
> different intent than the one that was signed."
> — `bridge/generic-coin-framework/types.ts:110-122`

**Consequence:** after LIVE-36151/36152 move the UI to `valId`, any flow that persists and reloads a
transaction (swap, pending-op rebuild, deeplink) drops the node id. Staking silently targets nothing.

**Fix:** add `families/hedera/transaction.ts` reviving the generic fields, and repoint
`loadTransaction`. ~1 pt. **Should be its own ticket.**

---

## GAP C — no `families/hedera/deviceTransactionConfig.ts`, so device confirm fields go stale

**Severity: user-visible, medium.**

`loaders.ts:239-240` points at `@ledgerhq/coin-hedera/deviceTransactionConfig`, which branches on the
legacy mode enum:

| Legacy mode (`HEDERA_TRANSACTION_MODES`) | Generic mode |
| --- | --- |
| `send` | `send` ✅ same |
| `delegate` / `undelegate` / `redelegate` | same ✅ |
| `token-associate` | `changeTrust` ❌ |
| `claim-rewards` | `claimReward` ❌ |

So `isTokenAssociateTransaction` and the `MAP_STAKING_MODE_TO_METHOD["claim-rewards"]` lookup both
miss once the transaction carries generic modes — the device screen loses its "Method" row for those
two flows. `families/stellar/deviceTransactionConfig.ts` and `families/tezos/deviceTransactionConfig.ts`
are the family-local precedent.

**Fix:** family-local `deviceTransactionConfig.ts` mapping generic modes, repoint `loadDeviceTxConfig`.
~1 pt. **Should be its own ticket, or folded into LIVE-36150** (which owns the `changeTrust` mapping).

---

## GAP D — `craftRawTransaction` throws, so swap / exchange breaks on the generic path

> **Resolved in Round 9 (2026-08-19): leave it throwing, no ticket.** Checked the three
> already-shipped, already-flipped generic-framework families with the same exchange-app
> integration pattern as Hedera — `coin-tron`, `coin-evm`, `coin-cosmos`. All three throw the
> identical `"craftRawTransaction is not supported"` for the same reason (never implemented), and
> none has an open ticket for it. Since `signRawOperation` is wired unconditionally by the generic
> account bridge regardless of family, if this were actually blocking swap/sell in production for any
> of those three, it would already be a known, filed issue — it isn't. Conclusion: swap/sell does not
> route through `signRawOperation` on the generic path for these currencies (it uses ordinary
> `signOperation` against the exchange's deposit address), so `exchange.ts`'s existence doesn't imply
> the raw path is used. Hedera's throw is the established convention, not a gap.

**Severity: unknown blast radius, needs a decision.**

`libs/coin-modules/coin-hedera/src/api/index.ts:82-90` throws
`"craftRawTransaction is not supported"`. The generic account bridge wires
`signRawOperation: genericSignRawOperation(…)` unconditionally
(`bridge/generic-coin-framework/accountBridge.ts:41`), and that path calls `craftRawTransaction`
(`signRawOperation.ts:41`).

Hedera has an exchange integration (`libs/ledger-live-common/src/families/hedera/exchange.ts`), so
this is not obviously dead code. LIVE-36149 collects "residual API gaps" but explicitly lists only
max-send, balance options and `supportedFeatures`.

**Action:** confirm whether Hedera swap/sell uses `signRawOperation`. If yes → new ticket. If no →
record the decision so the throw is understood as intentional (same treatment LIVE-36154 gives
`getNextSequence`).

---

## GAP E — LIVE-36144's `getAddress` options caution does not match the device app

**Severity: none functionally — but it will cost someone an hour.**

The ticket says: *"Normalise the `getAddress` options argument, or the device will ask the user to
confirm their address before every signature."*

`libs/ledgerjs/packages/hw-app-hedera/src/Hedera.ts` has **no options argument and no verify flag**:

```ts
async getPublicKey(path: string): Promise<string>
async signTransaction(transaction: Uint8Array): Promise<Uint8Array>   // no path either
```

There is nothing to normalise. The real adaptation work is the opposite direction: the framework calls
`signer.signTransaction(derivationPath, unsigned, options)` with three arguments
(`bridge/generic-coin-framework/signOperation.ts:91`) and the device method takes one — so the family
signer must **drop** the path and the options.

Related, worth recording on LIVE-36144: `signTransaction` hardcodes account index `0`
(`payload.writeUInt32LE(0)`, with a `TODO` saying the BOLOS app supports nothing else). Signing from a
second discovered Hedera account is a device-app limitation, not something the adapter can fix.

---

## GAP F — no ticket for the `hedera_testnet` config / CAL side of the flip

**Severity: low, probably fine.**

LIVE-36154 flips both `hedera` and `hedera_testnet` at once because the allowlist is per family.
Nothing in the epic checks that `hedera_testnet` has a working coin config on the generic path
(`libs/coin-modules/coin-hedera/src/config.ts` → `resolveConfig(currency.id)`). Add it to the manual
matrix rather than opening a ticket.

---

## GAP G — the incremental-sync cursor never actually reaches a second Hedera sync

**Severity: correctness is fine, efficiency is not — found while closing LIVE-36148.**

LIVE-36148 fixes the second sync's *crash* (`invariant(minHeight === 0, …)`), but the pagination cursor
it relies on instead never arrives. Hedera's `logic/listOperations.v2.ts:47` sets
`extra.pagingToken = rawTx.consensus_timestamp` on every operation, and `api/index.ts`'s
`listOperations` spreads that straight onto `Operation.details` (`details: { ...liveOp.extra, … }`).

The generic framework reads the next sync's cursor from `oldOps[0]?.extra?.pagingToken`
(`bridge/generic-coin-framework/getAccountShape.ts:515`), but the function that builds that `extra`
bag — `adaptCoreOperationToLiveOperation` (`generic-coin-framework/utils.ts:499`) — only promotes a
fixed list of known keys, plus whatever sits **nested** under `details.familyExtra`
(`readFamilyExtra`, same file, ~line 450). Hedera's `pagingToken` is a **flat** key on `details`, not
nested under `familyExtra`, so it is silently dropped. `cursor` is therefore always `undefined` on
every Hedera sync after the first: each "incremental" sync actually re-fetches the same page from
scratch.

**Why acceptance criteria still pass:** `mergeOps` dedupes by operation id and only ever adds,
never removes, so re-fetching the same page produces no duplicates and drops nothing — the user-visible
behavior LIVE-36148 asks for is correct. What's missing is the efficiency the ticket's "likely fix"
describes (paging forward on the timestamp cursor instead of re-fetching).

**Fix is framework-level, not a `coin-hedera`/`families/hedera` one-file change** — either:

- Hedera nests its per-operation extras under `details.familyExtra` instead of spreading them flat
  (matches how other families that use `familyExtra` do it), or
- `adaptCoreOperationToLiveOperation` also promotes a flat `details.pagingToken` onto `Operation.extra`
  generically, alongside the fields it already knows about.

**Needs a decision then a ticket** — whichever owns the shared account-shape layer picks the shape.

---

## GAP H — staking UI silently loses validators entirely, not just the node id, once the flag flips

**Severity: user-visible, found by an existing test breaking the moment LIVE-36154 flipped the flag.**

`families/hedera/react.ts`'s `useHederaPreloadData`/`useHederaValidators`/`useHederaEnrichedDelegation`
— the hooks the LLD/LLM validator-search and delegation-display screens call — read from
`@ledgerhq/coin-hedera/preload-data`'s module-level singleton. That singleton is populated by
`bridge/cache.ts:prepareCurrency`, which calls `bridge.preload(currency)` on the account's
**currency bridge** and stores whatever it returns
(`bridge/cache.ts:39`: `if (!bridge.preload) return undefined;`).

The generic currency bridge (`getCoinFrameworkCurrencyBridge`) has no `preload` method at all — no
family on the generic framework does; `preload`/`hydrate` is a legacy-bridge-only concept. So the
moment `hedera` is enabled in `genericCoinFrameworkFamilies.json`, `prepareCurrency` silently no-ops
for it, the singleton is never populated, and every one of these hooks returns an empty validator
list forever. `families/hedera/react.test.ts` (a plain unit test, not a network integration one)
started failing for exactly this reason the moment the flag flipped — confirmed by running its
mocked node list through `useHederaValidators`/`useHederaEnrichedDelegation` and seeing zero
validators regardless of the mock.

**This is broader than the already-known "staking UI expected broken" window.** LIVE-36151/36152 fix
`transaction.properties.stakingNodeId` reads — necessary, but validator search/selection and
delegation display don't read that field at all; they read the preload singleton via these hooks.
Fixing 36151/36152 alone leaves validator search empty.

**Likely fix:** the generic sync path already fetches validators per-account and attaches them —
`bridge/generic-coin-framework/getAccountShape.ts`'s `validatorsPromise` (gated on
`bridgeApi.stakingSupported`, which Round 2 set to `true` for Hedera) writes them onto
`account.stakingResources.validators`. `families/hedera/react.ts` would need to read from there (or
from a currency-level generic validators fetch) instead of the legacy singleton — a rewrite of these
three hooks, not a one-line fix, since `useHederaValidators(currency)` today takes a currency with no
account in scope, while `stakingResources.validators` lives on a synced account.

**Needs a ticket** — natural home is either folded into LIVE-36151/36152 (both flows land staking UI
work) or its own ticket, since it affects both desktop and mobile and neither existing ticket mentions
`react.ts`.

---

## GAP I — `claimReward`'s displayed fee estimate uses the wrong operation type, understating cost

**Severity: user-visible fee estimate, not a correctness/crash bug — found while fixing LIVE-36150's
changeTrust routing in the same function.**

`api/index.ts`'s own `estimateFees` `CoinModuleApi` method — the one `genericPrepareTransaction`
(ledger-live-common) calls to compute the fee shown in the UI before signing — routes by operation
type via `logic/utils.ts`'s `mapIntentToSDKOperation(txIntent)`. That function maps `delegate` /
`undelegate` / `redelegate` to `CryptoUpdate` (the correct, more expensive schedule for an
account-update transaction) but has **no case for `claimReward`/`claim-rewards` at all** — it falls
through to the default, `CryptoTransfer` (a plain transfer's cheaper flat fee).

`logic/validateIntent.ts`'s own `validateStaking` branch (LIVE-36147) estimates the fee for **all
four** staking modes — including `claimReward` — via `CryptoUpdate`, matching the legacy bridge's
`handleStakingTransaction` exactly. So the two paths disagree for `claimReward` specifically: the
figure shown while preparing the transaction (`CryptoTransfer`, cheap) doesn't match the figure
`validateIntent` computes internally (`CryptoUpdate`, correct) — a claim-rewards transaction's
estimated fee is understated in the UI right up until signing.

Pre-existing in `mapIntentToSDKOperation` itself (not introduced by this epic), but only exposed as a
live inconsistency once Hedera's `estimateFees` method actually gets called through the generic
`prepareTransaction` path — the legacy bridge never routed through this function for staking at all.

**Fix:** add a `ClaimRewards` case to `mapIntentToSDKOperation` alongside the existing
Delegate/Undelegate/Redelegate one, mapping to `CryptoUpdate`. One line, in the same function
LIVE-36150 already touches for the association routing — deliberately left out of that round to keep
its diff to the one thing it was scoped for. **Needs a ticket**, or fold into whichever ticket next
touches fee estimation.
