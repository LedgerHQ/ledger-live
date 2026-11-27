# 6 · The watch loop

> How everything above runs continuously inside a Ledger Wallet instance. Code, in
> [`features/platform/wallet-sync/src`](../../features/platform/wallet-sync/src):
> [`hooks/useWalletSyncWatcher.ts`](../../features/platform/wallet-sync/src/hooks/useWalletSyncWatcher.ts)
> (what both apps run) ·
> [`internals/watchLoop.ts`](../../features/platform/wallet-sync/src/internals/watchLoop.ts) (one
> cycle, shared with the v1-shaped
> [`legacy/createWalletSyncWatchLoop.ts`](../../features/platform/wallet-sync/src/legacy/createWalletSyncWatchLoop.ts)
> that the web-tools playground uses) ·
> [`watchLoop/incrementalUpdates.ts`](../../features/platform/wallet-sync/src/watchLoop/incrementalUpdates.ts).

The watch loop is the lifecycle that ties [CloudSyncSDK](./04-cloud-sync-sdk.md) and the
[CloudSyncDataManager](./05-wallet-sync-data-manager.md) together so the app stays in sync
**automatically** — the user does nothing.

## Startup

```mermaid
flowchart TB
    s([Start Ledger Wallet]) --> q{Trustchain<br/>initialized?}
    q -->|No| e([END — nothing to sync])
    q -->|"Yes (key ring stream open)"| w["start watch loop<br/><i>after initialTimeout</i>"]
    w --> loop[["unified watch loop<br/>(repeats every pollingInterval)"]]
```

The loop only starts when the [Ledger Sync feature flag](./07-app-integration.md#feature-flags--entry-points)
is enabled **and** this instance is a key ring member: `keyRing.openStream(session)` returns a
stream (the instance has a member key and a key tree). In the apps, every pull and push runs on
that stream through `createKeyRingCloudSync`, which authenticates and encrypts with the key ring.

> [!NOTE]
> Timing is configurable via `watchConfig`. Code defaults: `initialTimeout` 1 s,
> `pollingInterval` 10 s, `userIntentDebounce` 1 s. (The original diagram showed 5 s / 10 s.)

## The unified watch loop

One iteration, guarded by a `pending` flag so iterations never overlap:

```mermaid
flowchart TB
    start([loop tick]) --> pull["PULL: cloudSync.pull(stream)<br/><i>incoming data → saveNewUpdate</i>"]
    pull --> local["localIncrementalUpdate()<br/><i>resolve any pending local work</i>"]
    local --> diff["diffLocalToDistant(local, latestDistant)"]
    diff --> has{hasChanges?}
    has -->|No| done([up to date — nothing to push])
    has -->|Yes| push["PUSH: cloudSync.push(stream, diff.nextState)<br/><i>→ saveNewUpdate</i>"]
    push --> done2([done])
    pull -. error .-> err[[Error handlers]]
    local -. error .-> err
    push -. error .-> err
```

**Error handling**: an error that `classifyKeyRingError` puts in `member-removed` or `outdated`
(v1 `TrustchainEjected` / `TrustchainOutdated`) triggers `onRefreshNeeded`, which
[restores or empties the trustchain](./02-trustchain-sdk.md#errors--automatic-recovery); any
other error goes to `onError`. The watcher then resets Ledger Sync on a `member-removed` or
`not-allowed` error.

> [!TIP]
> A **user intent** (rename, manual refresh, …) calls `onUserRefreshIntent()`, which reschedules
> the next tick to `userIntentDebounce` (≈1 s) instead of waiting a full `pollingInterval` — so
> the change propagates almost immediately. An optional WebSocket
> ([listenNotifications](./04-cloud-sync-sdk.md#listennotifications-optional)) can trigger a tick
> the moment another instance pushes.

## `saveNewUpdate` — applying an incoming update

`CloudSyncSDK.pull()` hands each [UpdateEvent](./04-cloud-sync-sdk.md#the-updateevent) to the
`saveNewUpdate` callback built by `makeSaveNewUpdate`. This is the glue that runs the data
manager and then asks the integration to persist via its own `saveUpdate`:

```mermaid
flowchart TB
    ev{event.type} -->|new-data| nd["resolve = resolveIncrementalUpdate(local, latest, data)<br/><i>async · delegated to modules (accounts does full sync)</i>"]
    nd --> hc{hasChanges?}
    hc -->|No| done([DONE])
    hc -->|Yes| ap["newLocalState = applyUpdate(local, resolve.update)<br/><i>sync · delegated to modules</i>"]
    ap --> su["saveUpdate(newLocalState, data, version)"]
    su --> done
    ev -->|pushed-data| sp["saveUpdate(data, version)"]
    ev -->|deleted-data| sd["saveUpdate(null, 0)"]
```

> [!IMPORTANT]
> `saveUpdate` is provided by **each integration** — it's where the result lands in the app's
> store (Redux for Desktop/Mobile, local React state for the web-tools). See
> [app integration](./07-app-integration.md#the-saveupdate-callback).

## `localIncrementalUpdate` — draining pending local work

`localIncrementalUpdate` is a variant of `saveNewUpdate` with **no incoming data**: it passes the
`latest` distant state as *both* the current and incoming state to `resolveIncrementalUpdate`.
Modules that have nothing local to do return early; modules with pending work act.

```mermaid
flowchart TB
    start(["localIncrementalUpdate()"]) --> res["resolveIncrementalUpdate(local, latest, incoming = latest)<br/><i>accounts: retry zombie nonImportedAccounts · accountNames: do nothing</i>"]
    res --> hc{hasChanges?}
    hc -->|No| done([DONE])
    hc -->|Yes| ap["applyUpdate → newLocalState"]
    ap --> su["saveUpdate(newLocalState, data, version)"] --> done
```

> [!NOTE]
> This exists because the `accounts` module stores failed imports as
> [`nonImportedAccountInfos`](./05-wallet-sync-data-manager.md#the-accounts-module). Like a
> garbage collector, these "zombies" must be periodically retried even when no new distant data
> arrives — that's the job of `localIncrementalUpdate` on every tick.
