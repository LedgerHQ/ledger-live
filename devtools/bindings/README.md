# @devtools/bindings

Builders that turn Ledger Live app state into the props each `@devtools` tool expects — **one builder per tool if props are needed**. Apps consume these instead of re-implementing the wiring in every host, so the glue has a single home and a single test suite.

Keep tools decoupled from the app. The builder is the only bridge between app implementation and debug tools.

## Import

This package may import `@devtools/registry`, may import a tool's props types only through `import type`, and may import no other `@devtools/*` package. It names each tool's props types without loading the tool. `DEVTOOLS_ALLOWED_IMPORTS`, `DEVTOOLS_TYPE_ONLY_IMPORTS` and `DEVTOOLS_TYPE_ONLY_RULE` in [`constraints.js`](../../tools/nx-plugins/enforce-boundaries/constraints.js) set what it may import from `@devtools/*`. The [devtools import boundary skill](../../.agents/skills/devtools-import-boundary/SKILL.md) explains why.

## Builders

| Hook | Tool | Behaviour |
| ---- | ---- | --------- |
| `useFeatureFlagsToolProps()` | `feature-flags` | Reads `overrides`/`resolved` from the `featureFlags` slice (`@shared/feature-flags` + `@features/platform-feature-flags`) and wires `setOverride` / `setAllOverrides` / `clearOverride` / `clearAllOverrides` to the slice actions. Requires the host to register that slice (desktop, mobile and web-tools already do). |
| `useAccountDetailToolProps()` | `account-detail` | Analytics card section: reads `hasDismissed` from the `accountAnalyticsIntroduction` slice (`@features/flow-account-detail-analytics-notice`) and wires `onReset` to `resetAccountAnalyticsIntroduction`. Requires the host to register that slice (desktop and mobile already do). |
| `useDeviceOnboardingToolState({ snapshot, portsRef })` | `device-onboarding` | Builds the debug view of a run: `log` (newest 200 rows), `machineContext` and `nextStates`. Pass its `inspect` to `useDeviceOnboardingActor` from `@features/platform-device-onboarding`, which runs the actor, so the log starts at the actor's creation. |
| `useDeviceOnboardingToolProps({ session, toolState, featureFlag })` | `device-onboarding` | Assembles the tool props from the host's product session, the tool state and the optional feature-flag switches. |
| `usePredictionsToolProps(liveAppStore, setup)` | `predictions` | Reads the Predictions intro flag (`@domain/entity-predictions`) and what each environment of the live app stored (`onboarding-state` in its Wallet API storage, through the host's `liveAppStore`), and wires the resets. Previews the trading wallet setup through the host's `setup`: `usePredictionsSetupHooks()` from `@features/flow-predictions` and the failure reasons, passed in so loading the bindings doesn't load the Predictions UI. |

Future tools add their own builder + row here, each depending only on the state it needs.

## Usage

```tsx
import { DevTools, type DevToolsConfig } from "@devtools/shell";
import { useFeatureFlagsToolProps } from "@devtools/bindings";

function DebugDevTools() {
  const config: DevToolsConfig = [{ id: "feature-flags", config: useFeatureFlagsToolProps() }];
  return <DevTools config={config} />;
}
```
