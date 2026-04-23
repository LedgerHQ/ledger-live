# DevTools

The **Ledger Live developer tools platform** — a cross-platform debug component that can be embedded in any Ledger Live app (Desktop, Mobile, Web).

## Overview

DevTools is a self-contained React component that surfaces developer tooling at runtime. It is completely isolated from the host application: it declares its own dependencies, accepts external state via parameters, and never reaches into the host's internals.

The goal is to replace the fragmented debug screens found in Desktop (Settings > Developer, ~30 tools) and Mobile (Settings > Debug, ~42 screens) with a single, extensible platform that every team can contribute to.

## Architecture

### Isolation

DevTools is unaware of its environment. Every piece of host-specific information (store state, actions, flags…) is passed in as props through a typed interface. The host app provides the data; DevTools provides the UI.

### Package structure

Each tool is an independent package. The shell is a separate package whose only responsibility is navigation, layout, and providing the registration primitives. Neither the shell depends on tools nor do tools depend on each other — the host app is the only place that knows which tools are enabled.

```
devtools/
├── shell/            # @devtools/shell — <DevTools /> entry point, navigation, layout
├── feature-flags/    # @devtools/feature-flags — Feature Flags tool
├── <tool-name>/      # @devtools/<tool-name> — any future tool
└── tsconfig.json
```

Each tool package is fully self-contained: its own `package.json`, types, logic, and platform-specific UI. Nothing from one tool leaks into another.

**All packages must have `"private": true`** 

## Internal structure

The internal folder layout of a package is free — organise it however fits the tool's complexity. The example below is a reference, not a requirement:

```
my-package/
└── src/
    ├── components/
    │   └── MyComponent/
    │       ├── MyComponent.web.tsx
    │       ├── MyComponent.native.tsx
    │       ├── MyComponent.web.test.tsx
    │       └── MyComponent.native.test.tsx
    ├── hooks/
    │   ├── useMyHook.ts
    │   └── useMyHook.test.ts
    ├── utils/
    │   ├── myUtils.ts
    │   └── myUtils.test.ts
    └── types.ts
```

A few rules should be respected as they help maintaining tools and adding new ones.

### Maximize shared logic

Only the rendering layer should differ between platforms. State, data transformation, business rules, and hook logic must live in platform-neutral files (no suffix) and be shared by both `.web` and `.native` views. Duplicating logic across platforms is always wrong — if two files contain the same logic, extract it.

### Platform suffixes

Any file that has platform-specific content must use the `.web` or `.native` suffix. The bundler uses these suffixes to pick the right file at build time. A file with no suffix is shared by both platforms.

### Co-located tests

Test files live next to the file they test, not in a separate `__tests__` folder. This makes it obvious when a file has no test and keeps context close when reading or modifying code.

### MVVM for complex components

For any component with non-trivial interaction logic, extract a `useXxxViewModel` hook that owns all state and derived values. The view component calls the hook and maps the result to JSX — it contains no logic of its own. When the view model logic diverges per platform, add the platform suffix to the view model file too.

```
MyComponent/
├── MyComponent.web.tsx             ← thin view, calls useMyComponentViewModel
├── MyComponent.native.tsx          ← thin view, calls useMyComponentViewModel
├── useMyComponentViewModel.ts      ← shared logic
└── useMyComponentViewModel.web.ts  ← when web logic diverges from mobile
```

### Tool boundaries

A tool is almost entirely driven by props passed by the host. It must not reach into external state on its own.

- **Tools never import other tools.** There are no cross-tool dependencies, ever.
- **External dependencies are limited to `shared/`, `domain/`, and `features/`** for truly generic types or utilities (Zod schemas, RTK slices, selectors). If the import feels specific to your tool's domain, it belongs in the tool itself.
- **A tool's exports are consumed only by the host app**, never by the shell. Hosts import each tool's registration function and pass them to `setupDevTools` from `@devtools/shell`.

### Runtime registration

The shell is tool-agnostic. Each tool package exports a registration function (e.g. `registerMyTool`) that calls `registerTool` or `registerToolWithRequiredProps` from `@devtools/shell`, adding itself to the shell's runtime registry and declaring its props in `DevToolsPropsRegistry` via module augmentation. The host app orchestrates which tools are enabled by calling `setupDevTools([registerToolA, registerToolB, ...])` at bootstrap. The shell never imports a specific tool.

## Usage

```tsx
import { useMemo } from "react";
import { DevTools, setupDevTools } from "@devtools/shell";
import { registerMyTool, MY_TOOL_ID } from "@devtools/my-tool";

setupDevTools([registerMyTool]);

export default function DebugPage() {
  const myToolProps = useMyToolProps();
  const toolProps = useMemo(() => ({ [MY_TOOL_ID]: myToolProps }), [myToolProps]);

  return <DevTools toolProps={toolProps} />;
}
```

`setupDevTools` runs each registration function in order, populating the shell's runtime registry. `toolProps` carries per-tool props via React context — memoize it to keep consumers stable.

## Adding a new tool

See [`shell/addTool.md`](./shell/addTool.md) for the full walk-through. In short:

1. Create a package at `devtools/my-tool/` with `"private": true` and its own `package.json` (`@devtools/my-tool`).
2. Implement the component as a plain React component that takes its props directly — no shell imports inside the component itself.
3. In a `register.ts`, augment `DevToolsPropsRegistry` with the tool's id → props mapping and export a `registerMyTool()` function that calls `registerTool` (no required wiring) or `registerToolWithRequiredProps` (host must wire it).
4. In the host app, add `@devtools/my-tool` as a dependency, call `setupDevTools([registerMyTool])` at bootstrap, and pass props via `<DevTools toolProps={...} />`.
