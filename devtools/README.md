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
- **A tool's exports are consumed only by the host app**, never by the shell. Hosts list the ids they enable; the shell loads each enabled tool lazily by id.

### Lazy loading

The shell is tool-agnostic. It never imports a specific tool package. Each tool package exports a `ToolDescriptor` as its default export and augments `DevToolsPropsRegistry` (in `@devtools/core`) with its props type. The host opts in by passing a `toolLoaders` map — `{ [id]: () => import("@devtools/<id>") }` — to `<DevTools />`. The shell awaits all loaders on first render inside a Suspense boundary. A tool that fails to load (missing package, broken module) is reported as a failed entry; the rest of the shell keeps working.

The `import()` call lives in the host so the bundler resolves each tool against the host's own dependencies. Shell never declares a tool as a dependency.

## Packages

- `@devtools/core` — shared contract: `Category`, tool id constants, the `DevToolsPropsRegistry` interface
- `@devtools/shell` — `<DevTools />`, navigation, layout, lazy-load runtime
- `@devtools/registry` — central map of `{ id → import("@devtools/<id>") }` and a `getToolLoaders(ids)` helper that returns the loaders for the ids the host has opted into
- `@devtools/<tool>` — each tool, default-exporting its `ToolDescriptor`

## Usage

The recommended path: pick ids and let `@devtools/registry` resolve the loaders for you.

```tsx
import { useMemo } from "react";
import { DevTools } from "@devtools/shell";
import { MY_TOOL_ID } from "@devtools/core";
import { getToolLoaders } from "@devtools/registry";

const TOOL_IDS = new Set([MY_TOOL_ID]);

export default function DebugPage() {
  const toolLoaders = useMemo(() => getToolLoaders(TOOL_IDS), []);
  const myToolProps = useMyToolProps();
  const toolProps = useMemo(() => ({ [MY_TOOL_ID]: myToolProps }), [myToolProps]);

  return <DevTools toolLoaders={toolLoaders} toolProps={toolProps} />;
}
```

The host doesn't `import` the tool package — it just lists the ids. `@devtools/registry` owns every `import("@devtools/<id>")` call, so adding a new tool means adding one line in the registry, not editing every host. `toolProps` is still typed because `@devtools/registry` depends on every tool package, which transitively pulls each tool's `declare module "@devtools/core"` augmentation.

If you need to bypass the registry (e.g. a host enabling a tool that isn't yet listed there), build the map by hand:

```tsx
import type {} from "@devtools/my-tool"; // side-effect: pulls the props type augmentation

const toolLoaders = {
  [MY_TOOL_ID]: () => import("@devtools/my-tool"),
};
```

Memoize `toolProps` — it becomes a context value. Keep `toolLoaders` module-scoped (or memoized) for the same reason.

### Using a tool without the shell

If you only need a tool's component — a custom popup, a snapshot test, a one-off render — skip the shell and load it directly:

```ts
import { MY_TOOL_ID, loadTool } from "@devtools/core";
import { getToolLoaders } from "@devtools/registry";

const loaders = getToolLoaders([MY_TOOL_ID]);
const result = await loadTool(MY_TOOL_ID, loaders[MY_TOOL_ID]!);

if ("descriptor" in result) {
  const Component = result.descriptor.component;
  // render <Component {...myProps} /> however you want
} else {
  console.error(`failed to load ${result.id}`, result.error);
}
```

`loadTool` (in `@devtools/core`) runs the loader, unwraps `default`, and normalises failures into `{ id, error }` so success and failure share one shape. If you'd rather let exceptions propagate, call the loader directly: `const { default: tool } = await loaders[MY_TOOL_ID]!()`.

## Adding a new tool

See [`shell/addTool.md`](./shell/addTool.md) for the full walk-through. In short:

1. Add a new id constant to `@devtools/core`.
2. Create a package at `devtools/my-tool/` with `"private": true` and its own `package.json` (`@devtools/my-tool`).
3. Implement the component as a plain React component that takes its props directly — no shell imports inside the component itself.
4. In `src/index.ts`, augment `DevToolsPropsRegistry` with the tool's id → props mapping and default-export a `ToolDescriptor`.
5. Add the tool's `import()` entry to `@devtools/registry`.
6. In the host app, depend on `@devtools/registry`, pass `getToolLoaders(ids)` to `<DevTools toolLoaders={...} />`, and wire `toolProps`.
