---
name: cloud-sync-module
description: |
  Write, review or debug a `cloudSyncModule.ts` — a `CloudSyncDataManager` that syncs one slice of
  user data through Ledger Sync (Cloud Sync). Covers the contract, its invariants, the mandatory
  contract test, the wiring checklist and the data-loss traps.
  Use for any work on `**/cloudSyncModule.ts`, `createAggregator`, or `@shared/cloud-sync-module`.
---

# Authoring a `cloudSyncModule.ts`

A module reconciles **LocalState** (what the app holds, from Redux) with **DistantState** (what is
stored encrypted in Cloud Sync). `createAggregator` composes every module into one blob shared by all
of the user's instances (LWD, LWM, web-tools).

Concepts: [05-wallet-sync-data-manager](../../../docs/ledger-sync/05-wallet-sync-data-manager.md),
then [06-watch-loop](../../../docs/ledger-sync/06-watch-loop.md) for when each hook fires. Steps and a
video: [cookbook](../../../docs/ledger-sync/cookbook.md#develop-a-new-walletsync-module). Testing
layers: [test-strategy](../../../docs/ledger-sync/test-strategy.md). Contract:
[`@shared/cloud-sync-module`](../../../shared/cloud-sync-module/src/index.ts). Copy
[`account-name`](../../../domain/entity/account-name/src/cloudSyncModule.ts) (simplest);
[`accounts`](../../../libs/live-wallet/src/accounts/cloudSyncModule.ts) for async + injected ctx;
[`recent-addresses`](../../../domain/entity/recent-addresses/src/cloudSyncModule.ts) for the
tolerant-list schema only — its `.transform()` use is a known bug (see below).

## The three hooks

| Hook | Sync? | Runs | Must return |
|---|---|---|---|
| `diffLocalToDistant(local, latest)` | sync | every loop tick (~10s) before push | `{ hasChanges, nextState }` — what to **push** |
| `resolveIncrementalUpdate(local, latest, incoming)` | async | on pull **and** every tick with `incoming === latest` | `{ hasChanges: false }` or `{ hasChanges: true, update }` |
| `applyUpdate(local, update)` | sync | only when the above reported changes | the new LocalState (pure, no mutation) |

Live under `domain/entity/<name>/src/cloudSyncModule.ts` beside `schema.ts` + `slice.ts` (see
[`domain/entity/README.md`](../../../domain/entity/README.md)). Type it
`CloudSyncDataManager<LocalState, Update, typeof schema>`, with `hasChanges: false as const` so the
union narrows. A 4th generic `DistantState` defaults to `z.infer<Schema>` — pass the **raw wire type**
explicitly if your schema transforms, since that is what the hooks actually receive.

## Invariants — break one and the loop misbehaves

1. **`resolveIncrementalUpdate` short-circuits on `incoming == null`, on `incoming === latest`, and on
   `incoming` being *content-equal* to local.** The reference check alone only covers
   `makeLocalIncrementalUpdate`, which passes one object as both args every tick; every pull hands you
   a freshly decrypted one
   ([`incrementalUpdates.ts`](../../../features/platform/wallet-sync/src/incrementalUpdates.ts),
   `makeSaveNewUpdate`). Without the content check, an unchanged pull dispatches → re-renders → pushes,
   forever.
2. **`diffLocalToDistant(emptyLocal, null)` → `hasChanges: false`**, or every user who never touched
   the feature creates Cloud Sync data on first launch.
3. **Stability**: re-diffing against your own `nextState` yields `hasChanges: false`. No `Date.now()`,
   no random ids, no unstable key order.
4. **Round-trip**: the comparator must ignore any field `applyUpdate` cannot reproduce exactly
   (recent-addresses stores `lastUsed` but never compares it — comparing it would loop forever).
5. **Convergence**: after `applyUpdate` from an incoming state, diffing against that state reports no
   changes.
6. **Purity**: LocalState comes from Redux and is Immer-frozen. Never mutate — return new objects.

## Risks to evaluate before writing a line

- **Wiping every instance's data.** Persist LocalState with the same lifetime as
  `walletSyncState.version` (`exportWalletState` / `importWalletState`, both apps). Otherwise a restart
  finds the version "up-to-date", never pulls, and `diffLocalToDistant(empty, latest)` pushes an empty
  state that deletes the data everywhere.
- **A too-strict schema kills sync, or overwrites data.**
  [`CloudSyncSDK`](../../../shared/cloud-sync/src/cloudsync/sdk.ts) parses the *whole* aggregate on
  every pull and push, so one module rejecting another version's payload stops sync for accounts,
  names, everything. On the persisted path `parseDistantState`
  ([`walletSyncComposition.ts`](../../../libs/live-wallet/src/walletSyncComposition.ts)) `safeParse`s
  and returns **`null`** instead — which the loop reads as "no distant state" and pushes over. Stay
  permissive: optional fields, `z.unknown()` + `safeParse`-and-filter for lists, never `.strict()`.
- **A `.transform()`'s output is discarded in production.** Both call sites above do parse — the
  transform executes — then pass the **raw JSON** on, to preserve unknown fields. Hooks therefore get
  un-normalised data typed as the transform's output, a lie TypeScript will not catch; normalise in the
  hooks instead. The contract suite won't catch it either: it only ever replays states your own
  `diffLocalToDistant` produced (the idempotence case runs one back through `schema.parse()`), never
  the legacy payload an older version actually wrote.
- **No migrations, ever.** The wire format is permanent and shared across app versions: add optional
  fields only, never rename, repurpose or require a key. Rebuilding `nextState` from scratch
  (account-name, recent-addresses) is safe only while your subtree is a total function of LocalState —
  once it can carry a field you don't own, apply your diff on top of `latest` as accounts does, or you
  silently delete the other version's data. recent-addresses already violates this: it drops the
  `ensName` its own schema declares.
- **Payload and privacy.** One blob holds every module: store the minimum needed to restore the state
  (descriptors, ids), nothing refetchable, no raw device/user ids (`client-ids`).
- **Async blocks the loop.** `resolveIncrementalUpdate` runs inside the pull's atomic lock. Network
  work must be batched and recoverable — see accounts' `nonImportedAccountInfos` + backoff queue.
- **Injected dependencies?** The interface has no ctx: export a `bindCtx(ctx)` factory, as accounts does.

## Tests

`describeCloudSyncModuleContract` is **mandatory**, but a floor rather than a proof. It covers
invariants 1-3 and 5, JSON serialisability, a 1MB ceiling, and a 5ms average over 100 calls — for
`diffLocalToDistant` and `applyUpdate` only. It skips invariant 4 and `resolveIncrementalUpdate`'s
cost, and wraps its convergence and `applyUpdate` cases in `if (result.hasChanges)`, so a module that
always answers `hasChanges: false` passes them silently.

```ts
// src/__tests__/cloudSyncModule.test.ts
import { describeCloudSyncModuleContract } from "@shared/cloud-sync-module/moduleRequirements";

describeCloudSyncModuleContract("<name>SyncModule contract", <name>SyncModule, {
  emptyLocalState,
  nonEmptyLocalState,
  matchingDistantState, // optional — always provide it, it unlocks 2 extra checks
});
```

Then add module-specific cases:

| Target | Cover |
|---|---|
| `schema` | valid payload · garbage/unknown entries tolerated, not thrown · fields written by a future version survive |
| `diffLocalToDistant` | null latest · exact match · added · modified · removed · fields it must ignore (invariant 4) |
| `resolveIncrementalUpdate` | null incoming · same reference · **same content, different reference** · real change · the **raw payload rather than `schema.parse()`'s output** (the only way to catch the transform trap) |
| `applyUpdate` | expected state · does not mutate `localData` · is reached at all — assert `hasChanges: true` explicitly instead of trusting the contract suite |

Run `pnpm --filter @domain/entity-<name> test`; copy a sibling entity package's jest config
(`testEnvironment: "node"`, `roots: ["<rootDir>/src"]`).

## Wiring checklist

Registration is where the module becomes real — and where the persistence risk above lives.

1. [`walletSyncComposition.ts`](../../../libs/live-wallet/src/walletSyncComposition.ts) — add the key to
   `createAggregator({...})` **and** to the hand-maintained `walletSyncSchema` (they are duplicated;
   miss the second and your key silently vanishes from `WalletSyncDistantState`).
2. Reducers — LWD [`wallet.core.ts`](../../../apps/ledger-live-desktop/src/renderer/reducers/wallet.core.ts),
   LWM [`wallet.ts`](../../../apps/ledger-live-mobile/src/reducers/wallet.ts): reducer,
   `ExportedWalletState`, `exportWalletState`, `walletStateExportShouldDiffer`, `importWalletState`.
3. `useWatchWalletSync.ts` — [LWD](../../../apps/ledger-live-desktop/src/mvvm/features/WalletSync/hooks/useWatchWalletSync.ts),
   [LWM](../../../apps/ledger-live-mobile/src/mvvm/features/WalletSync/hooks/useWatchWalletSync.ts):
   add the key to `localStateSelector` and dispatch it in `save`.
4. [`AppAccountsSync.tsx`](../../../apps/web-tools/src/trustchain/components/AppAccountsSync.tsx) — a
   **third full registration site** (its own `createAggregator`, `AggLocalState`, `localStateSelector`).
   It is also the only place to verify by hand, with several
   [web-tools tabs](../../../docs/ledger-sync/cookbook.md#test-on-the-web-tools-playground) as separate
   instances.
5. Changeset (`create-changeset`) and a line in
   [`scenarios.md`](../../../docs/ledger-sync/scenarios.md).
