# @features/platform-intent-wallet-sync

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Cross-platform [Device Intents](../device-intent/README.md) that run the Ledger Sync device
operations on the Device Intent Executor (DIE) session:

- **Add member** (`addMemberIntentDefinition`): `getOrCreateTrustchain`, which creates the
  trustchain, joins an existing one, or restores it. Its result is the SDK's `TrustchainResult`.
- **Remove member** (`removeMemberIntentDefinition`): `removeMember`, which rotates the trustchain
  key. Its result is the new `Trustchain`, which the app must store.

## How the device is reached

The Ledger Sync SDK (`@ledgerhq/ledger-key-ring-protocol`) talks to the device through a
`withDevice` function. Each intent input carries a `createSessionSdk` that the host app builds: it
returns an SDK whose `withDevice` wraps the DIE session in `DmkCompatTransport`. The job calls it
once per run, so a Retry after a refusal reuses the same SDK on the same session. The host also
passes the SDK context and, on desktop, its trustchain lifecycle.

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
