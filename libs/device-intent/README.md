# @ledgerhq/device-intent

Shared types and helpers for the **Device Intent Executor** in Ledger Wallet.

> **Work in progress** -- This package currently contains only the type
> definitions and the `createIntent` helper. The `DeviceIntentExecutor`
> component implementation is not available yet.

See the [ADR: Device Intent Executor component](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6852083917) for the full design rationale.

## What is a Device Intent?

Many Ledger Wallet flows require one or more interactions with a connected
device: signing a transaction, approving a token, broadcasting, fetching data,
etc. A **device intent** is a typed, observable step that runs on (or alongside)
a connected Ledger device.

Each intent is defined in three layers:

1. **`IntentDefinition`** -- reusable, cross-platform logic: a label, execution
   flags and a `Job` function that receives the device connection / context and
   returns an `Observable` of typed state updates.
2. **`IntentPlatformDefinition`** -- extends the definition with a React
   component that renders the job's state on a specific platform (LWM or LWD).
3. **`Intent`** -- a runtime instance created from a platform definition and
   concrete input via `createIntent()`. This is what is actually passed to the
   executor.

## What is the Device Intent Executor?

The **Device Intent Executor** is a shared React component that centralises
device handling within Ledger Wallet flows. It is mounted by a caller screen
and is responsible for:

- **Device selection & connection** -- selecting a device and establishing a DMK
  session (via a platform-injected `DeviceConnectionComponent`).
- **Device context initialisation** -- installing / opening an app, performing
  derivation, etc. (via a platform-injected
  `DeviceContextInitializerComponent`).
- **Intent execution** -- subscribing to the current intent's `Job` observable
  and rendering its state through the intent's `component`.
- **Device runtime concerns** -- handling disconnects, lock state, retries and
  context switches so that individual jobs don't have to.

The caller retains ownership of the business flow: it decides which intent is
current, when the required context changes, and when the flow is done. The
executor standardises the difficult runtime concerns that are common to every
device-centric flow.

## Exports

### Core types (`src/core.ts`)

| Export | Description |
| --- | --- |
| `DeviceConnectionParams` | Declarative params for device selection |
| `DeviceConnectionResult` | Result of a device connection (DMK session + compat ID) |
| `RequiresDerivation` | Derivation requirements for a device context |
| `RequiredDeviceContext` | Declarative description of the device state needed before a step runs |
| `DeviceExtractedContext` | Normalised info produced once the required context is established |
| `Job<JobState, Input>` | Execution logic for one step, returns `Observable<JobState>` |
| `IntentDefinition<JobState, Input>` | Reusable, cross-platform definition of one step |
| `IntentPlatformDefinition<JobState, Input, ExtraProps>` | Platform-specific definition adding a UI component |
| `Intent<JobState, Input, ExtraProps>` | Runtime instance passed to the executor |
| `createIntent(definition, input)` | Helper to instantiate an `Intent` from a platform definition |

### Executor types (`src/executor.ts`)

| Export | Description |
| --- | --- |
| `DeviceConnectionComponent` | React component type for the device connection UI |
| `DeviceContextInitializerComponent` | React component type for the device context initialisation UI |
| `ExecutorPlatformConfiguration` | Groups both platform-injected components |
| `ExecutorState` | Discriminated union of executor lifecycle states |
| `DeviceIntentExecutorProps<JobState, Input, ExtraProps>` | Props for the `DeviceIntentExecutor` component |

## Installation

This is an internal package. It is available to other packages in the monorepo via:

```json
{
  "dependencies": {
    "@ledgerhq/device-intent": "workspace:*"
  }
}
```
