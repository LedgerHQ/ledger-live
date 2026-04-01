# @ledgerhq/device-intent

Shared types, helpers and the **Device Intent Executor** component for Ledger Wallet.

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

| Export                                                  | Description                                                           |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| `DeviceConnectionParams`                                | Declarative params for device selection                               |
| `DeviceConnectionResult`                                | Result of a device connection (DMK session + compat ID)               |
| `RequiresDerivation`                                    | Derivation requirements for a device context                          |
| `RequiredDeviceContext`                                 | Declarative description of the device state needed before a step runs |
| `DeviceExtractedContext`                                | Normalised info produced once the required context is established     |
| `Job<JobState, Input>`                                  | Execution logic for one step, returns `Observable<JobState>`          |
| `IntentDefinition<JobState, Input>`                     | Reusable, cross-platform definition of one step                       |
| `IntentPlatformDefinition<JobState, Input, ExtraProps>` | Platform-specific definition adding a UI component                    |
| `IntentListeners<JobState>`                             | Optional lifecycle callbacks attachable to an intent instance         |
| `Intent<JobState, Input, ExtraProps>`                   | Runtime instance passed to the executor                               |
| `createIntent(definition, input, listeners?)`           | Helper to instantiate an `Intent` from a platform definition          |

### Executor types (`src/executor.ts`)

| Export                                                   | Description                                                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `DeviceConnectionComponent`                              | React component type for the device connection UI                                                  |
| `DeviceContextInitializerComponent`                      | React component type for the device context initialisation UI                                      |
| `ErrorComponent`                                         | React component type for error screens (connection, initialisation, intent)                        |
| `InvalidOperationComponent`                              | React component type for the terminal invalid-operation screen                                     |
| `ExecutorPlatformConfiguration`                          | Groups all platform-injected UI components (connection, initialisation, errors, invalid-operation) |
| `ExecutorState`                                          | Discriminated union of executor lifecycle states                                                   |
| `DeviceIntentExecutorProps<JobState, Input, ExtraProps>` | Props for the `DeviceIntentExecutor` component                                                     |

## Usage Guide

### Mounting the executor

The executor is typically placed inside a bottom sheet (LWM) or modal (LWD).
Each platform provides a thin wrapper (`LwmDeviceIntentExecutor` /
`LwdDeviceIntentExecutor`) that injects the platform-specific UI components
(device connection, context initialiser, error screens). The caller screen
mounts that wrapper and passes all the required props:

```tsx
import { createIntent } from "@ledgerhq/device-intent";

function MyFlowScreen({ enabled, onDone }: Props) {
  const [intent, setIntent] = useState(() =>
    createIntent(myIntentPlatformDefinition, {
      /* input */
    }),
  );

  return (
    <LwmDeviceIntentExecutor
      enabled={enabled}
      deviceConnectionParams={{ acceptedDeviceModelIds: [] }}
      requiredDeviceContext={{
        appName: "Ethereum",
        dependencies: [],
        requireLatestFirmware: false,
        allowPartialDependencies: false,
      }}
      intent={intent}
      intentComponentExtraProps={{ title: "Sign transaction" }}
      onExecutorStateChanged={state => {
        /* track lifecycle */
      }}
      onIntentJobStateChanged={jobState => {
        /* react to progress */
      }}
      onIntentJobComplete={() => {
        /* advance flow */
      }}
      onIntentJobError={error => {
        /* handle error */
      }}
      cancellableUI={true}
      cancelIntentRequestId={undefined}
    />
  );
}
```

### Defining intents

Intents are defined in three layers, from most reusable to most specific:

#### 1. `IntentDefinition` -- shared, cross-platform logic

An `IntentDefinition` contains the `Job` function and execution metadata. The
job receives the device connection, extracted context and typed input, and
returns an `Observable<JobState>`.

**Important: model errors as `JobState` values, not observable errors.** A job
observable should **not** error (i.e. should not call `observer.error()`).
Instead, include an error variant in your `JobState` discriminated union (e.g.
`{ step: "error"; error: Error }`) and emit it as a regular `next` value.
This gives you full control over the error UI through the intent's `component`,
whereas an observable error triggers a generic `executingIntentError` phase
handled by the platform-injected `IntentErrorComponent`, which cannot be
customised per intent. Use `catchError` to convert thrown errors into emitted
error states.

**Be aware of `jobState: undefined` before the first emission.** When the
executor starts running a job, the `jobState` passed to the intent's UI
component is `undefined` until the observable emits its first value. If the
observable begins with asynchronous work (e.g. a device call or network
request), the component will render with `jobState: undefined` for a while.

You can handle this in two ways:

- **Emit an initial state synchronously** using `concat(of(initialState), ...)`
  or `startWith(initialState)` so the component immediately receives a
  meaningful state.
- **Handle `undefined` in the component** by rendering a generic loading
  indicator when `jobState` is `undefined`.

Example of a synchronous initial emission:

```typescript
import { concat, of, from } from "rxjs";
import { map, catchError } from "rxjs/operators";
import type { Job } from "@ledgerhq/device-intent";

type MyJobState =
  | { step: "waiting-for-confirmation" }
  | { step: "signed"; signedTxHex: string }
  | { step: "error"; error: Error };

const myJob: Job<MyJobState, { rawTxHex: string }> = ({ deviceConnectionResult, input }) =>
  concat(
    // Synchronous initial emission -- the UI immediately knows what to render
    of<MyJobState>({ step: "waiting-for-confirmation" }),
    // Async device work follows
    signOnDevice(deviceConnectionResult.sessionId, input.rawTxHex).pipe(
      map((hex): MyJobState => ({ step: "signed", signedTxHex: hex })),
      catchError(err =>
        of<MyJobState>({
          step: "error",
          error: err instanceof Error ? err : new Error(String(err)),
        }),
      ),
    ),
  );

const MyIntentDefinition: IntentDefinition<MyJobState, { rawTxHex: string }> = {
  label: "sign-transaction",
  requiresConnectedDevice: true,
  delegateDeviceLockStateHandlingToExecutor: true,
  job: myJob,
};
```

#### 2. `IntentPlatformDefinition` -- platform-specific UI

Extends the shared definition with a React component that renders the
`JobState` on a specific platform:

```tsx
const MobileSignTransactionView: React.FC<{
  jobState: MyJobState | undefined;
  extraProps: { title: string };
}> = ({ jobState, extraProps }) => {
  if (!jobState) return <Loading />;
  switch (jobState.step) {
    case "waiting-for-confirmation":
      return <DeviceConfirmation title={extraProps.title} />;
    case "signed":
      return <SuccessAnimation />;
    case "error":
      return <ErrorDisplay error={jobState.error} />;
  }
};

const MobileSignTransactionPlatformDef: IntentPlatformDefinition<
  MyJobState,
  { rawTxHex: string },
  { title: string }
> = {
  ...MyIntentDefinition,
  component: MobileSignTransactionView,
};
```

> Note: the `component` receives `jobState: JobState | undefined`. It is
> `undefined` before the first observable emission, so the component must
> handle that case (see the pitfalls section below).

#### 3. Runtime `Intent` via `createIntent()`

Before passing an intent to the executor, wrap the platform definition with
concrete input using `createIntent()`. Each call generates a new object with a
unique `uuid` (used for logging/debugging):

```typescript
const intent = createIntent(MobileSignTransactionPlatformDef, {
  rawTxHex: "0xabc...",
});
```

You can also attach optional lifecycle listeners directly on the intent (see
[Observability: callbacks](#observability-callbacks) for details):

```typescript
const intent = createIntent(
  MobileSignTransactionPlatformDef,
  {
    rawTxHex: "0xabc...",
  },
  {
    onJobComplete: () => {
      /* intent-specific reaction */
    },
  },
);
```

**You must call `createIntent()` to produce a new object when you want the
executor to start a new intent.** The executor detects intent changes by
**reference equality**. Reusing the same object reference means the executor
sees no change and will not re-execute.

### Orchestrating a multi-intent flow

The caller owns the business flow. The recommended pattern is an
**orchestration hook** that:

1. Maintains flow state (current phase, terminal outcomes).
2. Reacts to executor callbacks (`onIntentJobStateChanged`,
   `onIntentJobComplete`, `onIntentJobError`) to decide the next intent.
3. Returns the current `intent`, `requiredDeviceContext`,
   `intentComponentExtraProps`, and the callback props for the executor.

A simplified example for a two-step flow (sign then broadcast):

```tsx
type FlowPhase =
  | { step: "signing"; intent: Intent<SignJobState, SignInput, ExtraProps> }
  | { step: "broadcasting"; intent: Intent<BroadcastJobState, BroadcastInput, ExtraProps> };

type FlowState =
  | { type: "running"; phase: FlowPhase }
  | { type: "done"; txHash: string }
  | { type: "error"; error: Error };

function useMyFlowOrchestration({ enabled, quote, platformDefs, deps }) {
  const [state, setState] = useState<FlowState>(() => ({
    type: "running",
    phase: {
      step: "signing",
      intent: createIntent(platformDefs.sign, { rawTxHex: deps.buildTx(quote) }),
    },
  }));

  // Store results from the running job -- do NOT transition from here.
  const lastJobStateRef = useRef<unknown>(null);
  const onIntentJobStateChanged = useCallback(jobState => {
    lastJobStateRef.current = jobState;
  }, []);

  // Advance the flow only once the job has completed.
  const onIntentJobComplete = useCallback(() => {
    if (state.type !== "running") return;
    const jobState = lastJobStateRef.current;
    switch (state.phase.step) {
      case "signing": {
        if (jobState?.step === "signed") {
          setState({
            type: "running",
            phase: {
              step: "broadcasting",
              intent: createIntent(platformDefs.broadcast, {
                signedTxHex: jobState.signedTxHex,
              }),
            },
          });
        }
        break;
      }
      case "broadcasting": {
        if (jobState?.step === "confirmed") {
          setState({ type: "done", txHash: jobState.txHash });
        }
        break;
      }
    }
  }, [state, platformDefs, deps]);

  // ... return executor props derived from state
}
```

The screen renders the executor when the flow is running, and terminal
success/error UI otherwise:

```tsx
function MyFlowScreen({ enabled, quote, onClose }) {
  const { state, executorProps } = useMyFlowOrchestration({ enabled, quote, ... });

  if (state.type === "done") return <SuccessScreen txHash={state.txHash} />;
  if (state.type === "error") return <ErrorScreen error={state.error} />;

  return <LwmDeviceIntentExecutor {...executorProps} />;
}
```

### Job completion contract

The executor's state machine enforces a strict rule: **no job may be running
when the caller changes `intent` or `requiredDeviceContext`**. The job
observable must have completed (or errored) first. If either prop changes
while a job is still active, the state machine enters the terminal
`invalidOperation` state -- an unrecoverable dead end that signals a bug in
the caller.

In practice this means:

- **`onIntentJobComplete` is the definitive signal** that a job has finished
  and it is safe to transition to the next phase. Always drive phase
  transitions from this callback.
- **Use `onIntentJobStateChanged` to capture intermediate results** (e.g. a
  signed transaction hex), but do **not** set a new intent or context from it
  -- the job is still running at that point.
- **Interactive jobs must complete before the orchestrator advances.** If a
  job waits for user action (e.g. a "Continue" button), give it a completion
  signal -- a `Subject<never>` passed as input. The button handler calls
  `subject.complete()`, which completes the job observable, which triggers
  `onIntentJobComplete`, which drives the orchestrator forward. Do **not** use
  `NEVER` as a job tail; it prevents the observable from ever completing,
  forcing the orchestrator to bypass the completion contract.

A correct interactive job pattern:

```typescript
import { type Subject, type Observable, concat, of } from "rxjs";

type ConfirmJobState = { type: "waiting" };
type ConfirmInput = { done$: Subject<never> };

const confirmJob: Job<ConfirmJobState, ConfirmInput> = ({ input }) =>
  concat(of<ConfirmJobState>({ type: "waiting" }), input.done$);
```

The orchestrator creates the Subject and wires the button:

```typescript
const done$ = new Subject<never>();
const intent = createIntent(confirmDef, { done$ });
// In extraProps or jobState callback:
const onContinue = () => done$.complete();
```

When the user presses Continue, `done$.complete()` completes the observable,
the executor fires `onIntentJobComplete`, and the orchestrator advances.

### Changing `requiredDeviceContext` and `intent` together

When a flow step requires both a different app context (e.g. switching from
Ethereum to Bitcoin) and a different intent, **both props must change in the
same React render** -- i.e. from a single state update.

The executor internally guarantees that when both change simultaneously,
`setRequiredContext` is dispatched to the state machine before `setIntent`.
From idle this produces: idle -> `deviceInitialization` (via context change),
then the intent change is absorbed as a self-transition that updates the stored
intent without changing state. This is safe.

If they change in **separate renders**, the executor may enter an inconsistent
state. For example, changing the intent alone from idle triggers
`intentExecution` with the old (stale) context; then changing the context
causes an `intentError`.

```typescript
// CORRECT -- single state update, both values change in one render
setState({
  type: "running",
  phase: {
    step: "next-phase",
    intent: createIntent(nextPlatformDef, nextInput),
    requiredContext: { appName: "Bitcoin", dependencies: [], ... },
  },
});

// WRONG -- async work between updates causes two separate renders
setIntent(createIntent(nextPlatformDef, nextInput));
const data = await fetchSomething(); // <-- forces a new render boundary
setRequiredContext({ appName: "Bitcoin", dependencies: [], ... });
```

> Note: in React 18+, two synchronous `setState` calls in the same event
> handler are batched into a single render, so that specific case is safe.
> The danger arises when an `await`, `setTimeout`, or other async boundary
> separates them -- each call then triggers its own render with only one
> prop changed.

### Observability: callbacks

There are two levels of callbacks for job lifecycle events:

#### Executor-level callbacks (on `DeviceIntentExecutorProps`)

The executor reports progress and lifecycle changes through callback props:

| Callback                            | Fires when                                                                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onExecutorStateChanged(state)`     | The executor transitions between lifecycle phases (`connectingDevice`, `initializingDeviceContext`, `executingIntent`, `idle`, and their error variants). |
| `onIntentJobStateChanged(jobState)` | The running job's observable emits a new `JobState` value.                                                                                                |
| `onIntentJobComplete()`             | The job observable completes (no more emissions). The executor transitions to `idle`.                                                                     |
| `onIntentJobError(error)`           | The job observable errors. The executor transitions to `executingIntentError`.                                                                            |

All callbacks use refs internally, so the executor always calls the **latest**
version of each callback without needing to be recreated when the callback
identity changes.

#### Intent-level callbacks (on `Intent`)

Each intent instance can optionally carry its own lifecycle callbacks:

| Callback                      | Fires when                                       |
| ----------------------------- | ------------------------------------------------ |
| `onJobStateChanged(jobState)` | The job observable emits a new `JobState` value. |
| `onJobComplete()`             | The job observable completes.                    |
| `onJobError(error)`           | The job observable errors.                       |

These are set via the optional `listeners` argument to `createIntent()`:

```typescript
const intent = createIntent(
  myDef,
  { derivationPath: "44'/60'/0'/0/0" },
  {
    onJobStateChanged: state => {
      /* intent-specific reaction */
    },
    onJobComplete: () => {
      /* advance to next phase */
    },
  },
);
```

**Firing order:** intent-level callbacks fire **before** executor-level
callbacks. This lets an intent-specific handler (e.g. storing a derived
address) run before a cross-cutting executor callback reads it.

Intent-level callbacks are useful for orchestrating multi-intent flows where
each phase needs its own reaction logic, while executor-level callbacks handle
cross-cutting concerns (updating global state, logging, debug UI).

### Cancelling an intent

To cancel the currently running job, set `cancelIntentRequestId` to a new
value (typically a UUID). The executor stops the job observable, transitions to
idle, and the `lastIntentSnapshot` preserves the job state at the time of
cancellation.

```typescript
const [cancelId, setCancelId] = useState<string | undefined>(undefined);

const cancelCurrentIntent = useCallback(() => {
  setCancelId(crypto.randomUUID());
}, []);

// Pass cancelId as cancelIntentRequestId to the executor
```

Setting the **same** value again is a no-op. Each cancellation request
requires a **new** value.

### Enabling / disabling

The `enabled` prop controls the executor's lifecycle:

- **`false`** -- the executor is hidden and inactive. Any running job is
  terminated and the internal state machine is destroyed. The hook returns
  `null`.
- **`true`** -- the executor starts fresh from the device connection phase.

Toggling is safe and idempotent. A common pattern is tying `enabled` to the
visibility of the bottom sheet / modal.

### Idle state and `lastIntentSnapshot`

When a job completes or is cancelled the executor transitions to **idle**.
During idle, the executor renders the **last intent's component** with the
**last emitted `jobState`** and the current `intentComponentExtraProps`. This
is stored in a `lastIntentSnapshot`.

This behaviour allows the UI to display a "success" or "completion" screen
from the previous intent while the caller decides the next step (e.g. setting
a new intent, closing the flow, or showing terminal UI).

If no intent has ever executed, `lastIntentSnapshot` is `null` and the
executor renders nothing during idle.

### Advanced: interactive jobs with callbacks in `JobState`

`JobState` does not have to be serializable -- it can contain functions.
Because `JobState` is just a TypeScript type flowing from the observable to the
component via React state, it can carry callbacks. This enables interactive
patterns where the job pauses and emits a callback for the UI to resume it.

For example, a job that waits for user confirmation before broadcasting:

```typescript
type MyJobState =
  | { step: "waiting-for-confirmation"; onConfirm: () => void }
  | { step: "broadcasting" }
  | { step: "done"; txHash: string };

const myJob: Job<MyJobState, { signedTxHex: string }> = ({ input }) =>
  new Observable<MyJobState>(async subscriber => {
    let resolveConfirm: () => void;
    const confirmed = new Promise<void>(r => {
      resolveConfirm = r;
    });

    subscriber.next({
      step: "waiting-for-confirmation",
      onConfirm: () => resolveConfirm(),
    });

    await confirmed;
    subscriber.next({ step: "broadcasting" });

    const txHash = await broadcast(input.signedTxHex);
    subscriber.next({ step: "done", txHash });
    subscriber.complete();
  });
```

The intent component renders a confirmation button that calls
`jobState.onConfirm()`, creating a two-way communication channel between the
job and the UI without any external state.

### Pitfalls and common mistakes

#### Not handling `jobState: undefined` in the intent component

The intent component receives `jobState: undefined` until the job observable
emits its first value. If neither the job emits synchronously nor the
component handles the `undefined` case, the UI may break or render nothing.

Either emit an initial state synchronously in the job:

```typescript
const job: Job<MyState, MyInput> = ({ input }) =>
  concat(
    of<MyState>({ step: "loading" }),  // synchronous, immediate
    fetchData(input).pipe(map(...)),   // async work follows
  );
```

Or handle `undefined` in the component:

```tsx
if (!jobState) return <GenericLoadingIndicator />;
```

#### Transitioning while a job is still running

If the orchestrator changes `intent` or `requiredDeviceContext` while a job
observable is still active (hasn't completed or errored), the state machine
enters the terminal `invalidOperation` state. This is unrecoverable and
requires restarting the executor (`enabled` toggled off and on).

When this happens, the executor renders the platform-injected
`InvalidOperationComponent`, which should explain the bug state and offer a
close or restart path.

Common causes:

- Advancing the flow from `onIntentJobStateChanged` instead of
  `onIntentJobComplete`. The job may still be emitting when the state callback
  fires.
- Using `NEVER` as a job tail for interactive intents. The observable never
  completes, so the orchestrator is forced to bypass the completion contract.
  Use a `Subject<never>` completion signal instead (see
  [Job completion contract](#job-completion-contract)).
- Calling a navigation callback (e.g. `goTo()`) from a UI button without
  first completing the job.

**Fix:** always ensure the job observable completes before transitioning. For
interactive jobs, complete a `Subject<never>` from the button handler. For
async jobs, let the observable complete naturally and react in
`onIntentJobComplete`.

#### Changing `requiredDeviceContext` and `intent` in separate renders

If both need to change (e.g. switching app context for the next intent), they
**must** change in a single state update so they appear in the same render.
Otherwise the executor may briefly execute the new intent with stale context,
then error when the context update arrives. See
[Changing `requiredDeviceContext` and `intent` together](#changing-requireddevicecontext-and-intent-together)
above for correct and incorrect examples.

#### Reusing the same `Intent` object reference

The hook detects intent changes by **reference equality**. If you mutate the
input on an existing object and pass it back, the executor will not see a
change and will not re-execute. Always call `createIntent()` to produce a
fresh object reference.

#### Forgetting `createIntent()`

Passing an `IntentPlatformDefinition` directly to the executor (without
wrapping it via `createIntent()`) will fail the TypeScript type check because
it is missing the `uuid` and `input` fields.

#### Heavy job emissions causing render pressure

Every observable emission triggers a React state update. Jobs that emit very
frequently (e.g. progress ticks every millisecond) will cause excessive
re-renders. Throttle or debounce emissions inside the job observable (e.g.
using RxJS `throttleTime` or `sampleTime`) to keep rendering performant.

#### Letting the job observable error instead of emitting an error state

If the job observable calls `observer.error()` (or throws), the executor
transitions to the generic `executingIntentError` phase, which renders the
platform-injected `IntentErrorComponent`. This component is shared across all
intents and cannot display intent-specific error details or recovery actions.

**Fix:** model errors as a variant of `JobState` and catch all exceptions
inside the observable:

```typescript
const job: Job<MyState, MyInput> = ({ input }) =>
  concat(
    of<MyState>({ step: "loading" }),
    doWork(input).pipe(
      map((result): MyState => ({ step: "done", result })),
      catchError(err =>
        of<MyState>({
          step: "error",
          error: err instanceof Error ? err : new Error(String(err)),
        }),
      ),
    ),
  );
```

This way, the intent's own `component` renders the error with full context.

#### Non-idempotent `cancelIntentRequestId`

Setting `cancelIntentRequestId` to the **same** value twice does nothing. Each
cancellation request must use a **new** value (e.g. `crypto.randomUUID()`).

---

## How It Works

> For the full internal architecture, see
> [`docs/architecture.md`](./docs/architecture.md).

### Three-layer architecture

The implementation is split into three layers, each with a single
responsibility:

1. **`DeviceIntentExecutor`** (`src/DeviceIntentExecutor.tsx`) -- A thin React
   component. A pure rendering shell with zero business logic. It calls the
   hook, then renders the appropriate platform-injected component based on the
   returned phase.

2. **`useDeviceIntentExecutor`** (`src/useDeviceIntentExecutor.ts`) -- A React
   hook that bridges the React world (props, effects, callbacks) with the
   state machine. It translates prop changes into imperative SM actions and
   observes SM state changes to drive React state and invoke caller callbacks.

3. **`DeviceIntentExecutorStateMachine`**
   (`src/DeviceIntentExecutorStateMachine.ts`) -- A pure state machine
   implemented with XState v5. No React dependency. Fully testable in
   isolation. Owns all transition logic and manages job observable
   subscriptions internally.

### State machine lifecycle

The machine progresses through four main phases, each with a corresponding
error state:

```
deviceConnection --> deviceInitialization --> intentExecution --> idle
       |                    |                       |              |
       v                    v                       v              |
  connectionError   initializationError       intentError          |
                                                    ^              |
                                                    |              |
                                           (context/intent change) |
                                                    |              |
                                                    +-<--<--<------+
```

Key transitions:

- From **idle**, changing the intent starts a new `intentExecution`.
- From **idle**, changing the required context returns to
  `deviceInitialization`.
- From any connected state, a device disconnection returns to
  `connectionError`.
- Error states support retry, which returns to the preceding phase.

See the full transition table and state machine diagram in
[`docs/architecture.md`](./docs/architecture.md).

### XState v5 and auto-cancellation

The state machine uses XState's `fromObservable` actor to invoke job
observables. When the machine exits the `intentExecution` state (due to
completion, error, intent change, disconnection, or cancellation), XState
**automatically unsubscribes** from the observable. This eliminates an entire
class of subscription-leak bugs.

### Hook orchestration of simultaneous prop changes

The hook uses a **single combined `useEffect`** watching both
`requiredDeviceContext` and `intent`. When both change in the same render, it
dispatches `setRequiredContext` **first**, then `setIntent`. This ordering
guarantee ensures safe transitions from idle (context change moves to
`deviceInitialization`; the intent change is absorbed as a self-transition
that updates the stored intent without changing state).

### Callback refs for freshness

Callback props (`onExecutorStateChanged`, `onIntentJobStateChanged`, etc.) are
stored in refs. The state machine listeners are created once at SM construction
and read from these refs, so they always call the **latest** callback without
needing to recreate the SM when callbacks change identity.

### Device disconnection monitoring

A dedicated `useEffect` subscribes to the DMK device session state observable.
When the device status becomes `NOT_CONNECTED`, the hook dispatches
`deviceDisconnected` to the state machine, which transitions to
`connectionError` from any connected state. The subscription is cleaned up and
recreated whenever the connection result changes.

---

## Installation

This is an internal package. It is available to other packages in the monorepo via:

```json
{
  "dependencies": {
    "@ledgerhq/device-intent": "workspace:*"
  }
}
```
