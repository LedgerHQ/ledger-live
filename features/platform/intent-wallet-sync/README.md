# @features/platform-intent-wallet-sync

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Cross-platform [Device Intents](../device-intent/README.md) that run the Ledger Sync device
operations on the Device Intent Executor (DIE) session:

- **Add member** (`addMemberIntentDefinition`): `getOrCreateTrustchain`, which creates the
  trustchain, joins an existing one, or restores it. Its result is the SDK's `TrustchainResult`.
  The optional `onInitialResponse` input sees the seed's trustchains before anything is created or
  joined; a throw ends the run, and `NoTrustchainInitialized` ends it as `failed` with `no-trustchain`.
- **Remove member** (`removeMemberIntentDefinition`): `removeMember`, which rotates the trustchain
  key. Its result is the new `Trustchain`, which the app must store.

## How the device is reached

The Ledger Sync SDK (`@ledgerhq/ledger-key-ring-protocol`) has no device API of its own: `getSdk`
takes device access as an injected callback, named `withDevice`. Today the apps inject live-common's
legacy `withDevice`. Here, each intent input carries a `createSessionSdk` that the host app builds,
so no legacy `withDevice` is involved. The job calls it once per run, so a Retry after a refusal
reuses the same SDK on the same session.

`sessionWithDevice(createTransport)` is the `withDevice` the host injects. It ignores the device id
and runs each device job on a transport that `createTransport` returns when the job is subscribed,
one per subscription. An error from the job or from `createTransport`, a device disconnection
included, reaches the subscriber unchanged. The host creates a `DmkCompatTransport` bound to the
session's `dmk` and `sessionId`:

```ts
getSdk(
  setup.isMockEnv,
  setup.context,
  sessionWithDevice(() => new DmkCompatTransport(dmk, sessionId)),
  setup.lifecycle,
);
```

`setup` is the one the app's cached Ledger Sync SDK was built with, never the current flag: every
SDK of the app then talks to the same backend as the wallet sync loop, and a member a session adds
is one the loop knows.

This package imports nothing from `libs/`: it depends on `@features/platform-device-intent` and
takes the SDK, the Device Management Kit and RxJS as peers.

## Job states

Both intents emit the same `LedgerSyncJobState` union:

| `type`                         | Meaning                                                        | Terminal |
| ------------------------------ | -------------------------------------------------------------- | -------- |
| `pending`                      | The SDK is working without the user (network, APDUs).          | no       |
| `awaiting-device-confirmation` | The device waits for the user. The app locks the executor.     | no       |
| `processing`                   | The SDK finishes after a confirmation. Still locked.           | no       |
| `device-rejected`              | The user refused on the device. Carries `retry()`.             | no       |
| `completed`                    | Done. The result went through `onResult` just before.          | yes      |
| `failed`                       | Other errors. The app routes `reason` to its error screen.     | yes      |

Errors are job states, except a device disconnection, which errors the observable so the executor
shows its Disconnected screen, and an exception thrown by `onResult`, which errors the observable so
the job still ends.

`mapLedgerSyncErrorToFailure` reads `error.name`, not the class, so an error that lost its prototype
(serialized across a bridge, or thrown by another copy of the SDK) still maps to its reason:

| Error name                                  | `reason`                     |
| ------------------------------------------- | ---------------------------- |
| `TrustchainAlreadyInitialized`              | `already-secured-same-seed`  |
| `TrustchainAlreadyInitializedWithOtherSeed` | `already-secured-other-seed` |
| `TrustchainNotAllowed`                      | `not-allowed`                |
| `NoTrustchainInitialized`                   | `no-trustchain`              |
| anything else                               | `unknown`                    |

`UserRefusedOnDevice` is not a failure: `isUserRefusedOnDevice` routes it to `device-rejected`.

## Usage

Each app binds the definitions to its renderer and mounts its `DeviceIntentExecutor` with
`sourceFlow="ledger_sync"`, after `buildDeviceInitializationInput` opened or installed the Ledger
Sync device app:

```ts
import { createIntent } from "@features/platform-device-intent";
import { addMemberIntentDefinition } from "@features/platform-intent-wallet-sync";

const addMemberIntentLWMDefinition = { ...addMemberIntentDefinition, component: AddMemberComponentLWM };

const intent = createIntent(
  addMemberIntentLWMDefinition,
  { memberCredentials, currentTrustchain, createSessionSdk },
  { onResult: result => dispatch(setTrustchain(result.trustchain)) },
);
```

No app binds these intents yet. The rollout flags `lwmLedgerSyncDie` and `lwdLedgerSyncDie` gate them
once they do.
