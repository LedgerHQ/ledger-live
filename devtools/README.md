# DevTools

The **Ledger Live developer tools platform** — a cross-platform debug component that can be embedded in any Ledger Live app (Desktop, Mobile, Web).

## Overview

DevTools is a self-contained React component that surfaces developer tooling at runtime. It is completely isolated from the host application: it declares its own dependencies, accepts host state via props, and never reaches into the host's internals.

The goal is to replace the fragmented debug screens found in Desktop (Settings > Developer, ~30 tools) and Mobile (Settings > Debug, ~42 screens) with a single, extensible platform that every team can contribute to.

## Architecture

### Isolation

DevTools is unaware of its environment. Every piece of host-specific information (store state, actions, flags…) is passed in as props through a typed interface. The host app provides the data; DevTools provides the UI.

### Package structure

```
devtools/
├── shell/            # @devtools/shell — <DevTools /> entry point, navigation, layout
├── registry/         # @devtools/registry — static tool metadata + DevToolsConfig union
├── feature-flags/    # @devtools/feature-flags — Feature Flags tool
└── <tool-name>/      # @devtools/<tool-name> — any future tool
```

Each tool package is fully self-contained: its own `package.json`, types, logic, and UI. Nothing from one tool leaks into another.

**All packages must have `"private": true`.**

### How a tool is wired

The shell never imports a specific tool. Tools are connected through `@devtools/registry`:

- **Registry** declares each tool's metadata (`label`, `category`, `owner`, `platform`, …) plus a `loader: () => import("@devtools/<tool>")`. It also extends the `DevToolConfig` discriminated union with the tool's id and props type.
- **Shell** receives a `DevToolsConfig` (array of `{ id, config }`) from the host. For each entry it looks the id up in the registry, wraps the tool component in `React.lazy(loader)`, and renders it inside `<Suspense>`. Props from the entry are exposed through `useToolProps(id)`.
- **Tool packages** default-export a plain React component that takes its own props. They know nothing about the shell or the registry.
- **Host app** builds the `DevToolsConfig`, wiring each tool's props from its own state.

```
host app ──config──▶ <DevTools /> (shell) ──looks up id──▶ @devtools/registry ──loader()──▶ @devtools/<tool>
```

The `import()` lives in the registry, not the host or shell — the bundler resolves each tool package against the registry's own dependency graph, and tool packages stay completely decoupled.

## Internal structure of a tool package

The internal folder layout is free; organise it however fits the tool's complexity. The example below is a reference, not a requirement:

```
my-tool/
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
    ├── MyTool.tsx          ← default-exported from src/index.ts
    ├── types.ts            ← exports MyToolProps
    └── index.ts            ← `export default MyTool;` + public type/hook exports
```

A few rules:

### Maximize shared logic

Only the rendering layer should differ between platforms. State, data transformation, business rules, and hook logic must live in platform-neutral files (no suffix) and be shared by both `.web` and `.native` views. Duplicating logic across platforms is always wrong — if two files contain the same logic, extract it.

### Platform suffixes

Any file that has platform-specific content must use the `.web` or `.native` suffix. The bundler uses these suffixes to pick the right file at build time. A file with no suffix is shared by both platforms.

### Co-located tests

Test files live next to the file they test, not in a separate `__tests__` folder. This makes it obvious when a file has no test and keeps context close when reading or modifying code.

### MVVM for complex components

For any component with non-trivial interaction logic, extract a `useXxxViewModel` hook that owns all state and derived values. The view component calls the hook and maps the result to JSX — it contains no logic of its own. When the view model logic diverges per platform, add the platform suffix to the view model file too.

### Tool boundaries

- **Tools never import other tools.** No cross-tool dependencies, ever.
- **External dependencies are limited to `shared/`, `domain/`, and `features/`** for truly generic types or utilities (Zod schemas, RTK slices, selectors). If the import feels specific to your tool's domain, it belongs in the tool itself.
- **A tool's component never imports from `@devtools/shell` or `@devtools/registry`.** It takes its props directly so it can also be rendered standalone, outside the shell.

### Lazy loading

The shell calls `React.lazy(metadata.loader)` for each enabled tool and renders it inside a `<Suspense fallback={<Loading />}>` boundary. The tool package is fetched on first activation, not on shell mount.

## Packages

- `@devtools/shell` — `<DevTools />`, navigation, layout, lazy-load runtime, `DevToolsProvider` / `useToolProps`
- `@devtools/registry` — static map of tool metadata + `loader`s, and the `DevToolConfig` discriminated union that types host configs
- `@devtools/<tool>` — each tool package, default-exporting its React component

## Usage

The host imports `DevTools` and `DevToolsConfig` from the shell, and builds a typed config array:

```tsx
import { DevTools, type DevToolsConfig } from "@devtools/shell";
import { useFeatureFlagsToolProps } from "../hooks/useFeatureFlagsToolProps";

export default function DevToolsPage() {
  const featureFlagsProps = useFeatureFlagsToolProps();
  const config: DevToolsConfig = [
    { id: "feature-flags", config: featureFlagsProps },
  ];

  return (
    <div style={{ height: "100vh" }}>
      <DevTools config={config} />
    </div>
  );
}
```

`DevToolsConfig` is a discriminated union: TypeScript narrows `config` by `id`, so each entry's `config` has the right props type. Adding a new tool to the registry widens the union — existing host configs keep type-checking unchanged.

A tool the host doesn't list is simply not loaded. If a tool requires props, TypeScript will refuse a host config that omits it — the discriminated union enforces the wiring at compile time.

## Adding a new tool

See [`addTool.md`](./addTool.md) for the full walk-through.
