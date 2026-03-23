# DeviceIntentExecutor — Internal Architecture

> Draft — LIVE-27995

## Overview

The `DeviceIntentExecutor` implementation is split into three layers, each with a
clear single responsibility. From outermost to innermost:

```mermaid
---
title: DeviceIntentExecutor — 3-layer split
---
%%{init: {'flowchart': {'nodeSpacing': 30, 'rankSpacing': 60, 'curve': 'basis'}}}%%
flowchart BT
    Caller["Caller screen / flow owner"]

    subgraph Executor["DeviceIntentExecutor (React component)"]
        direction TB
        ExDesc["Mounts the hook, renders UI<br/>based on the hook's returned state.<br/>Pure rendering shell.<br/>Callbacks reach the caller<br/>through the component's props."]
    end

    subgraph Hook["useDeviceIntentExecutor (React hook)"]
        direction TB
        HookDesc["Internal to the component.<br/>useEffects listen to props changes<br/>and decide which actions to trigger<br/>on the state machine.<br/>Observes the state machine<br/>and invokes the callback props."]
    end

    subgraph SM["DeviceIntentExecutorStateMachine"]
        direction TB
        SMDesc["Pure state machine orchestrating<br/>all executor lifecycle events.<br/>No React dependency.<br/>Fully testable in isolation."]
    end

    Caller <-->|"mounts with props<br/>(incl. callbacks)"| Executor
    Executor <-->|"passes props ↓<br/>returns state ↑"| Hook
    Hook -->|"actions<br/>(connect, setIntent,<br/>cancel, disable, …)"| SM
    SM -->|"state changes<br/>(observable)"| Hook

    style Caller fill:#616161,color:#fff
    style Executor fill:#1976d2,color:#fff
    style Hook fill:#2e7d32,color:#fff
    style SM fill:#f57c00,color:#fff
    style ExDesc fill:#42a5f5,color:#fff
    style HookDesc fill:#43a047,color:#fff
    style SMDesc fill:#ff9800,color:#fff
```

---

## Layer details

### 1. `DeviceIntentExecutor` — React component

**File:** `src/DeviceIntentExecutor.tsx`

The thinnest possible React component. A pure rendering shell with **zero
business logic or state management**. Its only job is:

- Accept `DeviceIntentExecutorProps` + `ExecutorPlatformConfiguration` (injected
  by the platform wrapper).
- Call `useDeviceIntentExecutor(...)` with those props.
- Render the appropriate UI based on the state returned by the hook:
  - **Connecting device** → render the platform-injected `DeviceConnectionComponent`.
  - **initializing context** → render the platform-injected
    `DeviceContextInitializerComponent`.
  - **Executing intent** → render `intent.component` with the current `jobState`
    and `extraProps`.
  - **Error / idle** → render nothing or a minimal fallback (TBD).

The caller screen mounts this component and passes props. It does not need to
know anything about the hook or the state machine underneath.

### 2. `useDeviceIntentExecutor` — React hook

**File:** `src/useDeviceIntentExecutor.ts`

The bridge between the React world (props, effects, callbacks) and the pure
state machine. Responsibilities:

| Concern                              | How                                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Props → actions**                  | `useEffect` hooks detect changes to `intent`, `requiredDeviceContext`, `enabled`, `cancelIntentRequestId` and decide which actions to trigger on the state machine. |
| **State machine → React state**      | Subscribes to the state machine's state (observable or callback), stores the latest state in `useState`, and returns it to the component for rendering.             |
| **State machine → caller callbacks** | When the machine's state changes, invokes `onExecutorStateChanged` and `onIntentJobStateChanged` (callback props passed through the component).                     |
| **Lifecycle**                        | Creates the state machine instance on mount, tears it down on unmount.                                                                                              |

The hook does **not** contain the transition logic itself. It translates
React lifecycle into imperative calls on the state machine and observation of
its state.

### 3. `DeviceIntentExecutorStateMachine` — pure state machine

**File:** `src/DeviceIntentExecutorStateMachine.ts`

The heart of the executor. Owns the full lifecycle state and transition logic.
Key design constraints:

- **No React dependency.** It can be instantiated and driven in a plain TS test
  with no JSDOM or React test renderer.
- **Deterministic transitions.** Given a state and an action, the next state is
  predictable and testable.
- **Observable state.** Exposes its current state via an observable (RxJS
  `BehaviorSubject`) or a listener pattern so the hook can subscribe.
- **Manages RxJS subscriptions** for intent jobs internally (subscribe on
  execute, unsubscribe on cancel / intent change / disable).

#### Implementation: XState v5

The state machine is implemented with **XState v5** (`xstate` package, added to the
pnpm workspace catalog). Rationale:

- **Formalized states and transitions** — the machine definition is a single,
  declarative object. Every valid state and event is explicit; invalid transitions
  are impossible by construction.
- **Auto-cancellation of invoked observables** — `fromObservable` actors are
  automatically unsubscribed when the invoking state is exited, which eliminates
  an entire class of subscription-leak bugs for intent jobs.
- **Visualizer** — the XState inspector / Stately Studio can render the machine
  live for debugging.

The machine is wrapped in a `DeviceIntentExecutorStateMachine<JobState, Input, ExtraProps>`
class that exposes typed public methods for every event and accepts
`StateMachineListeners` at construction for state observation.

---

## Data flow summary

```mermaid
---
title: DeviceIntentExecutor — Data flow
---
%%{init: {'flowchart': {'nodeSpacing': 20, 'rankSpacing': 50, 'curve': 'basis'}}}%%
flowchart LR
    subgraph CallerSide["Caller"]
        Props["props"]
        OnExState["onExecutorStateChanged"]
        OnJobState["onIntentJobStateChanged"]
    end

    subgraph Component["Component"]
        Render["render tree"]
    end

    subgraph HookSide["Hook"]
        Effects["useEffects"]
        Subscribe["observe SM"]
    end

    subgraph Machine["State Machine"]
        State["internal state"]
        JobSub["job subscription"]
    end

    Props -->|"mount + props"| Render
    Render -->|"passes props"| Effects
    Effects -->|"triggers actions"| State
    State -->|"emits state"| Subscribe
    Subscribe -->|"returns state"| Render
    Subscribe -->|"invokes callback props"| OnExState
    Subscribe -->|"invokes callback props"| OnJobState
    JobSub -->|"job observable events"| State

    style CallerSide fill:#616161,color:#fff
    style Component fill:#1976d2,color:#fff
    style HookSide fill:#2e7d32,color:#fff
    style Machine fill:#f57c00,color:#fff
    style Props fill:#757575,color:#fff
    style OnExState fill:#757575,color:#fff
    style OnJobState fill:#757575,color:#fff
    style Render fill:#42a5f5,color:#fff
    style Effects fill:#43a047,color:#fff
    style Subscribe fill:#43a047,color:#fff
    style State fill:#ff9800,color:#fff
    style JobSub fill:#ff9800,color:#fff
```

---

## File structure (planned)

```
libs/device-intent/src/
├── core.ts                              # ✅ exists — intent & device types
├── executor.ts                          # ✅ exists — executor props & state types
├── index.ts                             # ✅ exists — re-exports
├── DeviceIntentExecutor.tsx             # 🆕 React component (layer 1)
├── useDeviceIntentExecutor.ts           # 🆕 React hook (layer 2)
└── DeviceIntentExecutorStateMachine.ts  # 🆕 State machine (layer 3)
```

---

## State machine

### Transition summary

| From                           | Event                                        | Type                 | To                             |
| ------------------------------ | -------------------------------------------- | -------------------- | ------------------------------ |
| ●                              | start with initial intent + required context | caller               | Phase 1: Device connection     |
| Phase 1: Device connection     | error                                        | internal (component) | Connection Error               |
| Phase 1: Device connection     | device connected                             | internal (component) | Phase 2: Device initialization |
| Phase 1: Device connection     | terminate                                    | caller               | ◉                              |
| Connection Error               | user retry                                   | internal (component) | Phase 1: Device connection     |
| Phase 2: Device initialization | error                                        | internal (component) | initialization Error           |
| Phase 2: Device initialization | device context initialized                   | internal (component) | Phase 3: Intent execution      |
| Phase 2: Device initialization | change intent                                | caller               | Phase 2: Device initialization (self, updates stored intent) |
| Phase 2: Device initialization | device disconnected                          | internal (component) | Connection Error               |
| Phase 2: Device initialization | terminate                                    | caller               | ◉                              |
| initialization Error           | user retry                                   | internal (component) | Phase 2: Device initialization |
| Phase 3: Intent execution      | job emits error                              | internal (job sub)   | Intent Error                   |
| Phase 3: Intent execution      | intent stopped                               | caller               | Phase 4: Idle                  |
| Phase 3: Intent execution      | intent completed                             | internal (job sub)   | Phase 4: Idle                  |
| Phase 3: Intent execution      | device disconnected                          | internal (component) | Connection Error               |
| Phase 3: Intent execution      | change intent                                | caller               | Intent Error                   |
| Phase 3: Intent execution      | change required context                      | caller               | Intent Error                   |
| Phase 3: Intent execution      | terminate                                    | caller               | ◉                              |
| Intent Error                   | user retry (same intent)                     | internal (component) | Phase 3: Intent execution      |
| Intent Error                   | change intent                                | caller               | Phase 3: Intent execution      |
| Phase 4: Idle                  | change intent                                | caller               | Phase 3: Intent execution      |
| Phase 4: Idle                  | change required context                      | caller               | Phase 2: Device initialization |
| Phase 4: Idle                  | device disconnected                          | internal (component) | Connection Error               |
| Phase 4: Idle                  | terminate                                    | caller               | ◉                              |

---

## Open questions

### Hook-level orchestration of simultaneous prop changes

We haven't implemented the hook yet. When both `requiredContext` and `intent`
props change simultaneously, the order in which the hook dispatches
`setRequiredContext` and `setIntent` to the state machine is critical — wrong
ordering could trigger unnecessary errors (e.g. `setIntent` first from idle goes
to `intentExecution` with stale context, then `setRequiredContext` causes an
intentError).

With the `SET_INTENT` self-transition in `deviceInitialization`, the safe order
is **`setRequiredContext` first, then `setIntent`**: from idle,
`setRequiredContext` transitions to `deviceInitialization`, and then `setIntent`
just updates the stored intent without changing state. The hook's `useEffect`
design must enforce this ordering.
