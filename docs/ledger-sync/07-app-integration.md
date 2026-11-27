# 7 · App integration (Desktop & Mobile)

> How Ledger Wallet Desktop (LWD) and Mobile (LWM) run Ledger Sync. Code: three packages the
> apps share, and a thin layer under `src/mvvm/features/WalletSync/` in each app.

The apps never import the LKRP libraries. They reach Ledger Sync through three packages, and
both apps ban the LKRP imports with a lint rule that names the replacement:

| Package | Owns |
|---|---|
| [`@features/platform-key-ring`](../../features/platform/key-ring) | Trust: the `KeyRingClient` port and its v1 adapter over the [TrustchainSDK](./02-trustchain-sdk.md), the device intents, the API auth identity provider, the key rotation lifecycle. The only package that depends on LKRP. |
| [`@domain/entity-key-ring`](../../domain/entity/key-ring) | The `trustchain` slice: same Redux key and same persisted shape as before, plus the selectors features read. |
| [`@features/platform-wallet-sync`](../../features/platform/wallet-sync) | The [watch loop](./06-watch-loop.md) and the Cloud Sync client both apps share, as hooks with ports. |

The public API is protocol-agnostic, so a later LKRP version replaces the adapter inside
`@features/platform-key-ring` without touching the apps. The package
[README](../../features/platform/key-ring/README.md) and the `KeyRingClient` JSDoc are the
reference.

## Sessions and opaque results

Apps never read the member key or the Ledger Sync key. They read a **session** and hand it back:

```ts
const session = useSelector(selectKeyRingSession); // opaque, stable until the slice changes
const sessionClient = keyRing.forDeviceSession({ dmk, sessionId }); // one DIE run
const { tree, outcome } = await sessionClient.activate(session, { callbacks });
dispatch(commitKeyRingTree(tree)); // the only way a tree update reaches the store
```

- Failures are typed `KeyRingError`s; branch with `classifyKeyRingError` and show them with
  `keyRingErrorForDisplay`, which keeps the existing translations ([errors](./errors.md)).
- Results that change the key tree (`activate`, `restore`, `removeMember`, `hostPairing`,
  `joinPairing`) are opaque updates, stored with `commitKeyRingTree` / `commitKeyRingMemberKey`.
- Features outside Ledger Sync (post onboarding, Add Account, Contacts, Onboarding, analytics)
  read a meaning with the semantic selectors of `@domain/entity-key-ring`:
  `selectIsLedgerSyncActive`, `selectIsKeyRingMember`, `selectKeyRingTreeId`,
  `selectHasKeyRingMemberKey`. `selectKeyRingSecrets` is banned in the apps.

## The wiring

Each app mounts a `<WalletSyncProvider>` near the root (LWD `renderer/Default.tsx`, LWM
`AppProviders.tsx`). Its `useWatchWalletSync()` is a thin adapter over two shared hooks:

1. `useKeyRingCloudSync(ports)` builds the Cloud Sync client on the key ring streams (also used
   by `useDestroyTrustchain`);
2. `useWalletSyncWatcher(ports)` runs the loop while this instance is a member, resets Ledger
   Sync when the key ring reports `member-removed` or `not-allowed`, and returns
   `{ visualPending, walletSyncError, onUserRefresh }`.

The app's ports are the pieces only it has:

| Port | Desktop / Mobile implementation |
|---|---|
| `walletsync` | `createWalletsync` from `libs/live-wallet` (needs `getAccountBridge`, the bridge cache, blacklisted tokens). |
| Selectors | Module-level functions over Redux: local state (**LWD** `state.accounts`, **LWM** `state.accounts.active`), `walletSyncState { data, version }`. A new function each render would restart the loop. |
| `saveUpdate` | The dispatch list below. |
| `onRefreshNeeded(session)` | `keyRing.restore(session)` then `commitKeyRingTree`; on `member-removed` (and `not-allowed` on LWM) `resetKeyRingState()` plus the deactivation event. |
| `walletSyncFeature`, `keyRing`, `session` | The flag object, the cached client, `useSelector(selectKeyRingSession)`. |

### The `saveUpdate` callback

The bridge from sync results back into the app store. On an incoming update it dispatches:

```ts
dispatch(walletSyncUpdate({ data, version })); // persist distant state + version
if (newLocalState) {
  dispatch(setNonImportedAccounts(newLocalState.accounts.nonImportedAccountInfos));
  dispatch(bulkSetAccountNames(newLocalState.accountNames));
  dispatch(setContacts(newLocalState.contacts));
  dispatch(updateRecentAddresses(newLocalState.recentAddresses));
  dispatch(replaceAccounts(newLocalState.accounts.list)); // last: triggers the DB save
}
```

### The key ring client

Each app caches one client at module level, built on first use with
`createKeyRingClient({ mock, instanceName, apiBaseUrl, deviceBridge })`; the URLs come from the
`ledgerKeyRing` switch of the app config, through `useLedgerSyncBackends` of
`@features/platform-ledger-sync`, and the application id (`16`) lives in the package. Device intents
run on the client bound to their DMK session with `client.forDeviceSession`. The device bridge
comes from `createKeyRingV1DeviceBridge` (`@features/platform-key-ring/v1`), which the
composition root alone imports: it gets the app's `withDevice` and the `DmkCompatTransport` of a
session, both from `libs/`.

Desktop calls `registerRotationReencryption(client, ...)` of `@features/platform-wallet-sync`, so that on a
[key rotation](./02-trustchain-sdk.md#key-rotation-on-member-removal) the Cloud Sync data moves
to the new key. Mobile does not register it yet.

### Store, persistence and API auth

- The root reducer mounts the slice of `@domain/entity-key-ring` under `trustchain`.
- Each store spreads `keyRingRuntimeExtra({ getState })` (`@features/platform-key-ring/store`)
  into its thunk `extraArgument`: the key ring runtime holds the key store of the member key. The
  key ring thunks, the identity provider and the client (`useKeyRingRuntime` of
  `@features/platform-ledger-sync`) read that one runtime.
- At boot, `dispatch(importPersistedKeyRingState(persisted))` validates the stored member key and
  generates a new one when it is missing or invalid, within the dispatch.
- LWD persists `app.trustchain` on `isKeyRingAction`; LWM persists the `trustchain` key. Both
  write `selectPersistedKeyRingState`.
- The `@shared/auth` middleware builds `AuthSDK` with
  `createKeyRingIdentityProvider(keyRingRuntime, () => selectKeyRingSession(getState()))`
  (flags `lwdAuth` / `lwmAuth`).

## Feature flags & entry points

| | Desktop | Mobile |
|---|---|---|
| Feature flag | `lldWalletSync` | `llmWalletSync` |
| Accounts source | `state.accounts` | `state.accounts.active` |
| Manual refresh | top-bar `ActivityIndicator` | `RefreshControl` (pull-to-refresh) |
| Activation entry | Settings entry point + `WalletSync/Drawer` | `Settings/General/WalletSyncRow` + `ActivationDrawer` |

The activation/management UI is a multi-flow drawer: **Activation**, **Synchronize** (add an
instance, incl. [QR-code](./03-qr-code-protocol.md)), **ManageInstances**, **ManageBackup**. It
is backed by a `walletSync` UI reducer (flow/step/drawer visibility), separate from the synced
`wallet` data slice. The device steps run the `addMemberIntentDefinition` and
`removeMemberIntentDefinition` intents of `@features/platform-key-ring`.

> [!NOTE]
> `useDestroyTrustchain` calls `keyRing.destroy(session)`, which
> [closes only the Ledger Sync application](./02-trustchain-sdk.md#deactivating-ledger-sync-per-application-close),
> so other applications on the same trustchain root (e.g. the wallet-cli ring) survive.

> [!TIP]
> "One identity = one Ledger Wallet instance." Because the watch loop is per-instance, the
> [web-tools playground](./cookbook.md#test-on-the-web-tools-playground) can simulate many
> instances at once (one per browser tab) to test propagation between members.
