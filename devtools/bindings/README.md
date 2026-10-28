# @devtools/bindings

Builders that turn Ledger Live app state into the props each `@devtools` tool expects — **one builder per tool if props are needed**. Apps consume these instead of re-implementing the wiring in every host, so the glue has a single home and a single test suite.

Keep tools decoupled from the app. The builder is the only bridge between app implementation and debug tools.

## Import

Within the `@devtools/*` scope, this package may import `@devtools/registry`, and a tool's props types through `import type` only, so the tool stays lazily loaded. Any other `@devtools/*` import is forbidden. The [devtools import boundary skill](../../.agents/skills/devtools-import-boundary/SKILL.md) has the full table.

## Builders

| Hook | Tool | Behaviour |
| ---- | ---- | --------- |
| `useFeatureFlagsToolProps()` | `feature-flags` | Reads `overrides`/`resolved` from the `featureFlags` slice (`@shared/feature-flags` + `@features/platform-feature-flags`) and wires `setOverride` / `setAllOverrides` / `clearOverride` / `clearAllOverrides` to the slice actions. Requires the host to register that slice (desktop, mobile and web-tools already do). |

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
