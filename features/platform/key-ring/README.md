# @features/platform-key-ring

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Ledger Sync = `@features/platform-key-ring` (trust) + `@features/platform-wallet-sync` (data) + `@features/platform-ledger-sync` (product logic), with `@domain/entity-key-ring` and `@domain/entity-wallet-sync` (state). This package is the trust part. Dependency direction: `@features/platform-wallet-sync` and `@features/platform-ledger-sync` depend on it; among the Ledger Sync packages it depends only on `@domain/entity-key-ring`.

The trust package of Ledger Wallet: the only package that talks to the Ledger Key Ring Protocol.
Apps and features reach Ledger Sync trust through its protocol-agnostic API; today one adapter
runs it on the v1 SDK (`@ledgerhq/ledger-key-ring-protocol`), and a v2 adapter on the device-sdk
kit will replace it without changing the callers.

## What it exposes

| Export | Use |
|---|---|
| `KeyRingClient` | The port: activate (create or join), restore, list, add (QR pairing) and remove members, destroy, Cloud Sync streams, lifecycle, service status |
| `createKeyRingClient(config)` | Builds the app's client at the composition root, on the store's runtime; `client.forDeviceSession` binds it to one DIE device session |
| `keyRingRuntimeExtra`, `readKeyRingRuntime`, `KeyRingRuntimeMissingError` | The key ring runtime (the key store of the member key) in the store's thunk `extraArgument`, built once per store |
| `selectKeyRingSession` | The opaque session of this instance, passed to every client operation |
| `commitKeyRingTree`, `commitKeyRingMemberKey`, `importPersistedKeyRingState`, `resetKeyRingState`, `selectPersistedKeyRingState` | Store the opaque results, load and save the persisted state (opaque `KeyRingPersistedState`, same JSON as v1) |
| `KeyRingStream` | Authentication and encryption on one key tree stream, for Cloud Sync |
| `client.lifecycle` | `onKeyRotation(handler)` for the Cloud Sync re-encryption, `subscribe(listener)` for key rotated, member removed and reset |
| `createKeyRingIdentityProvider` | The `@ledgerhq/auth` identity provider for API authentication, on the store's runtime |
| `getKeyRingDeviceRequirement`, `getKeyRingDeviceInitialization` | What the device must provide (v1: the Ledger Sync app), and the device initialization: an app request, or an OS feature reported with `ledgerSyncDeviceUnsupportedFailure` |
| `KeyRingError` and subclasses, `classifyKeyRingError`, `isKeyRingError`, `toKeyRingError`, `keyRingErrorForDisplay` | Typed errors by category, and the error to hand to an error screen |
| `addMemberIntentDefinition`, `removeMemberIntentDefinition` and their types | Device intents for the Device Intent Executor |

Subpaths:

| Subpath | For |
|---|---|
| `@features/platform-key-ring/store` | The app store files: state actions, session selectors, persistence, the runtime extra, identity provider. It loads neither the client nor the device intents |
| `@features/platform-key-ring/v1` | The composition root only: `createKeyRingV1DeviceBridge`, how the v1 adapter reaches devices. A later adapter replaces it |
| `@features/platform-key-ring/devtools` | Debug screens: the raw protocol SDK, the debug store writes and the raw key readers (`selectDebugKeyRingTree`, `selectDebugKeyRingMemberKey`) |
| `@features/platform-key-ring/testing` | Tests: an auth challenge, an attestation, a fake client, a tree update fixture |

## Layout

| Folder | Holds |
|---|---|
| `schema.ts`, `types.ts`, `errors.ts` | The vocabulary: Zod schemas, inferred types and ports, typed errors |
| `client/` | The composition root: `createKeyRingClient` and the device session helpers |
| `state/` | The session selector, the runtime extra and the actions that store key ring results |
| `auth/` | The API auth identity provider |
| `device/` | The device requirement |
| `debug/` | The debug tools of the `devtools` subpath |
| `intents/` | The add and remove member device intents and their job states |
| `internals/` | Private: opaque handles, the runtime, the `KeyStore` port, the lifecycle hub, the v1 adapter |
| `store.ts`, `v1.ts`, `devtools.ts`, `testing.ts` | Subpath entries |

## Rules

- Key material never leaves this package. The member key and the Ledger Sync key sit in the
  `trustchain` slice of `@domain/entity-key-ring` (v1 storage), read only here through
  `selectKeyRingSecrets` and the internal `KeyStore` port. Results that change the key tree are
  opaque values the app stores with `commitKeyRingTree`.
- Every operation fails with `KeyRingError`s that keep the protocol message. Callers branch on
  `classifyKeyRingError`; error screens show `keyRingErrorForDisplay(error)`, which keeps the
  existing translations (both apps translate key ring errors by their v1 names).
- The member key lives behind the internal `KeyStore` port (handles, async, no export), held by the
  key ring runtime of the store. The thunks, the identity provider and the client reach it through
  that runtime, so a secure key storage replaces the v1 one without changing their signatures. The
  v1 runtime answers at once, so a boot import or a reset still stores the new key within its
  dispatch. The v1 SDK signs with the raw key, so the v1 adapter reads it inside `internals/v1`
  only.
- Both apps ban the v1 packages; this package is the only one that depends on them.
