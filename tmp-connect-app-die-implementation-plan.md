# Connect App in DIE — Implementation Plan

## Context

This plan covers the integration of the three overlooked connect-app requirements into the Device Intent Executor (DIE) framework:

1. **Device deprecation** — config-driven pre-intent gate (warn / block / skip)
2. **Required context derivation from account input** — shared builder from rich domain input to `DeviceContextInitialization`
3. **Wrong-device check** — post-derivation validation before intent execution, while remaining explicitly skippable for callers that intentionally bypass it

It is based on:

- [Connect App in DIE study](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6974111840)
- [Connect App UI spec](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6974144593)
- [Connect App - product specification (current implementation)](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6974275662)
- The existing `libs/device-intent` implementation
- The existing `migration.md` in `libs/ledger-live-common/src/hw/actions/`

Behavioral parity target for this plan:

- Match the current **DMK-enabled** connect-app path (`isLdmkConnectAppEnabled === true`) in **user-visible behavior**.
- Internal control flow may differ when the new design is cleaner, more explicit, or more maintainable, as long as the user-facing outcome remains aligned with the DMK-enabled path.
- Do **not** try to preserve behavior specific to the old non-DMK connect-app path (`isLdmkConnectAppEnabled === false`).

## Step summary

1. **Step 1** — introduce `DeviceContextInitialization<InitInput>` in `libs/device-intent` so initializer-side metadata can travel alongside `RequiredDeviceContext`.
2. **Step 2** — define the shared types for connect-app initialization input and the narrowed `ConnectAppInitJobState` union.
3. **Step 3** — extract requirement resolution from `app.ts` into reusable shared helpers.
4. **Step 4** — extract wrong-device validation into dedicated shared helpers.
5. **Step 5** — extract deprecation presentation decisions into a pure shared function.
6. **Step 6** — compose those shared helpers into `buildConnectAppInitialization(...)`.
7. **Step 7** — add `DmkCompatTransport` so derivation can call `getAddress(...)` from an existing DMK session.
8. **Step 8** — implement the shared `connectAppInitJob(...)` with explicit user-visible parity rules and narrowed job states.
9. **Step 9** — implement the mobile MVVM component set (Container, ViewModel, View) for device context initialization UI.
10. **Step 10** — wire the MVVM initialization component into the executor on LWM.
11. **Step 11** — integrate `buildConnectAppInitialization(...)` into a real caller, starting with the debug flow.
12. **Step 12** — validate the full pipeline with focused integration tests and parity checks.

### Current state of the codebase


| Component                                                  | Status                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `libs/device-intent` core (executor, state machine, types) | Implemented                                                          |
| `RequiredDeviceContext`, `DeviceExtractedContext`          | Implemented                                                          |
| `DeviceContextInitializerComponent` type                   | Implemented                                                          |
| `DeviceContextInitializerComponentLWM` (mobile)            | WIP — basic connect-app only, no derivation/deprecation/wrong-device |
| `DeviceContextInitialization<InitInput>` wrapper           | Proposed in ADR, not implemented                                     |
| `ConnectAppInitializationInput` type                       | Proposed, not implemented                                            |
| `buildConnectAppInitialization` builder                    | Proposed, not implemented                                            |
| `deviceContextInitialization/` module                      | Proposed, not implemented                                            |
| Pure deprecation presentation function                     | Not implemented (logic is inlined in React components)               |
| Wrong-device normalization                                 | Not implemented (logic is inlined in `app.ts`)                       |
| `DmkCompatTransport` (derivation without `withDevice`)     | Not implemented                                                      |


### Guiding principles

- **Logic-first, UI-last**: pure functions, types, and the shared job first; platform-specific rendering last.
- **Incremental**: each step is independently testable and can be merged separately.
- **DMK-path parity, user-visible first**: the target is the current DMK-enabled connect-app path's user-facing behavior, not a line-by-line recreation of its internal legacy control flow.
- **Narrowed init state**: preserve the semantics needed by the DMK-enabled path, but emit a dedicated `ConnectAppInitJobState` instead of reusing legacy `ConnectAppEvent` / `AppState` compatibility shapes.
- **Legacy coexistence**: keep the legacy `DeviceAction` / `app.ts` path working until migration is complete.
- **Shared before platform-specific**: extract shared logic into `libs/` before touching `apps/`.

### Key architectural decision: connect-app init as a job + component

The connect-app initialization logic (DMK device action execution, deprecation handling, derivation, wrong-device check) is structured following the same **job + component** pattern used by intents:

- A **shared job** (in `libs/`) wraps `ConnectAppDeviceAction`, handles deprecation, performs derivation, validates wrong-device. It returns an `Observable<ConnectAppInitJobState>`.
- Each platform provides a **UI component** that renders `ConnectAppInitJobState`.
- `DeviceContextInitializerComponentLWM` is a **thin shell**: a `useEffect` runs the job, the platform component renders the state, and on job success the shell calls `onContextInitialized`. (Desktop will follow the same pattern later.)

This does change the `libs/device-intent` contract surface: Step 1 introduces `DeviceContextInitialization<InitInput>` and updates the executor / initializer props to pass that wrapper instead of a flat `requiredDeviceContext`.

What stays unchanged is the broader DIE execution model:

- The executor still owns the same three phases: device connection, device context initialization, intent execution.
- Intent jobs still run with `deviceConnectionResult`, `deviceExtractedContext`, and `intent.input`.
- The connect-app initializer still remains a platform-injected component executed during the initialization phase.

So this is **not** a no-op refactor inside the initializer. It is a deliberate API evolution of `device-intent` to let initializer-side metadata travel alongside the required device context without leaking connect-app-specific concerns into the generic executor state model.

Important nuance for wrong-device validation:

- The shared builder should keep wrong-device validation **enabled by default** when an account is provided.
- But it must remain **explicitly skippable** for parity with existing flows that still need account-driven requirement derivation while intentionally bypassing the derived-address mismatch gate (for example ACRE-style flows).
- In other words, `appRequest.account` should continue to drive requirement resolution, but it should **not** implicitly force `expectedAccount` to be populated in every caller.

Benefits:

- The complex logic lives in a shared `libs/` job — single source of truth, testable without React.
- The per-platform component is **only UI rendering** — the only thing that truly differs between mobile and desktop.
- The thin initializer shell is trivially identical on both platforms.
- It establishes the same pattern that future intent jobs follow, making the codebase more consistent.

---

## File inventory

### New files

**Shared (libs):**


| File                                                                         | Description                                                                                                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/types.ts`        | `ConnectAppInitializationInput`, `ConnectAppInitJobState`, `ConnectAppInitSideEffects`, `ExpectedAccountIdentity`, `DeprecationPresentationInput` — all shared types     |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/job.ts`          | `connectAppInitJob` — shared Observable function wrapping `ConnectAppDeviceAction`, deprecation, derivation, wrong-device, and platform-injected non-visual side effects |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/requirements.ts` | `resolveAppRequestRequirements`, `toRequiredDeviceContext`, `toConnectAppRequest` — shared requirement resolution extracted from `app.ts`                                |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/validation.ts`   | `buildExpectedAccountIdentity`, `validateDerivedAddress` — wrong-device check logic                                                                                      |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/deprecation.ts`  | `decideDeprecationPresentation` — pure deprecation presentation decision function                                                                                        |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/index.ts`        | `buildConnectAppInitialization` — top-level composer + re-exports                                                                                                        |
| `libs/live-dmk-shared/src/transport/DmkCompatTransport.ts`                   | Lightweight `Transport` subclass wrapping a DMK session for `getAddress` calls without `withDevice`                                                                      |


**LWM (mobile) — follows [MVVM architecture](/.github/instructions/mvvm-architecture.instructions.md):**


| File                                                                                                                 | Description                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `apps/ledger-live-mobile/src/mvvm/components/DeviceContextInitialization/index.tsx`                                  | Container: wires ViewModel to View                                                                                        |
| `apps/ledger-live-mobile/src/mvvm/components/DeviceContextInitialization/useDeviceContextInitializationViewModel.ts` | ViewModel: subscribes to `connectAppInitJob`, manages `jobState`, reads Redux state, calls `onContextInitialized` on done |
| `apps/ledger-live-mobile/src/mvvm/components/DeviceContextInitialization/DeviceContextInitializationView.tsx`        | View: renders `ConnectAppInitJobState` as pure presentational component (receives props only, no hooks)                   |


```text
libs/ledger-live-common/src/hw/deviceContextInitialization/
├── types.ts              (all shared types: ConnectAppInitJobState, ConnectAppInitializationInput, etc.)
├── job.ts                (connectAppInitJob Observable function)
├── requirements.ts       (resolveAppRequestRequirements, toRequiredDeviceContext, toConnectAppRequest)
├── validation.ts         (buildExpectedAccountIdentity, validateDerivedAddress)
├── deprecation.ts        (decideDeprecationPresentation)
└── index.ts              (buildConnectAppInitialization + re-exports)

apps/ledger-live-mobile/src/mvvm/components/DeviceContextInitialization/
├── index.tsx                                        (Container: calls ViewModel, renders View)
├── useDeviceContextInitializationViewModel.ts       (ViewModel: runs job, manages state)
└── DeviceContextInitializationView.tsx              (View: pure rendering of ConnectAppInitJobState)
```

### Modified files


| File                                                                           | Description                                                                                                             |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `libs/device-intent/src/core.ts`                                               | Add `DeviceContextInitialization<InitInput>` type                                                                       |
| `libs/device-intent/src/executor.ts`                                           | Replace `requiredDeviceContext` with `deviceContextInitialization` on executor and initializer component props          |
| `libs/device-intent/src/DeviceIntentExecutor.tsx`                              | Pipe `deviceContextInitialization` through to the initializer component                                                 |
| `libs/device-intent/src/useDeviceIntentExecutor.ts`                            | Adapt hook to use `deviceContextInitialization`                                                                         |
| `libs/device-intent/src/DeviceIntentExecutorStateMachine.ts`                   | Update state machine context to use `deviceContextInitialization`                                                       |
| `libs/device-intent/src/deriveHookState.ts`                                    | Adapt state derivation for the new prop shape                                                                           |
| `libs/device-intent/src/__tests__/*`                                           | Update existing tests for the new prop shape                                                                            |
| `libs/ledger-live-common/src/hw/actions/app.ts`                                | Refactor `inferCommandParams` to delegate to `resolveAppRequestRequirements`                                            |
| `apps/ledger-live-mobile/src/mvvm/components/device-intent-executor/index.tsx` | Update to pass `deviceContextInitialization` instead of `requiredDeviceContext`, import initializer from MVVM component |


---

## Step 1 — Introduce `DeviceContextInitialization<InitInput>` in `libs/device-intent`

### Goal

Replace the flat `requiredDeviceContext` prop on the executor with a higher-level `DeviceContextInitialization` wrapper that carries both device requirements and initializer-side metadata.

This is an intentional public contract change in `libs/device-intent`, not just an internal refactor of the connect-app initializer implementation.

### Changes

`**libs/device-intent/src/core.ts**` — add new type:

```ts
type DeviceContextInitialization<InitInput = void> = {
  requiredContext: RequiredDeviceContext;
  input: InitInput;
};
```

`**libs/device-intent/src/executor.ts**` — update `DeviceIntentExecutorProps`:

- Replace `requiredDeviceContext: RequiredDeviceContext` with `deviceContextInitialization: DeviceContextInitialization<any>`
- Update `DeviceContextInitializerComponent` props: replace `requiredDeviceContext` with `deviceContextInitialization: DeviceContextInitialization<any>` (the initializer receives the whole wrapper as a single prop and extracts what it needs)

`**libs/device-intent/src/DeviceIntentExecutor.tsx**` and `**useDeviceIntentExecutor.ts**` — pipe `deviceContextInitialization` through as a single atomic prop. The executor/hook do not treat `requiredContext` and `input` as separate change sources, and component/hook boundaries in the initializer stack should pass the wrapper through unchanged. Destructuring should happen only inside the job implementation (or immediately next to it), after the React dependency boundary.

`**libs/device-intent/src/DeviceIntentExecutorStateMachine.ts**` — update context and transitions to use `deviceContextInitialization` instead of `requiredDeviceContext`.

### Restart semantics

`deviceContextInitialization` is the **atomic reinitialization key** for the executor.

That means:

- `requiredContext` and `input` are treated as one initialization contract, not as two independent props.
- `useDeviceIntentExecutor.ts` should watch `props.deviceContextInitialization` itself, not destructured subfields.
- A new `deviceContextInitialization` object identity is treated as an explicit request to rerun device-context initialization.
- There is no separate event for "input changed but required context did not".

Practical consequence for callers:

- Callers should keep `deviceContextInitialization` **stable** unless they intentionally want to restart initialization.
- In React callers, `buildConnectAppInitialization(...)` should typically be wrapped in `useMemo(...)` (or otherwise stabilized) so unrelated rerenders do not cause accidental reinitialization.

This makes restart semantics explicit and simple: the wrapper object is the semantic boundary.

Migration blast radius of this step:

- All `DeviceIntentExecutorProps` callers must switch from `requiredDeviceContext` to `deviceContextInitialization`.
- All platform `DeviceContextInitializerComponent` implementations must switch to the new prop shape.
- All `libs/device-intent` tests and helpers that currently construct executor props or initializer props must be updated.
- Any debug/demo orchestrations or local playgrounds using `RequiredDeviceContext` directly as the executor prop must be migrated as well.

### Backward compatibility

- The generic `<InitInput = void>` default means existing callers that don't need extra init input can pass `{ requiredContext, input: undefined }` and the initializer ignores the void input.

### Tests

- Update existing `libs/device-intent` unit tests for the new prop shape.
- Verify state machine transitions still match with the wrapped type.

### Files touched

- `libs/device-intent/src/core.ts`
- `libs/device-intent/src/executor.ts`
- `libs/device-intent/src/DeviceIntentExecutor.tsx`
- `libs/device-intent/src/useDeviceIntentExecutor.ts`
- `libs/device-intent/src/DeviceIntentExecutorStateMachine.ts`
- `libs/device-intent/src/deriveHookState.ts`
- `libs/device-intent/src/__tests__/*`
- `apps/ledger-live-mobile/src/mvvm/components/device-intent-executor/index.tsx` (update to new prop shape + import from MVVM)

---

## Step 2 — Define shared types (`types.ts`)

### Goal

Define all shared types for the device context initialization in a single `types.ts` file. This includes both the initializer input types and the job state union.

### Changes

**New file: `libs/ledger-live-common/src/hw/deviceContextInitialization/types.ts`**

Initializer input types:

```ts
import type { DeviceId } from "@ledgerhq/client-ids/ids";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import type { FlowName } from "../../device-action/utils";

type ExpectedAccountIdentity = {
  accountName: string;
  acceptableDerivedAddresses: string[];
};

type DeprecationPresentationInput = {
  flow: FlowName;
  currencyName: string;
};

type ConnectAppInitializationInput = {
  expectedAccount?: ExpectedAccountIdentity;
  deprecation?: DeprecationPresentationInput;
};

type ConnectAppInitSideEffects = {
  onDeviceIdObserved: (deviceId: DeviceId) => void;
  onLastSeenDeviceInfoObserved: (params: {
    modelId: DeviceModelId;
    deviceInfo: DeviceInfo;
    latestFirmware: FirmwareUpdateContext | null;
  }) => void;
};
```

Job state union (consumed by both the shared job and platform UI components):

```ts
type ConnectAppInitJobState =
  | { type: "connect-device" }
  | { type: "unlock-device" }
  | { type: "locked-device" }
  | { type: "request-manager-permission" }
  | { type: "listing-apps" }
  | { type: "installing-app"; appName: string; progress: number; index: number; total: number }
  | { type: "requires-app-installation"; appName: string; appNames: string[] }
  | { type: "request-quit-app" }
  | { type: "request-open-app"; appName: string }
  | { type: "deprecation-show"; decision: DeprecationPresentationDecision & { kind: "show" };
      onContinue: () => void; onDismiss?: (currencyName: string) => void }
  | { type: "deprecation-block"; decision: DeprecationPresentationDecision & { kind: "block" } }
  | { type: "wrong-device"; accountName: string }
  | { type: "outdated-app-warning"; appName: string; onContinue: () => void }
  | { type: "loading" }
  | { type: "error"; error: unknown }
  | { type: "done"; extractedContext: DeviceExtractedContext };
```

The initializer input types are purely data. The `ConnectAppInitJobState` union intentionally includes callbacks on interactive variants, which is the standard pattern for job states that need to resume or control the shared init flow.

Callback ownership rule for `ConnectAppInitJobState`:

- Put a callback in the shared job state **only** when the CTA directly resumes, acknowledges, or otherwise controls the shared init job.
- Keep navigation, redirection, external-link, and support/help actions in the **platform rendering layer** (ViewModel / Container / rendering helpers), not in the shared job state.

Concrete examples for the first iteration:

- `deprecation-show` — `Continue` belongs in the job state because it resumes the paused job; `Update` / `Learn more` stay rendering-owned.
- `outdated-app-warning` — `Continue` belongs in the job state because it resumes the job; `Open Manager` stays rendering-owned.
- `requires-app-installation` — `Open Manager` stays rendering-owned; no shared job callback is needed.
- `error` — support, learn-more, and manager redirections stay rendering-owned unless a future error state explicitly needs to resume the shared init job.

`deprecation-block` is an intentional example of "user-visible parity, cleaner internals":

- Today the legacy stack reaches the blocking deprecation screen through `DeviceDeprecationError` and the generic error renderer.
- In DIE, we intentionally keep the **same blocking screen and no-resume semantics** but model it as a dedicated init state owned by the initializer UI.
- This is a deliberate internal divergence that simplifies screen ownership without changing what the user sees.

Non-visual persistence side effects follow the same separation rule:

- They should **not** be modeled as `ConnectAppInitJobState` variants.
- They should instead use a required, semantic `ConnectAppInitSideEffects` adapter injected into the shared job by each platform.
- The shared job must depend on semantic callbacks (for example `onDeviceIdObserved(...)`), **not** on raw Redux `dispatch` functions.

First-iteration emitted states for the chosen parity target (`isLdmkConnectAppEnabled === true` path):

- `locked-device`
- `request-manager-permission`
- `listing-apps`
- `installing-app`
- `requires-app-installation`
- `request-open-app`
- `deprecation-show`
- `deprecation-block`
- `outdated-app-warning`
- `wrong-device`
- `error`
- `done`

Reserved but **not** emitted in the first iteration of Step 8:

- `connect-device` — device-not-connected UX belongs to the DIE connection phase, not the init job
- `unlock-device` — the current DMK-enabled connect-app path surfaces lock state as `locked-device`
- `request-quit-app` — not part of the current DMK-enabled connect-app parity target
- `loading` — initial spinner state is represented by `jobState === undefined` in the ViewModel/View layer, not by a dedicated emitted job state

### Package wiring note

Because `types.ts` already references `DeviceExtractedContext` from `@ledgerhq/device-intent`, `libs/ledger-live-common/package.json` should add `@ledgerhq/device-intent` as a workspace dependency as part of this step.

### Files touched

- `libs/ledger-live-common/src/hw/deviceContextInitialization/types.ts` (new)
- `libs/ledger-live-common/package.json` (add `@ledgerhq/device-intent` workspace dependency)

---

## Step 3 — Extract pure requirement resolution from `app.ts`

### Goal

Extract the logic of `inferCommandParams` into a public, testable, shared function that produces both `RequiredDeviceContext` (for the DIE executor) and `ConnectAppInitializationInput` (for the initializer).

### Changes

**New file: `libs/ledger-live-common/src/hw/deviceContextInitialization/requirements.ts`**

Extract from `app.ts`:

- `resolveAppRequestRequirements(appRequest: AppRequest): ResolvedAppRequirements` — the core resolution logic (currency inference, appName inference, dependency normalization, derivation parameters, family-specific extra).
- `toRequiredDeviceContext(req: ResolvedAppRequirements): RequiredDeviceContext` — projects to the DIE type.
- `toConnectAppRequest(req: ResolvedAppRequirements): ConnectAppRequest` — projects to the legacy type (used by `app.ts` during migration).

The intermediate `ResolvedAppRequirements` type captures the full resolved shape and can be projected to either target.

`**libs/ledger-live-common/src/hw/actions/app.ts**` — refactor `inferCommandParams` to call `resolveAppRequestRequirements` internally:

```ts
function inferCommandParams(appRequest: AppRequest): ConnectAppRequest {
  return toConnectAppRequest(resolveAppRequestRequirements(appRequest));
}
```

This preserves exact legacy behavior while making the shared resolver available to the DIE path.

### Tests

- Unit tests for `resolveAppRequestRequirements` covering:
  - Account-only input (infers currency, appName, derivation)
  - Currency-only input (infers appName, default derivation)
  - AppName-only input (no derivation)
  - Nested dependencies (recursive resolution)
  - Family-specific `injectGetAddressParams` (e.g. Bitcoin Cash `forceFormat`)
- Unit tests for `toRequiredDeviceContext` and `toConnectAppRequest` projections.
- Verify `app.ts` behavior unchanged by running existing action tests.

### Files touched

- `libs/ledger-live-common/src/hw/deviceContextInitialization/requirements.ts` (new)
- `libs/ledger-live-common/src/hw/actions/app.ts` (refactor `inferCommandParams`)

---

## Step 4 — Extract wrong-device validation logic

### Goal

Extract the expected-account identity normalization and the derived-address comparison into shared pure functions.

### Changes

**New file: `libs/ledger-live-common/src/hw/deviceContextInitialization/validation.ts`**

```ts
function buildExpectedAccountIdentity(account: Account): ExpectedAccountIdentity {
  return {
    accountName: getDefaultAccountName(account),
    acceptableDerivedAddresses: [
      account.freshAddress,
      ...(account.seedIdentifier ? [account.seedIdentifier] : []),
    ],
  };
}

function validateDerivedAddress(
  expectedAccount: ExpectedAccountIdentity | undefined,
  derivedAddress: string | undefined,
): { kind: "match" } | { kind: "no-check" } | { kind: "mismatch"; accountName: string } {
  if (!expectedAccount || !derivedAddress) return { kind: "no-check" };
  if (expectedAccount.acceptableDerivedAddresses.includes(derivedAddress)) return { kind: "match" };
  return { kind: "mismatch", accountName: expectedAccount.accountName };
}
```

### Tests

- Unit tests for `buildExpectedAccountIdentity` (freshAddress, seedIdentifier).
- Unit tests for `validateDerivedAddress` (match, mismatch, no-check scenarios).
- Verify parity with current `app.ts` `inWrongDeviceForAccount` computation.

### Files touched

- `libs/ledger-live-common/src/hw/deviceContextInitialization/validation.ts` (new)

---

## Step 5 — Extract pure deprecation presentation function

### Goal

Extract the flow/coin/settings-aware deprecation presentation decision out of the React components and into a shared pure function.

### Changes

**New file: `libs/ledger-live-common/src/hw/deviceContextInitialization/deprecation.ts`**

Extract the `doSkipDeprecation` + screen-ordering logic from both mobile and desktop `DeviceAction/index.tsx` into:

```ts
type DeprecationPresentationDecision =
  | { kind: "skip" }
  | { kind: "show"; screens: Array<"warning" | "clearSigning">; date: Date; modelId: string }
  | { kind: "block"; date: Date; modelId: string };

function decideDeprecationPresentation(params: {
  rules: DeviceDeprecationRules;
  flow: FlowName;
  currencyName: string;
  deprecationDismissedCurrencyNames: string[];
}): DeprecationPresentationDecision;
```

This function encodes the current behavior:

- If `errorScreenVisible` and the error screen applies to this flow/currency → `block`.
- If `warningScreenVisible` and the warning screen applies and not dismissed → `show` with `["warning"]` (and possibly `"clearSigning"` appended if clear-signing screen also applies).
- If `clearSigningScreenVisible` (but no warning) and applies → `show` with `["clearSigning"]`.
- Otherwise → `skip`.

### Desktop/mobile alignment note

Currently, desktop and mobile have slightly different `skipClearSigningScreen` logic (desktop uses a local "already displayed" flag; mobile uses `alreadyDismissed`). The pure function should implement the **shared** semantics; any platform-specific "already displayed this render cycle" guard stays in the component.

### Tests

- Unit tests covering all combinations: skip (exception, wrong flow, unknown flow), show warning only, show warning + clear-signing, show clear-signing only, block, dismissed currency.
- Document the desktop/mobile alignment delta.

### Files touched

- `libs/ledger-live-common/src/hw/deviceContextInitialization/deprecation.ts` (new)

---

## Step 6 — Create `buildConnectAppInitialization` composer

### Goal

Create the top-level builder function that callers use to produce a complete `DeviceContextInitialization<ConnectAppInitializationInput>` from rich domain input.

### Changes

**New file: `libs/ledger-live-common/src/hw/deviceContextInitialization/index.ts`**

```ts
import { resolveAppRequestRequirements, toRequiredDeviceContext } from "./requirements";
import { buildExpectedAccountIdentity } from "./validation";
import type { ConnectAppInitializationInput } from "./types";
import type { DeviceContextInitialization } from "@ledgerhq/device-intent";

function buildConnectAppInitialization(params: {
  appRequest: AppRequest;
  flow?: FlowName;
  currencyName?: string;
  skipWrongDeviceCheck?: boolean;
}): DeviceContextInitialization<ConnectAppInitializationInput> {
  const resolved = resolveAppRequestRequirements(params.appRequest);
  const requiredContext = toRequiredDeviceContext(resolved);

  const expectedAccount = !params.skipWrongDeviceCheck && params.appRequest.account
    ? buildExpectedAccountIdentity(params.appRequest.account)
    : undefined;

  const derivedCurrencyName =
    params.currencyName ??
    params.appRequest.tokenCurrency?.name ??
    params.appRequest.account?.currency?.name ??
    params.appRequest.currency?.name;

  const deprecation =
    params.flow && derivedCurrencyName ? { flow: params.flow, currencyName: derivedCurrencyName } : undefined;

  return {
    requiredContext,
    input: { expectedAccount, deprecation },
  };
}
```

`skipWrongDeviceCheck` defaults to `false`.

This flag exists to preserve the current caller-controlled bypass semantics:

- `appRequest.account` still participates in requirement resolution (`currency`, `appName`, derivation path, family-specific params)
- but callers can explicitly opt out of wrong-device validation by preventing `expectedAccount` from being populated

This is preferable to overloading `appRequest.account` absence as a hidden signal, because in DIE we want to keep account-driven requirement derivation available even for flows that intentionally skip the derived-address mismatch gate.

`currencyName` should follow an explicit-override-with-fallbacks rule:

- If the caller passes `currencyName`, that explicit value wins.
- Otherwise the builder should derive it when possible from:
  - `appRequest.tokenCurrency?.name`
  - `appRequest.account?.currency?.name`
  - `appRequest.currency?.name`
- If none of those sources exist, deprecation input is omitted.

This keeps common flows ergonomic while still allowing callers to provide a user-facing `currencyName` explicitly for cases where `appRequest` does not carry the right display coin context (for example app-only or composite flows such as Exchange-like requests).

Re-export all public symbols from `index.ts`.

### Package wiring note

No extra `live-common` export entry is needed for this module path: the package already exposes `src/*` subpaths through its wildcard export pattern, so `@ledgerhq/live-common/hw/deviceContextInitialization` will resolve once the new source file exists.

### Tests

- Integration-style unit tests: given a full `AppRequest` with account + flow, verify the output `DeviceContextInitialization` has correct `requiredContext`, `expectedAccount`, and `deprecation`.
- Integration-style unit tests: given a full `AppRequest` with account + `skipWrongDeviceCheck: true`, verify `requiredContext` is still derived from the account while `expectedAccount` is omitted.
- Integration-style unit tests: verify `currencyName` falls back from `tokenCurrency`, then `account.currency`, then `currency` when the explicit override is omitted.
- Integration-style unit tests: verify an explicit `currencyName` override wins when `appRequest` does not carry the intended display coin context.

### Files touched

- `libs/ledger-live-common/src/hw/deviceContextInitialization/index.ts` (new)

---

## Step 7 — Create `DmkCompatTransport` for derivation without `withDevice`

### Goal

Address derivation during connect-app initialization calls `getAddress(transport, ...)`, which requires a ledgerjs `Transport` instance. In the DIE world we have a DMK session, not a platform transport obtained via `withDevice`.

Create a lightweight `DmkCompatTransport` class that wraps a DMK session and satisfies the `Transport` contract so `getAddress` can be called without `withDevice`.

### Why this works

The `getAddress` call chain dispatches to per-family signers. For families with DMK-native signers (e.g. EVM), the signer factory checks `isDmkTransport(transport)` and, when it passes, constructs a DMK signer directly from `transport.dmk` / `transport.sessionId` — `exchange()` is never called. For families still on legacy `hw-app-*` signers, the fallback path calls `transport.exchange()`.

`DmkCompatTransport` covers both cases:

- It exposes `.dmk` and `.sessionId` as public properties so `isDmkTransport()` (which duck-types on those fields) passes.
- It implements `exchange()` via `dmk.sendApdu()`, matching what `DeviceManagementKitBLETransport` (mobile) and `DeviceManagementKitTransport` (desktop) already do.

### Changes

**New file: `libs/live-dmk-shared/src/transport/DmkCompatTransport.ts`**

```ts
import Transport from "@ledgerhq/hw-transport";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";

export class DmkCompatTransport extends Transport {
  dmk: DeviceManagementKit;
  sessionId: string;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.dmk = dmk;
    this.sessionId = sessionId;
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const response = await this.dmk.sendApdu({
      sessionId: this.sessionId,
      apdu: new Uint8Array(apdu),
    });
    return Buffer.from([...response.data, ...response.statusCode]);
  }
}
```

This is intentionally minimal — no connection lifecycle, no discovery, no reconnection. Those are the DIE's responsibility. This class is purely a protocol adapter.

### Why it lives in `live-dmk-shared`

`live-dmk-shared` already depends on both `@ledgerhq/hw-transport` (base class) and `@ledgerhq/device-management-kit` (DMK types), and is the shared DMK utilities package used by both platforms. `live-common` depends on `live-dmk-shared`, so the adapter is available where `getAddress` and the connect-app init job need it.

### Relationship to existing DMK transports

The existing `DeviceManagementKitBLETransport` (in `live-dmk-mobile`) and `DeviceManagementKitTransport` (in `live-dmk-desktop`) are **full platform transports** with connection, discovery, reconnection, and event handling. `DmkCompatTransport` is a **thin protocol adapter** — it doesn't replace them. It's only used inside the connect-app init job for the derivation callback, where a DMK session is already established.

We intentionally keep a dedicated `DmkCompatTransport` in `live-dmk-shared` rather than reusing the wallet-cli transport adapter:

- `apps/wallet-cli/src/device/wallet-cli-dmk-transport.ts` validates that this adapter shape works.
- But it is CLI-specific and lives in an app package, not in the shared dependency layer used by `live-common`.
- The connect-app init job needs a shared adapter available to both mobile and desktop library code.

So the wallet-cli adapter is a useful reference, but `**DmkCompatTransport` remains the correct implementation choice for this plan**.

### Tests

- Unit test: `isDmkTransport(new DmkCompatTransport(mockDmk, "session-1"))` returns `true`.
- Unit test: `exchange()` calls `dmk.sendApdu()` and returns the correct `Buffer`.

### Files touched

- `libs/live-dmk-shared/src/transport/DmkCompatTransport.ts` (new)

---

## Step 8 — Implement the shared job (`job.ts`)

### Goal

Create a shared connect-app initialization **job** in `libs/` that wraps `ConnectAppDeviceAction` execution, handles deprecation, performs derivation, preserves the current DMK-enabled outdated-app warning behavior, validates wrong-device, and emits a typed `ConnectAppInitJobState` observable.

`ConnectAppInitJobState` is already defined in `types.ts` (Step 2).

### Connect-app init job — shared Observable function

**New file: `libs/ledger-live-common/src/hw/deviceContextInitialization/job.ts`**

```ts
function connectAppInitJob(params: {
  dmk: DeviceManagementKit;
  sessionId: string;
  deviceContextInitialization: DeviceContextInitialization<ConnectAppInitializationInput>;
  deprecationDismissedCurrencyNames: string[];
  sideEffects: ConnectAppInitSideEffects;
}): Observable<ConnectAppInitJobState>
```

This function:

1. Destructures `params.deviceContextInitialization` once at the top of the function:
  - `const { requiredContext: requiredDeviceContext, input: initInput } = params.deviceContextInitialization`
2. Accepts a required semantic side-effects adapter from the platform layer:
  - `params.sideEffects.onDeviceIdObserved(...)`
  - `params.sideEffects.onLastSeenDeviceInfoObserved(...)`
3. Instantiates `ConnectAppDeviceAction` with:
  - `application` built from `requiredDeviceContext.appName` using the same semantics as the current `connectApp.ts` `appNameToDependency()` helper
  - `dependencies` built from `requiredDeviceContext.dependencies` using the same `appNameToDependency()` semantics
  - `requireLatestFirmware`, `allowMissingApplication` from `requiredDeviceContext`
  - `deprecationConfig` from `getDeprecationConfig(appName, dependencies)`
  - `requiredDerivation`: when `requiredDeviceContext.requiresDerivation` is set, provides an async callback that:
  1. Creates a `DmkCompatTransport` from the DMK session (Step 7)
  2. Wraps the call with `dmk._unsafeBypassIntentQueue({ bypass: true/false })` (matching current `connectApp.ts` behavior)
  3. Calls `getAddress(transport, { currency, ...derivationRest })` and returns the derived address
4. Runs `dmk.executeDeviceAction(...)` and maps the DMK state observable to `ConnectAppInitJobState` according to the user-visible parity contract below.wrongg
5. Calls the injected `sideEffects` adapter for non-visual persistence concerns that are currently handled by the legacy connect-app stack.

This outdated-app behavior targets parity with the current **DMK-enabled** connect-app stack only. It does not attempt to reproduce the older non-DMK `has-outdated-app` / `outdatedAppRef` loop from the legacy fallback path.

For deprecation specifically, the shared job owns the presentation decision and the automatic control-flow outcomes (`skip` / `block`). The renderer should only render the resulting state and wire user-triggered CTAs; it should no longer decide on its own to call `onContinue(true/false)` immediately.

The same principle applies to blocking deprecation:

- user-visible behavior should stay aligned with the current DMK-enabled connect-app flow
- but the shared initializer may represent that behavior with a cleaner dedicated `deprecation-block` state instead of routing the screen through DIE's generic initialization error renderer

### Platform-injected side-effects adapter

The shared job should preserve the current non-visual connect-app side effects without hardcoding Redux/store knowledge into `libs/`.

So `connectAppInitJob` receives a required semantic adapter:

```ts
type ConnectAppInitSideEffects = {
  onDeviceIdObserved: (deviceId: DeviceId) => void;
  onLastSeenDeviceInfoObserved: (params: {
    modelId: DeviceModelId;
    deviceInfo: DeviceInfo;
    latestFirmware: FirmwareUpdateContext | null;
  }) => void;
};
```

Rules:

- The shared job calls semantic callbacks only; it must **not** import platform stores or dispatch Redux actions directly.
- Each platform ViewModel / container is responsible for implementing and injecting this adapter.
- Platform-specific extra work (for example desktop-only model bookkeeping) can happen inside the platform implementation of these callbacks.
- The shared job should preserve current one-shot semantics and avoid spamming callbacks on repeated DMK/session-state emissions when nothing new was observed.

The `appNameToDependency()` semantics to preserve are:

- convert each app name to an `ApplicationDependency`
- for every `DeviceModelId`, apply the `getMinVersion(appName, model)` constraint when one exists
- pass those constrained `ApplicationDependency` objects into `ConnectAppDeviceAction`

### Parity-Critical Mapping Contract

This table is the normative behavior contract for another agent implementing `connectAppInitJob`.


| DMK source / condition                                                               | Preserved meaning                                                                                                      | Emit / behavior                                                                                                                                                              |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requiredUserInteraction === ConfirmOpenApp`                                         | User must open the requested app on device                                                                             | Emit `request-open-app { appName: requiredDeviceContext.appName }`                                                                                                           |
| `requiredUserInteraction === AllowSecureConnection`                                  | User must approve the secure Manager connection on device                                                              | Emit `request-manager-permission`                                                                                                                                            |
| `requiredUserInteraction === UnlockDevice`                                           | Current DMK-enabled path treats this as locked-device UX, not as a separate unlock state                               | Emit `locked-device`                                                                                                                                                         |
| transition out of secure-connection approval into dependency resolution              | Preserve current DMK-enabled "listing apps" UX even though DMK does not expose a dedicated legacy event for it         | Emit `listing-apps` once when entering that phase                                                                                                                            |
| `intermediateValue.installPlan !== null`                                             | Preserve install progress semantics from the current DMK-enabled path                                                  | Emit `installing-app { appName, progress, index, total }`                                                                                                                    |
| `requiredUserInteraction === "device-deprecation"`                                   | Preserve deprecation gate behavior                                                                                     | Call `decideDeprecationPresentation(...)`; emit `deprecation-show` for resumable warning flows, emit `deprecation-block` for blocking flows, or silently continue for `skip` |
| new device id is observed during init                                                | Preserve current device identity persistence behavior                                                                  | Call `sideEffects.onDeviceIdObserved(deviceId)`                                                                                                                              |
| last-seen device info / latest firmware becomes available during init                | Preserve current last-seen device persistence behavior                                                                 | Call `sideEffects.onLastSeenDeviceInfoObserved({ modelId, deviceInfo, latestFirmware })`                                                                                     |
| `DeviceActionStatus.Completed`                                                       | Recover current app/version from session state, same source used by `ConnectAppEventMapper.handleCompletedEvent` today | If `shouldUpgrade(appName, appVersion)` is true, emit `outdated-app-warning`; otherwise continue to address validation / `done`                                              |
| `outdated-app-warning` acknowledged by user                                          | Preserve current DMK-enabled continue path                                                                             | Resume toward address validation and emit `wrong-device` or `done`                                                                                                           |
| `DeviceActionStatus.Error` with `OutOfMemoryDAError` and a non-null install plan     | Preserve current DMK-enabled app-installation-required behavior                                                        | Emit `requires-app-installation { appName, appNames }` and complete the job                                                                                                  |
| `DeviceActionStatus.Error` with `UnsupportedFirmwareDAError`                         | Preserve current DMK-enabled firmware remapping                                                                        | Emit `error` with `LatestFirmwareVersionRequired`                                                                                                                            |
| `DeviceActionStatus.Error` with `UnsupportedApplicationDAError` on Nano S            | Preserve current DMK-enabled unsupported-app remapping                                                                 | Emit `error` with `NoSuchAppOnProvider`                                                                                                                                      |
| `DeviceActionStatus.Error` with `UnsupportedApplicationDAError` on non-Nano-S device | Preserve current DMK-enabled unsupported-app remapping                                                                 | Emit `error` with `UnsupportedFeatureError`                                                                                                                                  |
| `DeviceActionStatus.Error` with `RefusedByUserDAError`                               | Preserve current DMK-enabled permission-refusal remapping                                                              | Emit `error` with `UserRefusedAllowManager`                                                                                                                                  |
| `DeviceActionStatus.Error` with string error code `"5501"`                           | Preserve current DMK-enabled device refusal remapping                                                                  | Emit `error` with `UserRefusedOnDevice`                                                                                                                                      |
| disconnection during init                                                            | Device disconnection is owned by DIE runtime orchestration, not by the narrowed init job state model                   | Do **not** invent a dedicated init-job state; let the executor handle connection loss / retry UX                                                                             |


States intentionally not emitted by this contract:

- `connect-device`
- `unlock-device`
- `request-quit-app`
- `loading`

### Explicit non-reuse of legacy compatibility layers

This shared job should **not** reuse the legacy compatibility layers as implementation building blocks:

- Do **not** reuse `ConnectAppEventMapper` as-is.
- Do **not** reuse the `app.ts` reducer or `AppState`.
- Do **not** shape the new initializer state around compatibility with `DeviceAction/index.tsx` or `rendering.tsx`.

Instead, `connectAppInitJob` should:

- consume `dmk.executeDeviceAction(...)` directly,
- read `dmk.getDeviceSessionState(...)` directly when session-derived data is needed,
- maintain only the small amount of internal bookkeeping needed by the init flow itself,
- own the small amount of deduplication bookkeeping needed for `sideEffects` parity,
- emit a **narrowed** `ConnectAppInitJobState` union tailored to device initialization UI.

The current **DMK-enabled Ledger Live wrapper behavior around `ConnectAppDeviceAction`** remains the **reference behavior**, not the implementation to reuse. In practice, Step 8 should preserve the semantics that matter for parity, while reimplementing them in a smaller job-oriented form:

- mapping of pending DMK interactions to init UI states,
- install-plan interpretation,
- current app/version recovery from session state on completion,
- parity-relevant error remapping,
- outdated-app warning, deprecation, and wrong-device gating.

This keeps the new initializer aligned with the current DMK-enabled connect-app behavior, while avoiding legacy renderer-precedence logic and the wide compatibility-oriented state shape of `app.ts`.

### Derivation callback detail

```ts
requiredDerivation: requiresDerivation
  ? async () => {
      try {
        dmk._unsafeBypassIntentQueue({ bypass: true, sessionId });
        const transport = new DmkCompatTransport(dmk, sessionId);
        const { currencyId, ...rest } = requiresDerivation;
        const result = await getAddress(transport, {
          currency: getCryptoCurrencyById(currencyId),
          ...rest,
        });
        return result.address;
      } finally {
        dmk._unsafeBypassIntentQueue({ bypass: false, sessionId });
      }
    }
  : undefined,
```

This mirrors the existing `connectApp.ts` derivation logic (lines 591–604) but uses `DmkCompatTransport` instead of a platform transport obtained via `withDevice`.

### Why a function returning Observable (not a DIE `Job`)

The connect-app init job is not a DIE `Job` in the formal sense (it doesn't take `DeviceExtractedContext` as input — it *produces* it). It's a plain function returning `Observable<ConnectAppInitJobState>`. But it follows the same pattern: shared logic in libs, typed state, platform-specific rendering.

### Tests

- Unit tests with mocked DMK for the full job lifecycle:
  - Happy path: connect → open app → derivation (via `DmkCompatTransport`) → done
  - App dependency conversion: `application` / `dependencies` passed to `ConnectAppDeviceAction` preserve current `appNameToDependency()` min-version constraints
  - App not installed: `OutOfMemoryDAError` with install plan → emits `requires-app-installation`
  - Outdated app: completed DMK connect-app state with outdated current app version → emits `outdated-app-warning`
  - Outdated app: continue callback after `outdated-app-warning` resumes toward validation / `done`
  - Device id observed during init → calls `sideEffects.onDeviceIdObserved(...)`
  - Last-seen device info observed during init → calls `sideEffects.onLastSeenDeviceInfoObserved(...)`
  - Repeated equivalent DMK/session-state emissions do not repeatedly fire side-effect callbacks
  - Derivation: verify `DmkCompatTransport` is constructed and `getAddress` called with correct params
  - Derivation: verify `_unsafeBypassIntentQueue` is called with `true` before and `false` after
  - Deprecation skip: deprecation intermediate → `decideDeprecationPresentation` returns skip → `onContinue(false)` called → flow continues
  - Deprecation show: deprecation intermediate → emits `deprecation-show` → external call to `onContinue` → flow continues
  - Deprecation block: surfaces `deprecation-block` as a dedicated initializer state with the same blocking/no-resume UX as today
  - Wrong device: derivation complete → address mismatch → emits `wrong-device`
  - Unsupported firmware error remapping → emits `error(LatestFirmwareVersionRequired)`
  - Unsupported application error remapping → emits `error(NoSuchAppOnProvider)` on Nano S and `error(UnsupportedFeatureError)` otherwise
  - Error: DMK error → emits `error`

### Files touched

- `libs/ledger-live-common/src/hw/deviceContextInitialization/job.ts` (new)

---

## Step 9 — Implement mobile MVVM component for device context initialization

### Goal

Create the mobile MVVM component that renders `ConnectAppInitJobState`. This follows the [MVVM architecture](/.github/instructions/mvvm-architecture.instructions.md): Container → ViewModel → View.

**New files in `apps/ledger-live-mobile/src/mvvm/components/DeviceContextInitialization/*`*

`**DeviceContextInitializationView.tsx**` — the View (pure presentational, receives props only, no hooks):

```tsx
type DeviceContextInitializationViewProps = {
  jobState: ConnectAppInitJobState | undefined;
};

const DeviceContextInitializationView: React.FC<DeviceContextInitializationViewProps> = ({ jobState }) => {
  if (!jobState) return <Spinner />;

  switch (jobState.type) {
    case "connect-device":
    case "unlock-device":
    case "locked-device":
      return /* ConnectYourDevice / device animation */;
    case "request-manager-permission":
      return /* AllowManager animation */;
    case "listing-apps":
      return /* "Checking app dependencies" loading */;
    case "installing-app":
      return /* Install progress with appName and percentage */;
    case "requires-app-installation":
      return /* App-not-installed / open-manager CTA */;
    case "request-quit-app":
      return /* Quit app device animation */;
    case "request-open-app":
      return /* Open app device animation */;
    case "deprecation-show":
      return <DeviceDeprecationScreen /* warning / clearSigning variant */ />;
    case "deprecation-block":
      return <DeviceDeprecationScreen /* blocking variant */ />;
    case "wrong-device":
      return /* Wrong device for account error (retry orchestration deferred to follow-up) */;
    case "outdated-app-warning":
      return /* Outdated app warning with continue/update */;
    case "loading":
      return <Spinner />;
    case "error":
      return /* Error screen */;
    case "done":
      return null;
  }
};
```

The View should not be limited to `jobState` alone in practice. Platform-owned callbacks needed for rendering-only CTAs (for example `Open Manager`, `Learn more`, support links, or external redirections) can be passed as separate props from the ViewModel / Container whenever needed.

The important split is:

- callbacks that **control the shared init job** live inside `ConnectAppInitJobState`
- callbacks that **only navigate or open links** stay platform-owned and outside the shared job state

`**useDeviceContextInitializationViewModel.ts`** — the ViewModel (all external hooks and job execution):

```ts
function useDeviceContextInitializationViewModel(params: {
  dmk: DeviceManagementKit;
  sessionId: string;
  deviceContextInitialization: DeviceContextInitialization<ConnectAppInitializationInput>;
  onContextInitialized: (ctx: DeviceExtractedContext) => void;
  onError: (err: unknown) => void;
}) {
  const [jobState, setJobState] = useState<ConnectAppInitJobState | undefined>();
  const deprecationDismissedCurrencyNames = useSelector(/* deprecationDoNotRemind from settings */);
  const dispatch = useDispatch();
  const deprecationDismissedCurrencyNamesRef = useRef(deprecationDismissedCurrencyNames);
  deprecationDismissedCurrencyNamesRef.current = deprecationDismissedCurrencyNames;
  const onContextInitializedRef = useRef(params.onContextInitialized);
  onContextInitializedRef.current = params.onContextInitialized;
  const onErrorRef = useRef(params.onError);
  onErrorRef.current = params.onError;

  const sideEffects = useMemo<ConnectAppInitSideEffects>(
    () => ({
      onDeviceIdObserved(deviceId) {
        dispatch(identitiesSlice.actions.addDeviceId(deviceId));
      },
      onLastSeenDeviceInfoObserved({ modelId, deviceInfo, latestFirmware }) {
        // Platform-owned mapping: mobile can ignore `latestFirmware` if unused,
        // while desktop can persist it alongside last-seen device info.
        dispatch(
          setLastSeenDeviceInfo({
            modelId,
            deviceInfo,
            apps: [],
          }),
        );
      },
    }),
    [dispatch],
  );

  useEffect(() => {
    const subscription = connectAppInitJob({
      dmk: params.dmk,
      sessionId: params.sessionId,
      deviceContextInitialization: params.deviceContextInitialization,
      deprecationDismissedCurrencyNames: deprecationDismissedCurrencyNamesRef.current,
      sideEffects,
    }).subscribe({
      next(state) {
        setJobState(state);
        if (state.type === "done") {
          onContextInitializedRef.current(state.extractedContext);
        }
      },
      error(err) {
        onErrorRef.current(err);
      },
    });

    return () => subscription.unsubscribe();
  }, [
    params.dmk,
    params.sessionId,
    params.deviceContextInitialization,
    sideEffects,
  ]);

  return { jobState };
}
```

`**index.tsx**` — the Container (wires ViewModel to View):

```tsx
const DeviceContextInitialization: DeviceContextInitializerComponent = ({
  deviceContextInitialization,
  connectionResult,
  onContextInitialized,
  onError,
}) => {
  const { jobState } = useDeviceContextInitializationViewModel({
    dmk: connectionResult.dmk,
    sessionId: connectionResult.sessionId,
    deviceContextInitialization:
      deviceContextInitialization as DeviceContextInitialization<ConnectAppInitializationInput>,
    onContextInitialized,
    onError,
  });

  return <DeviceContextInitializationView jobState={jobState} />;
};
```

The Container intentionally forwards `deviceContextInitialization` unchanged. The ViewModel uses that wrapper object as the atomic dependency key for initialization restarts.

The ViewModel should use refs for volatile callback and settings reads that must stay fresh without becoming reinitialization keys. In particular:

- `onContextInitialized`
- `onError`
- `deprecationDismissedCurrencyNames`

Those values must remain readable by the subscription logic, but they should not be placed directly in the effect dependency array if the intended restart boundary is `deviceContextInitialization`.

### Approach

- **Reuse existing rendering helpers** from `rendering.tsx` (e.g. `renderAllowManager`, `renderRequestQuitApp`, `renderAllowOpeningApp`).
- **Reuse existing `DeviceDeprecationScreen`** from `DeviceAction/Screen/DeviceDeprecationScreen.tsx`.
- **Reuse or adapt `renderInWrongAppForAccount`**.
- **Split callback ownership cleanly**: `ConnectAppInitJobState` only carries callbacks that resume/control the shared init job; Manager navigation, support links, learn-more links, and similar redirections stay in the platform rendering layer.
- **Inject platform-owned side effects through a semantic adapter**: the ViewModel implements `ConnectAppInitSideEffects` with platform dispatch logic and passes it to the shared job; the shared job stays store-agnostic.
- **Defer standardized wrong-device retry orchestration**: the first iteration preserves mismatch detection and blocking semantics; a reusable retry contract will be specified later.
- **Do not remove the legacy `DeviceAction` branches** — the legacy path must continue working.
- **Use Lumen design system** components (`Spinner`, etc.) for new UI elements.

### Files touched

- `apps/ledger-live-mobile/src/mvvm/components/DeviceContextInitialization/index.tsx` (new)
- `apps/ledger-live-mobile/src/mvvm/components/DeviceContextInitialization/useDeviceContextInitializationViewModel.ts` (new)
- `apps/ledger-live-mobile/src/mvvm/components/DeviceContextInitialization/DeviceContextInitializationView.tsx` (new)

---

## Step 10 — Wire the MVVM component into the executor

### Goal

Connect the new MVVM `DeviceContextInitialization` component to the executor as the platform-injected `DeviceContextInitializerComponent`. The old `DeviceContextInitializerComponentLWM.tsx` at `apps/ledger-live-mobile/src/mvvm/components/device-intent-executor/` is removed; the executor's `index.tsx` imports the MVVM component instead.

The MVVM component's `index.tsx` (container) already implements the `DeviceContextInitializerComponent` interface (see Step 9), so this step is purely wiring.

### Files touched

- `apps/ledger-live-mobile/src/mvvm/components/device-intent-executor/DeviceContextInitializerComponentLWM.tsx` (removed)
- `apps/ledger-live-mobile/src/mvvm/components/device-intent-executor/index.tsx` (update imports to use MVVM component)

---

## Step 11 — Wire `buildConnectAppInitialization` into a real caller

### Goal

Integrate the full pipeline end-to-end by wiring `buildConnectAppInitialization` into at least one real connect-app-based flow.

### Changes

- In the chosen caller flow, replace manual `requiredDeviceContext` construction with a memoized `deviceContextInitialization`:

```ts
const deviceContextInitialization = useMemo(
  () =>
    buildConnectAppInitialization({
      appRequest: { account: mainAccount, tokenCurrency },
      flow: FlowName.send,
      currencyName: getCurrencyName(request),
      skipWrongDeviceCheck: isACRE,
    }),
  [mainAccount, tokenCurrency, request, isACRE],
);
```

- Pass `deviceContextInitialization` to `DeviceIntentExecutor` instead of `requiredDeviceContext`.
- Keep `deviceContextInitialization` stable across unrelated rerenders; creating a new wrapper object intentionally requests reinitialization.
- Verify the full pipeline: builder → executor → initializer shell → shared job → platform component → `onContextInitialized` → intent execution.

### Suggested first target

The mobile debug flow (`DebugDeviceIntentExecutor`) is the safest first target since it's already integrated with the DIE and doesn't affect production.

### Files touched

- `apps/ledger-live-mobile/src/screens/Settings/Debug/Features/DeviceIntentExecutor/index.tsx`
- `apps/ledger-live-mobile/src/screens/Settings/Debug/Features/DeviceIntentExecutor/useDemoIntentOrchestration.ts`
- Then progressively: real flow callers.

---

## Step 12 — Integration tests and validation

### Goal

Validate end-to-end behavior across deprecation, outdated-app warning, and wrong-device scenarios.

### Test matrix


| Scenario                                              | Expected                                                  |
| ----------------------------------------------------- | --------------------------------------------------------- |
| No deprecation config                                 | Initialization proceeds directly                          |
| Warning config, matching flow/coin                    | Warning screen shown, continue proceeds                   |
| Warning + clear-signing, matching flow/coin           | Both screens shown sequentially                           |
| Warning, dismissed currency                           | Warning auto-skipped                                      |
| Warning, non-matching flow                            | Warning auto-skipped                                      |
| Warning, exception currency                           | Warning auto-skipped                                      |
| Blocking error, matching flow/coin                    | Blocking screen, initialization fails                     |
| Blocking error, non-matching flow                     | Error auto-skipped                                        |
| Install plan ends with app-not-installed condition    | Requires-app-installation screen is shown                 |
| Outdated app on current device app version            | Outdated-app warning is shown                             |
| Outdated app warning, user continues                  | Initialization proceeds                                   |
| Wrong device (address mismatch)                       | Wrong-device screen shown; mismatch blocks initialization |
| Correct device (address match)                        | Initialization proceeds                                   |
| No derivation requested                               | No wrong-device check                                     |
| No account provided                                   | No wrong-device check                                     |
| Account provided, but `skipWrongDeviceCheck === true` | No wrong-device check                                     |
| Device id is observed during init                     | `sideEffects.onDeviceIdObserved(...)` is called           |
| Last-seen device info is observed during init         | `sideEffects.onLastSeenDeviceInfoObserved(...)` is called |
| Unsupported firmware DMK error                        | Error state carries `LatestFirmwareVersionRequired`       |
| Unsupported application DMK error on Nano S           | Error state carries `NoSuchAppOnProvider`                 |

### MVVM coverage note

In addition to the shared-library tests above, the new MVVM component should have:

- one focused integration test suite under `apps/ledger-live-mobile/src/mvvm/components/DeviceContextInitialization/__integrations__/`
- one dedicated ViewModel / hook test suite for `useDeviceContextInitializationViewModel`

That coverage does not need to duplicate the full Step 12 shared-job matrix. It should validate the MVVM wiring and ownership boundaries with a few representative cases:

- a passive render state
- a job-controlled CTA state (for example `deprecation-show` or `outdated-app-warning`)
- a renderer-controlled CTA state (for example `requires-app-installation`)
- success handoff via `done`
- error handoff via observable error
- subscription lifecycle / ref-stability behavior (no unintended resubscribe when only callback identities or deprecation-dismissed settings change)


### Files touched

- Test files in `libs/ledger-live-common/src/hw/deviceContextInitialization/__tests__/`
- `apps/ledger-live-mobile/src/mvvm/components/DeviceContextInitialization/__integrations__/...`
- `apps/ledger-live-mobile/src/mvvm/components/DeviceContextInitialization/__tests__/...`
- Possibly E2E test scenario updates.

---

## Summary — Dependency graph

```
Step 1  (DeviceContextInitialization<InitInput> type in device-intent)
  │
  ├── Step 2  (ConnectAppInitializationInput type)
  │     │
  │     ├── Step 3  (Extract requirement resolution from app.ts)
  │     │
  │     ├── Step 4  (Extract wrong-device validation)
  │     │
  │     └── Step 5  (Extract pure deprecation presentation function)
  │           │
  │           └── Step 6  (buildConnectAppInitialization composer)
  │
  ├── Step 7  (DmkCompatTransport)
  │
  ├── Step 8  (ConnectAppInitJobState type + shared job)
  │     │     [depends on Steps 4, 5, 7 for validation, deprecation, derivation]
  │     │
  │     ├── Step 9   (MVVM component: Container + ViewModel + View)
  │     │
  │     └── Step 10  (Wire MVVM component into executor)
  │
  └── Step 11 (Wire into a real caller)
        │
        └── Step 12 (Integration tests)
```

Steps 3, 4, 5, 7 can be done in parallel once Step 2 is complete (Step 7 has no dependency on Step 2 either — it can start immediately).
Step 8 depends on Steps 4, 5, and 7 (it uses `validateDerivedAddress`, `decideDeprecationPresentation`, and `DmkCompatTransport`).
Steps 9 and 10 can start once Step 8 defines the job (the job implementation and UI component can progress in parallel). Note that `ConnectAppInitJobState` is defined in `types.ts` (Step 2), so the UI component can be started even before the job implementation is complete.
Step 11 should wait until at least one platform's initializer is fully wired (Step 10).

---

## Architecture overview

```
┌──────────────────────────────────────────────────────────────┐
│  Caller (send / receive / swap / debug)                      │
│                                                              │
│  buildConnectAppInitialization({ appRequest, flow, ... })    │
│  → DeviceContextInitialization<ConnectAppInitializationInput>        │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  DeviceIntentExecutor (libs/device-intent — unchanged)       │
│                                                              │
│  deviceContextInitialization → initializerComponent                  │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  MVVM: DeviceContextInitialization (LWM)                     │
│  apps/.../mvvm/components/DeviceContextInitialization/        │
│                                                              │
│  index.tsx (Container)                                       │
│    → useDeviceContextInitializationViewModel(...)            │
│    → <DeviceContextInitializationView jobState={...} />      │
│                                                              │
│  ViewModel: subscribes to connectAppInitJob                  │
│  View: renders ConnectAppInitJobState                        │
│  on done → onContextInitialized(extractedContext)            │
└──────────────┬──────────────────────────┬────────────────────┘
               │                          │
     ┌─────────▼─────────┐    ┌──────────▼──────────┐
     │  job.ts            │    │ View.tsx             │
     │  (libs/ — shared)  │    │ (MVVM — pure UI)    │
     │                    │    │                      │
     │  • DMK DA exec     │    │  switch(jobState) {  │
     │  • deprecation     │    │    "connect-device"  │
     │  • derivation      │    │    "deprecation-show"│
     │  • wrong-device    │    │    "wrong-device"    │
     │  • emits JobState  │    │    ...                │
     │                    │    │  }                    │
     └────────────────────┘    └──────────────────────┘
```

---

## What is NOT in scope of this plan

- **Desktop (LWD) initializer and UI component** — the shared code (types, job, pure functions in `libs/`) is structured to support desktop. When desktop is added, it will follow the same MVVM pattern with its own Container/ViewModel/View. This is deferred to a follow-up.
- Removing the legacy `DeviceAction` / `app.ts` path — it stays functional for non-DIE flows.
- Matching the old non-DMK `connectApp` path (`isLdmkConnectAppEnabled === false`) — out of scope. The parity target of this plan is the current DMK-enabled path only.
- Migrating other action families (transaction, sign-message, exchange) to DIE — those are separate work items that build on top of this connect-app initializer infrastructure.
- Defining a reusable wrong-device retry contract inside DIE — the first iteration only preserves mismatch detection and blocking semantics. Whether retry should be local to the initializer or routed through executor retry is deferred to a follow-up.
- Redesigning the `DeviceDeprecationScreen` component UI itself — the existing components are reused as-is.
- Handling the temporary mobile-only Nano S hardcoded deprecation for Aptos/Hedera — that workaround stays independent.

