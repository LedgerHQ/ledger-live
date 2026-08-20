> **Status: fixed in Round 3, and better than proposed here.** `getCoinFrameworkCurrencyBridge`'s only
> call site already had `currency` in scope, so the fix threads a real optional `currency` param
> through instead of the `typeof bridgeApi === "function" ? undefined` shortcut this doc proposes
> below. See `PLAN.md`'s Round 3 session notes for what actually shipped. Left this doc as-is as the
> record of the investigation.

# GAP A — the generic currency bridge cannot use Hedera's custom account discovery

**No Jira ticket exists.** LIVE-36154 names it only as "blocked on a shared-layer change owned by
another team". Without it, *Add account* does nothing on the generic path — the scan walks derivation
paths and Hedera accounts are not found that way.

## What is actually missing

`makeScanAccounts` **already accepts** a `buildIterateResult` override:

`libs/ledger-wallet-framework/src/bridge/jsHelpers.ts:399-414`

```ts
export const makeScanAccounts = <A extends Account = Account>({
  getAccountShape,
  buildIterateResult,      // ← optional, already supported
  getAddressFn,
  postSync = (_, a) => a,
}) => …
  if (buildIterateResult === undefined) {
    buildIterateResult = defaultIterateResultBuilder(getAddressFn);
  }
```

The legacy Hedera bridge passes one (`libs/coin-modules/coin-hedera/src/bridge/index.ts:32`, defined
at `bridge/synchronisation.ts:150`): it asks the mirror node
`getAccountsForPublicKey(rootResult.publicKey)` and returns the Nth `0.0.x` account.

The generic currency bridge simply never forwards it:

`libs/ledger-live-common/src/bridge/generic-coin-framework/currencyBridge.ts:15-19`

```ts
scanAccounts: makeScanAccounts({
  getAccountShape: genericGetAccountShape(network, kind),
  getAddressFn: signer.getAddress.bind(signer),
  postSync,
}),
```

So the "shared-layer change" is a pass-through, not a new mechanism.

## Proposed fix — ~8 lines, no mock needed

**Recommended.** Carry it on `BridgeApi`, the channel families already use for this kind of hook.

1. `libs/ledger-wallet-framework/src/api/types.ts` — add to `BridgeApi`:

   ```ts
   /** Overrides the derivation-path walk during account discovery, for chains whose accounts are
    * looked up by public key rather than derived. Absent keeps the default walk. */
   buildIterateResult?: IterateResultBuilder;
   ```

2. `libs/ledger-live-common/src/bridge/generic-coin-framework/currencyBridge.ts` — load the family
   bridge api and forward it:

   ```ts
   const bridgeApi = await loadBridgeApiForFamily(network);
   const buildIterateResult =
     typeof bridgeApi === "function" ? undefined : bridgeApi?.buildIterateResult;

   return {
     scanAccounts: makeScanAccounts({ …, buildIterateResult }),
   };
   ```

3. `libs/ledger-live-common/src/families/hedera/bridge/api.ts` — re-export the existing builder:

   ```ts
   export { buildIterateResult } from "@ledgerhq/coin-hedera/bridge/synchronisation";
   ```

**Prototype shortcut, flag it in review.** `getCoinFrameworkCurrencyBridge(family, "local")` is called
from `bridge/impl.ts:94` with no `CryptoCurrency` in hand, so the `(currency) => BridgeApi` form of a
family bridge api cannot be resolved there. Hedera exports a plain object, so the `typeof === "function"
? undefined` guard is correct for Hedera and inert for everyone else. A production fix threads the
currency into `getCoinFrameworkCurrencyBridge`.

## Fallback if the shared-layer owners prefer it elsewhere

Add `loadIterateResultBuilder?: () => Promise<IterateResultBuilder>` to `CoinModuleLoader`
(`libs/ledger-live-common/src/coin-modules/types.ts`) + a `makeLoaderCache` entry in
`coin-modules/registry.ts`. Same call site change in `currencyBridge.ts`. Slightly more plumbing, but
keeps discovery off the transaction-shaped `BridgeApi`.

## Mock-only escape hatch (last resort)

If neither lands in time, hand-craft one Hedera account in the wallet DB / import an account JSON and
skip discovery entirely. Sync, send and staking can all be exercised on an already-existing account —
only *Add account* is blocked. This is enough to demo, but it hides the one code path most likely to
break.

## Known wart to preserve

`buildIterateResult` returns `publicKey: addresses[index]` — i.e. the `0.0.x` account id, not a public
key (`bridge/synchronisation.ts:161-166`). Keep it as-is for legacy parity; changing it is a separate
question.
