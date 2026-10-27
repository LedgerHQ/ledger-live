---
name: wire-devtool
description: Wire an existing devtool package into host apps (LLD, LLM, web-tools) and optionally create bindings. Use when a tool under devtools/ must appear in an app's DevTools screen.
argument-hint: "<tool-name>"
---

# Wire Devtool

Reference: `devtools/README.md`.

Warning: `bindings`, `protocols`, `registry`, `relay`, `shell`, `transport`, `transport-panel`, and `wire` are internal platform packages, not tools: do not wire them. `feature-flags` is an example of a real tool.

## 1. Identify the tool

1. Ask for the tool name if not already provided as an argument or in context.
2. If `devtools/<tool-name>/` does not exist, stop and tell the user to generate it first:
   ```sh
   pnpm --filter @devtools/registry add-tool
   ```
3. If it exists, read only `devtools/<tool-name>/src/types.ts` to determine whether the tool has props (file present = has props). Do not read anything else.

## 2. Ask where to wire

```
AskUserQuestion({
  questions: [
    {
      question: "Which host apps should I wire this tool into?",
      header: "Host wiring",
      multiSelect: true,
      options: [
        { label: "LLD",       description: "apps/ledger-live-desktop" },
        { label: "LLM",       description: "apps/ledger-live-mobile" },
        { label: "web-tools", description: "apps/web-tools" },
      ]
    }
  ]
})
```

Stop here if the user selects none.

If the tool has props, check whether `devtools/bindings/src/use<ToolName>ToolProps.ts` already exists (a few older hooks are named `use<ToolName>DevToolProps.ts`, e.g. `useEnvDevToolProps.ts`).
- If it **exists**, skip to step 4 and use it directly.
- If it **does not exist**, ask:

```
AskUserQuestion({
  questions: [
    {
      question: "Should I create a bindings hook for this tool?",
      header: "Bindings",
      multiSelect: false,
      options: [
        { label: "Yes", description: "Create use<ToolName>ToolProps in @devtools/bindings and wire it into selected hosts." },
        { label: "No",  description: "Skip bindings — wire with config: undefined for now." },
      ]
    }
  ]
})
```

## 3. Create bindings (if requested)

Create `devtools/bindings/src/use<ToolName>ToolProps.ts`, a hook that reads from the host's state and returns the tool's props type (e.g. `useFeatureFlagsToolProps.ts`). Then re-export it from `devtools/bindings/src/index.ts`.

```ts
// devtools/bindings/src/useExampleToolProps.ts
import type { ExampleToolProps } from "@devtools/example";

export function useExampleToolProps(): ExampleToolProps {
  return {
    // TODO: replace with real selectors
    property: undefined,
  };
}
```

## 4. Wire into host apps

**In LLD** — `apps/ledger-live-desktop/src/mvvm/features/DevTools/screens/DevToolsScreen/useDevToolsScreenViewModel.ts`  
**In LLM** — `apps/ledger-live-mobile/src/mvvm/features/DevTools/screens/DevToolsScreen/useDevToolsScreenViewModel.ts`  
**In web-tools** — `apps/web-tools/src/pages/dev-tools.tsx`

The host **never imports from `@devtools/<tool>` directly** and **never needs a workspace dependency on the tool package**. The props type is already part of `DevToolsConfig` (from `@devtools/shell` → `@devtools/registry`), so TypeScript infers the correct `config` type from the `id` alone.

- **Propless tool**: add the entry with `config: undefined`. No import, no hook, no dep.
- **Tool with props**: import the bindings hook from `@devtools/bindings`, call it, pass the result as `config`.

```ts
// propless
{ id: "example", config: undefined }

// with props — only import is from @devtools/bindings
import { useExampleToolProps } from "@devtools/bindings";
const exampleToolProps = useExampleToolProps();
{ id: "example", config: exampleToolProps }
```

Add the entry to the `config` array:

```ts
const config: DevToolsConfig = useMemo(
  () => [
    { id: "feature-flags", config: featureFlagsToolProps },
    { id: "example", config: exampleToolProps }, // or config: undefined
  ],
  [featureFlagsToolProps, exampleToolProps],
);
```

## 5. Done

Suggest the user opens DevTools in the app to verify the tool appears.
