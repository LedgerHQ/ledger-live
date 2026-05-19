# DevTools

The **Ledger Live developer tools platform** — a cross-platform debug component that can be embedded in any Ledger Live app (Desktop, Mobile, Web).

## Overview

DevTools is a self-contained React component that surfaces developer tooling at runtime. It is completely isolated from the host application: it declares its own dependencies, accepts external state via parameters, and never reaches into the host's internals.

The goal is to replace the fragmented debug screens found in Desktop (Settings > Developer, ~30 tools) and Mobile (Settings > Debug, ~42 screens) with a single, extensible platform that every team can contribute to.

## Architecture

### Isolation

DevTools is unaware of its environment. Every piece of host-specific information (store state, actions, flags…) is passed in as props through a typed interface. The host app provides the data; DevTools provides the UI.

### Package structure

Each tool is an independent package. The shell is a separate package whose only responsibility is navigation, layout, and wiring tools together. Tools know nothing about the shell; the shell depends on tools.

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
- **The only consumer of a tool's exports is `tools.config.ts`** in the shell, which stores the component entry point. Nothing else imports from a tool package.

## Usage

```tsx
import { DevTools } from "@devtools/shell";

export default function DebugPage() {
  return <DevTools />;
}
```

## Adding a new tool

1. Create a package at `devtools/my-tool/` with its own `package.json` (`@devtools/my-tool`).
2. Implement the tool entirely inside that package — types, logic, and UI. Use `.web` / `.native` suffixes for platform-specific files.
3. Add `@devtools/my-tool` as a workspace dependency of `@devtools/shell`.
4. Register the tool in `shell/src/tools.config.ts` — descriptor and component entry point. The shell renders tools from this config; it does not import tool packages anywhere else.

```ts
{
  id: "my-tool",
  label: "My Tool",
  category: Category.DEBUGGING,
  owner: "YourTeam",
  desc: "One-line description.",
  component: MyTool, // imported from @devtools/my-tool
}
```
