# Ensure App Ready

This folder contains the Ledger Live use cases for building and running the app-initialization flow built on top of DMK device actions.

The shared `EnsureAppReadyDeviceAction` orchestration lives in `@ledgerhq/live-dmk-shared`. This folder builds the input expected by the Device Intent Executor, builds the underlying connect-app device action, injects Live-specific side effects, and performs Live-specific final-state checks.

## Top-level files

- `ensureAppReadyUseCase.ts`: public use-case entry point. It starts `EnsureAppReadyDeviceAction` through DMK and forwards unexpected device-action errors as use-case states.
- `buildEnsureAppReadyInput.ts`: builds the `EnsureAppReadyInput` expected by the Device Intent Executor from the legacy `AppRequestInput` shape.
- `types.ts`: public request/input and side-effect contracts used by the use cases.

Shared app-request resolution and wrong-device validation still live in `hw/deviceInitialization/helpers` because they are also consumed by legacy connect-app flows.

## Internal Helpers

`helpers/` contains Live-specific collaborators used by `ensureAppReadyUseCase`:

- `buildConnectAppDAInput.ts`: converts initialization input into the input expected by `ConnectAppDeviceAction`.
- `buildFinalState.ts`: performs final success/wrong-device mapping using Live account identity rules.
- `ConnectAppSideEffectsHandler.ts`: observes device IDs and last-seen device information side effects.

The shared action owns connect-app orchestration, job-state mapping, deprecation presentation, and completion capture. Live-specific side effects are injected as an additional snapshot handler instance.

## Testing Guidance

- Test shared orchestration and generic snapshot mapping in `@ledgerhq/live-dmk-shared`.
- Test Live-specific input building, side effects, wrong-device validation, and final-state mapping in this package.
