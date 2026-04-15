# Connect App in DIE — Implementation Plan

## Context

This plan covers the integration of the three overlooked connect-app requirements into the Device Intent Executor (DIE) framework:

1. **Device deprecation** — config-driven pre-intent gate (warn / block / skip)
2. **Required context derivation from account input** — shared builder from rich domain input to `DeviceContextInitialization`
3. **Wrong-device check** — post-derivation validation before intent execution

It is based on:

- [Connect App in DIE study](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6974111840)
- [Connect App UI spec](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6974144593)
- [Connect App - product specification (current implementation)](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6974275662)
- The existing `libs/device-intent` implementation
- The existing `migration.md` in `libs/ledger-live-common/src/hw/actions/`

### Current state of the codebase

| Component | Status |
|---|---|
| `libs/device-intent` core (executor, state machine, types) | Implemented |
| `RequiredDeviceContext`, `DeviceExtractedContext` | Implemented |
| `DeviceContextInitializerComponent` type | Implemented |
| `DeviceContextInitializerComponentLWM` (mobile) | WIP — basic connect-app only, no derivation/deprecation/wrong-device |
| `DeviceContextInitialization<InitInput>` wrapper | Proposed in ADR, not implemented |
| `ConnectAppInitializationInput` type | Proposed, not implemented |
| `buildConnectAppInitialization` builder | Proposed, not implemented |
| `deviceContextInitialization/` module | Proposed, not implemented |
| Pure deprecation presentation function | Not implemented (logic is inlined in React components) |
| Wrong-device normalization | Not implemented (logic is inlined in `app.ts`) |
| `DmkCompatTransport` (derivation without `withDevice`) | Not implemented |

### Guiding principles

- **Logic-first, UI-last**: pure functions, types, and the shared job first; platform-specific rendering last.
- **Incremental**: each step is independently testable and can be merged separately.
- **Legacy parity**: keep the legacy `DeviceAction` / `app.ts` path working until migration is complete.
- **Shared before platform-specific**: extract shared logic into `libs/` before touching `apps/`.

### Key architectural decision: connect-app init as a job + component

The connect-app initialization logic (DMK device action execution, deprecation handling, derivation, wrong-device check) is structured following the same **job + component** pattern used by intents:

- A **shared job** (in `libs/`) wraps `ConnectAppDeviceAction`, handles deprecation, performs derivation, validates wrong-device. It returns an `Observable<ConnectAppInitJobState>`.
- Each platform provides a **UI component** that renders `ConnectAppInitJobState`.
- `DeviceContextInitializerComponentLWM` is a **thin shell**: a `useEffect` runs the job, the platform component renders the state, and on job success the shell calls `onContextInitialized`. (Desktop will follow the same pattern later.)

This does **not** change the DIE core at all. `DeviceContextInitializerComponent` type stays as-is. This is purely an internal implementation strategy for the initializer.

Benefits:

- The complex logic lives in a shared `libs/` job — single source of truth, testable without React.
- The per-platform component is **only UI rendering** — the only thing that truly differs between mobile and desktop.
- The thin initializer shell is trivially identical on both platforms.
- It establishes the same pattern that future intent jobs follow, making the codebase more consistent.

---

## File inventory

### New files

| File | Description |
|---|---|
| `libs/ledger-live-common/src/hw/deviceContextInitialization/types.ts` | `ConnectAppInitializationInput`, `ExpectedAccountIdentity`, `DeprecationPresentationInput` types |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/requirements.ts` | `resolveAppRequestRequirements`, `toRequiredDeviceContext`, `toConnectAppRequest` — shared requirement resolution extracted from `app.ts` |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/validation.ts` | `buildExpectedAccountIdentity`, `validateDerivedAddress` — wrong-device check logic |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/deprecation.ts` | `decideDeprecationPresentation` — pure deprecation presentation decision function |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/index.ts` | `buildConnectAppInitialization` — top-level composer from `AppRequest` to `DeviceContextInitialization<ConnectAppInitializationInput>` |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/job/types.ts` | `ConnectAppInitJobState` discriminated union |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/job/connectAppInitJob.ts` | Shared job: wraps `ConnectAppDeviceAction`, handles deprecation/derivation/wrong-device, emits `Observable<ConnectAppInitJobState>` |
| `libs/ledger-live-common/src/hw/deviceContextInitialization/job/index.ts` | Re-exports for the job module |
| `libs/live-dmk-shared/src/transport/DmkCompatTransport.ts` | Lightweight `Transport` subclass wrapping a DMK session for `getAddress` calls without `withDevice` |
| `apps/ledger-live-mobile/src/components/device-intent-executor/ConnectAppInitComponent.tsx` | Mobile UI component rendering `ConnectAppInitJobState` (pure rendering, no logic) |

### Modified files

| File | Description |
|---|---|
| `libs/device-intent/src/core.ts` | Add `DeviceContextInitialization<InitInput>` type |
| `libs/device-intent/src/executor.ts` | Replace `requiredDeviceContext` with `deviceContextInitialization` on executor and initializer component props |
| `libs/device-intent/src/DeviceIntentExecutor.tsx` | Pipe `deviceContextInitialization` through to the initializer component |
| `libs/device-intent/src/useDeviceIntentExecutor.ts` | Adapt hook to use `deviceContextInitialization` |
| `libs/device-intent/src/DeviceIntentExecutorStateMachine.ts` | Update state machine context to use `deviceContextInitialization` |
| `libs/device-intent/src/deriveHookState.ts` | Adapt state derivation for the new prop shape |
| `libs/device-intent/src/__tests__/*` | Update existing tests for the new prop shape |
| `libs/ledger-live-common/src/hw/actions/app.ts` | Refactor `inferCommandParams` to delegate to `resolveAppRequestRequirements` |
| `apps/ledger-live-mobile/src/components/device-intent-executor/DeviceContextInitializerComponentLWM.tsx` | Rewrite as thin shell: `useEffect` runs the shared job, renders `ConnectAppInitComponent` |
| `apps/ledger-live-mobile/src/components/device-intent-executor/index.tsx` | Update to pass `deviceContextInitialization` instead of `requiredDeviceContext` |

---

## Step 1 — Introduce `DeviceContextInitialization<InitInput>` in `libs/device-intent`

### Goal

Replace the flat `requiredDeviceContext` prop on the executor with a higher-level `DeviceContextInitialization` wrapper that carries both device requirements and initializer-side metadata.

### Changes

**`libs/device-intent/src/core.ts`** — add new type:

```ts
type DeviceContextInitialization<InitInput = void> = {
  requiredContext: RequiredDeviceContext;
  input: InitInput;
};
```

**`libs/device-intent/src/executor.ts`** — update `DeviceIntentExecutorProps`:

- Replace `requiredDeviceContext: RequiredDeviceContext` with `deviceContextInitialization: DeviceContextInitialization<any>`
- Update `DeviceContextInitializerComponent` props: replace `requiredDeviceContext` with `deviceContextInitialization: DeviceContextInitialization<any>` (the initializer receives the whole wrapper as a single prop and extracts what it needs)

**`libs/device-intent/src/DeviceIntentExecutor.tsx`** and **`useDeviceIntentExecutor.ts`** — pipe `deviceContextInitialization` through to the initializer component, extracting `requiredContext` and `input` where needed.

**`libs/device-intent/src/DeviceIntentExecutorStateMachine.ts`** — update context and transitions to use `deviceContextInitialization` instead of `requiredDeviceContext`.

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
- `apps/ledger-live-mobile/src/components/device-intent-executor/*` (update to new prop shape)

---

## Step 2 — Define `ConnectAppInitializationInput` type

### Goal

Define the initializer-side metadata type that carries connect-app-specific policy data, separate from `RequiredDeviceContext`.

### Changes

**New file: `libs/ledger-live-common/src/hw/deviceContextInitialization/types.ts`**

```ts
import type { FlowName } from "../device-action/utils";

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
```

This type is purely data — no callbacks, no UI concerns.

### Files touched

- `libs/ledger-live-common/src/hw/deviceContextInitialization/types.ts` (new)

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

**`libs/ledger-live-common/src/hw/actions/app.ts`** — refactor `inferCommandParams` to call `resolveAppRequestRequirements` internally:

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
  dismissedCurrencies: string[];
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
}): DeviceContextInitialization<ConnectAppInitializationInput> {
  const resolved = resolveAppRequestRequirements(params.appRequest);
  const requiredContext = toRequiredDeviceContext(resolved);

  const expectedAccount = params.appRequest.account
    ? buildExpectedAccountIdentity(params.appRequest.account)
    : undefined;

  const deprecation =
    params.flow && params.currencyName
      ? { flow: params.flow, currencyName: params.currencyName }
      : undefined;

  return {
    requiredContext,
    input: { expectedAccount, deprecation },
  };
}
```

Re-export all public symbols from `index.ts`.

### Tests

- Integration-style unit tests: given a full `AppRequest` with account + flow, verify the output `DeviceContextInitialization` has correct `requiredContext`, `expectedAccount`, and `deprecation`.

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

### Tests

- Unit test: `isDmkTransport(new DmkCompatTransport(mockDmk, "session-1"))` returns `true`.
- Unit test: `exchange()` calls `dmk.sendApdu()` and returns the correct `Buffer`.

### Files touched

- `libs/live-dmk-shared/src/transport/DmkCompatTransport.ts` (new)

---

## Step 8 — Define `ConnectAppInitJobState` and implement the shared job

### Goal

Create a shared connect-app initialization **job** in `libs/` that wraps `ConnectAppDeviceAction` execution, handles deprecation, performs derivation, validates wrong-device, and emits a typed `ConnectAppInitJobState` observable. This follows the same job+component pattern used by intents.

### `ConnectAppInitJobState` — shared discriminated union

**New file: `libs/ledger-live-common/src/hw/deviceContextInitialization/job/types.ts`**

This is the typed state emitted by the job, covering all connect-app UI spec states (S00–S15):

```ts
type ConnectAppInitJobState =
  // Device readiness
  | { type: "connect-device" }
  | { type: "unlock-device" }
  | { type: "locked-device" }

  // Manager permission
  | { type: "request-manager-permission" }

  // App dependency management
  | { type: "listing-apps" }
  | { type: "installing-app"; appName: string; progress: number; index: number; total: number }

  // App navigation
  | { type: "request-quit-app" }
  | { type: "request-open-app"; appName: string }

  // Deprecation gates (require user interaction)
  | { type: "deprecation-show"; decision: DeprecationPresentationDecision & { kind: "show" };
      onContinue: () => void; onDismiss?: (currencyName: string) => void }
  | { type: "deprecation-block"; decision: DeprecationPresentationDecision & { kind: "block" } }

  // Wrong device
  | { type: "wrong-device"; accountName: string }

  // Outdated app warning
  | { type: "outdated-app-warning"; appName: string; onContinue: () => void }

  // Transient loading
  | { type: "loading" }

  // Terminal
  | { type: "error"; error: unknown }
  | { type: "done"; extractedContext: DeviceExtractedContext };
```

### Connect-app init job — shared Observable function

**New file: `libs/ledger-live-common/src/hw/deviceContextInitialization/job/connectAppInitJob.ts`**

```ts
function connectAppInitJob(params: {
  dmk: DeviceManagementKit;
  sessionId: string;
  requiredDeviceContext: RequiredDeviceContext;
  initInput: ConnectAppInitializationInput;
  dismissedCurrencies: string[];
}): Observable<ConnectAppInitJobState>
```

This function:

1. Instantiates `ConnectAppDeviceAction` with:
   - `application`, `dependencies` from `requiredDeviceContext`
   - `requireLatestFirmware`, `allowMissingApplication` from `requiredDeviceContext`
   - `deprecationConfig` from `getDeprecationConfig(appName, dependencies)`
   - `requiredDerivation`: when `requiredDeviceContext.requiresDerivation` is set, provides an async callback that:
     1. Creates a `DmkCompatTransport` from the DMK session (Step 7)
     2. Wraps the call with `dmk._unsafeBypassIntentQueue({ bypass: true/false })` (matching current `connectApp.ts` behavior)
     3. Calls `getAddress(transport, { currency, ...derivationRest })` and returns the derived address
2. Runs `dmk.executeDeviceAction(...)` and maps the DMK state observable to `ConnectAppInitJobState`:
   - Maps `requiredUserInteraction` values to the corresponding state variants (`connect-device`, `unlock-device`, `request-manager-permission`, `request-open-app`, `request-quit-app`, etc.)
   - Maps `installPlan` intermediate values to `installing-app` states
   - On `requiredUserInteraction === "device-deprecation"`: reads `initInput.deprecation`, calls `decideDeprecationPresentation(...)` with `dismissedCurrencies`, and emits the corresponding `deprecation-show` / `deprecation-block` / or silently calls `onContinue(false)` for `skip`
   - On `DeviceActionStatus.Completed`: runs `validateDerivedAddress(initInput.expectedAccount, output.derivation)` — if mismatch, emits `wrong-device`; if match or no-check, emits `done` with `DeviceExtractedContext`
   - On `DeviceActionStatus.Error`: emits `error`

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
  - Derivation: verify `DmkCompatTransport` is constructed and `getAddress` called with correct params
  - Derivation: verify `_unsafeBypassIntentQueue` is called with `true` before and `false` after
  - Deprecation skip: deprecation intermediate → `decideDeprecationPresentation` returns skip → `onContinue(false)` called → flow continues
  - Deprecation show: deprecation intermediate → emits `deprecation-show` → external call to `onContinue` → flow continues
  - Deprecation block: emits `deprecation-block` → `onContinue(true)` → error
  - Wrong device: derivation complete → address mismatch → emits `wrong-device`
  - Error: DMK error → emits `error`

### Files touched

- `libs/ledger-live-common/src/hw/deviceContextInitialization/job/types.ts` (new)
- `libs/ledger-live-common/src/hw/deviceContextInitialization/job/connectAppInitJob.ts` (new)
- `libs/ledger-live-common/src/hw/deviceContextInitialization/job/index.ts` (new, re-exports)

---

## Step 9 — Implement mobile UI component for `ConnectAppInitJobState`

### Goal

Create the mobile React component that renders `ConnectAppInitJobState`. This is the visual layer only — no logic, no DMK calls, just mapping state to UI.

**New file: `apps/ledger-live-mobile/src/components/device-intent-executor/ConnectAppInitComponent.tsx`**

```tsx
type Props = {
  jobState: ConnectAppInitJobState | undefined;
};

const ConnectAppInitComponent: React.FC<Props> = ({ jobState }) => {
  if (!jobState) return <LoadingSpinner />;

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
    case "request-quit-app":
      return /* Quit app device animation */;
    case "request-open-app":
      return /* Open app device animation */;
    case "deprecation-show":
      return <DeviceDeprecationScreen /* warning / clearSigning variant */ />;
    case "deprecation-block":
      return <DeviceDeprecationScreen /* blocking variant */ />;
    case "wrong-device":
      return /* Wrong device for account error */;
    case "outdated-app-warning":
      return /* Outdated app warning with continue/update */;
    case "loading":
      return <LoadingSpinner />;
    case "error":
      return /* Error screen */;
    case "done":
      return null; // shell handles onContextInitialized
  }
};
```

### Approach

- **Reuse existing rendering helpers** from `rendering.tsx` (e.g. `renderAllowManager`, `renderRequestQuitApp`, `renderAllowOpeningApp`).
- **Reuse existing `DeviceDeprecationScreen`** from `DeviceAction/Screen/DeviceDeprecationScreen.tsx`.
- **Reuse or adapt `renderInWrongAppForAccount`**.
- **Do not remove the legacy `DeviceAction` branches** — the legacy path must continue working.

### Files touched

- `apps/ledger-live-mobile/src/components/device-intent-executor/ConnectAppInitComponent.tsx` (new)

---

## Step 10 — Wire the job + component into `DeviceContextInitializerComponentLWM`

### Goal

Rewrite the mobile initializer component as a thin shell that runs the shared job and renders the platform component.

**`apps/ledger-live-mobile/src/components/device-intent-executor/DeviceContextInitializerComponentLWM.tsx`** — rewrite:

```tsx
const DeviceContextInitializerComponentLWM: DeviceContextInitializerComponent = ({
  deviceContextInitialization, // DeviceContextInitialization<ConnectAppInitializationInput>
  connectionResult,
  onContextInitialized,
  onError,
}) => {
  const initInput = deviceContextInitialization.input as ConnectAppInitializationInput;
  const { requiredContext } = deviceContextInitialization;
  const [jobState, setJobState] = useState<ConnectAppInitJobState | undefined>();
  const dismissedCurrencies = useSelector(/* deprecationDoNotRemind from settings */);

  useEffect(() => {
    const subscription = connectAppInitJob({
      dmk: connectionResult.dmk,
      sessionId: connectionResult.sessionId,
      requiredDeviceContext: requiredContext,
      initInput,
      dismissedCurrencies,
    }).subscribe({
      next(state) {
        setJobState(state);
        if (state.type === "done") {
          onContextInitialized(state.extractedContext);
        }
      },
      error(err) {
        onError(err);
      },
    });

    return () => subscription.unsubscribe();
  }, [/* deps */]);

  return <ConnectAppInitComponent jobState={jobState} />;
};
```

The shell is:

1. A `useEffect` that subscribes to the shared job observable.
2. A render of the platform component with the current job state.
3. A callback to `onContextInitialized` when the job reaches `done`.

### Files touched

- `apps/ledger-live-mobile/src/components/device-intent-executor/DeviceContextInitializerComponentLWM.tsx` (rewrite)

---

## Step 11 — Wire `buildConnectAppInitialization` into a real caller

### Goal

Integrate the full pipeline end-to-end by wiring `buildConnectAppInitialization` into at least one real connect-app-based flow.

### Changes

- In the chosen caller flow, replace manual `requiredDeviceContext` construction with:

```ts
const deviceContextInitialization = buildConnectAppInitialization({
  appRequest: { account: mainAccount, tokenCurrency },
  flow: FlowName.send,
  currencyName: getCurrencyName(request),
});
```

- Pass `deviceContextInitialization` to `DeviceIntentExecutor` instead of `requiredDeviceContext`.
- Verify the full pipeline: builder → executor → initializer shell → shared job → platform component → `onContextInitialized` → intent execution.

### Suggested first target

The mobile debug flow (`DebugDeviceIntentExecutor`) is the safest first target since it's already integrated with the DIE and doesn't affect production.

### Files touched

- `apps/ledger-live-mobile/src/screens/Settings/Debug/Connectivity/DebugDeviceIntentExecutor.tsx` (or equivalent)
- Then progressively: real flow callers.

---

## Step 12 — Integration tests and validation

### Goal

Validate end-to-end behavior across all deprecation scenarios and wrong-device scenarios.

### Test matrix

| Scenario | Expected |
|---|---|
| No deprecation config | Initialization proceeds directly |
| Warning config, matching flow/coin | Warning screen shown, continue proceeds |
| Warning + clear-signing, matching flow/coin | Both screens shown sequentially |
| Warning, dismissed currency | Warning auto-skipped |
| Warning, non-matching flow | Warning auto-skipped |
| Warning, exception currency | Warning auto-skipped |
| Blocking error, matching flow/coin | Blocking screen, initialization fails |
| Blocking error, non-matching flow | Error auto-skipped |
| Wrong device (address mismatch) | Wrong-device screen shown, retry available |
| Correct device (address match) | Initialization proceeds |
| No derivation requested | No wrong-device check |
| No account provided | No wrong-device check |

### Files touched

- Test files in `libs/ledger-live-common/src/hw/deviceContextInitialization/__tests__/`
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
  │     ├── Step 9   (Mobile UI component)
  │     │
  │     └── Step 10  (Wire job+component into LWM initializer shell)
  │
  └── Step 11 (Wire into a real caller)
        │
        └── Step 12 (Integration tests)
```

Steps 3, 4, 5, 7 can be done in parallel once Step 2 is complete (Step 7 has no dependency on Step 2 either — it can start immediately).
Step 8 depends on Steps 4, 5, and 7 (it uses `validateDerivedAddress`, `decideDeprecationPresentation`, and `DmkCompatTransport`).
Steps 9 and 10 can start once Step 8 defines the `ConnectAppInitJobState` type (the job implementation and UI component can progress in parallel).
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
│  deviceContextInitialization.requiredContext → initializerComponent  │
│  deviceContextInitialization.input           → initializerComponent │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  DeviceContextInitializerComponentLWM  (thin shell)          │
│                                                              │
│  useEffect → connectAppInitJob(...)  → Observable<JobState>  │
│  render    → <ConnectAppInitComponent jobState={...} />      │
│  on done   → onContextInitialized(extractedContext)          │
└──────────────┬──────────────────────────┬────────────────────┘
               │                          │
     ┌─────────▼─────────┐    ┌──────────▼──────────┐
     │  connectAppInitJob │    │ ConnectAppInitComp.  │
     │  (libs/ — shared)  │    │ (apps/mobile — LWM   │
     │                    │    │  UI rendering only)  │
     │  • DMK DA exec     │    │                      │
     │  • deprecation     │    │  switch(jobState) {  │
     │  • derivation      │    │    "connect-device"  │
     │  • wrong-device    │    │    "deprecation-show"│
     │  • emits JobState  │    │    "wrong-device"    │
     │                    │    │    ...                │
     └────────────────────┘    └──────────────────────┘
```

---

## What is NOT in scope of this plan

- **Desktop (LWD) initializer and UI component** — the shared code (types, job, pure functions in `libs/`) is structured to support desktop, but `DeviceContextInitializerComponentLWD` and the desktop `ConnectAppInitComponent` are deferred to a follow-up. The desktop shell will follow the exact same thin-shell pattern.
- Removing the legacy `DeviceAction` / `app.ts` path — it stays functional for non-DIE flows.
- Migrating other action families (transaction, sign-message, exchange) to DIE — those are separate work items that build on top of this connect-app initializer infrastructure.
- Redesigning the `DeviceDeprecationScreen` component UI itself — the existing components are reused as-is.
- Handling the temporary mobile-only Nano S hardcoded deprecation for Aptos/Hedera — that workaround stays independent.
- `passWarning` / outdated-app acceptance — the study flags this as an open question. It can join the initializer input model later.
