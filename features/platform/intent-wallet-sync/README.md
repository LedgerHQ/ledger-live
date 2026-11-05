# @features/platform-intent-wallet-sync

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

Cross-platform [Device Intents](../device-intent/README.md) that run the Ledger Sync device
operations on the Device Intent Executor (DIE) session:

- **Add member** (`addMemberIntentDefinition`): `getOrCreateTrustchain`, which creates the
  trustchain, joins an existing one, or restores it. Its result is the SDK's `TrustchainResult`.
- **Remove member** (`removeMemberIntentDefinition`): `removeMember`, which rotates the trustchain
  key. Its result is the new `Trustchain`.

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
| `awaiting-device-confirmation` | The device waits for the user. Carries the model and name.     | no       |
| `device-rejected`              | The user refused on the device. Carries `retry()`.             | no       |
| `completed`                    | Done. The result went through `onResult` just before.          | yes      |
| `failed`                       | Any other error, with a `reason` from the table below.         | yes      |

Errors are job states, never observable errors. A disconnection reaches the executor through its own
session monitoring, which shows its Disconnected screen.

`mapLedgerSyncErrorToFailure` reads `error.name`, as the apps do today:

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

The apps' bindings live in `apps/*/src/mvvm/features/WalletSync/deviceIntents/`. The
`@devtools/intent-wallet-sync` tool launches both intents and logs their job states.
