# `@features/platform-devtools`

Builders that turn app state into the props each `@devtools` tool expects — **one
builder per tool if props are needed**. Apps consume these instead of re-implementing the wiring in every host. This package is the shared home for that glue; it is not tied to any
single tool or technology — each builder pulls from whatever source its tool needs
(a redux slice, a service, a context, an API…).

Tool contracts are referenced **type-only** from `@devtools/registry`
(`DevToolsConfig`), which is the source of every tool's `{ id, config }` type.
Anchoring on the registry pins each builder's output to the real contract without
pulling the shell or any tool's UI — so tools stay lazily loaded by the shell, and
this package keeps **no runtime dependency** on `@devtools/*`.

## Builders

| Hook | Tool | Behaviour |
| ---- | ---- | --------- |
| `useFeatureFlagsToolProps()` | `feature-flags` | Reads `overrides`/`resolved` from the `featureFlags` slice (`@shared/feature-flags` + `@features/platform-feature-flags`) and wires `setOverride` / `setAllOverrides` / `clearOverride` / `clearAllOverrides` to the slice actions. Requires the host to register that slice (desktop, mobile and web-tools already do). |

Future tools add their own builder + row here, each depending only on the state it
needs.

## Usage

```tsx
import { DevTools, type DevToolsConfig } from "@devtools/shell";
import { useFeatureFlagsToolProps } from "@features/platform-devtools";

function DebugDevTools() {
  const config: DevToolsConfig = [{ id: "feature-flags", config: useFeatureFlagsToolProps() }];
  return <DevTools config={config} />;
}
```
