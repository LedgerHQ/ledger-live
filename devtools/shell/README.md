# @devtools/shell

The shell is the navigation and layout layer of the `devtools/` namespace. It owns the `<DevTools />` entry point that host apps embed, the sidebar, the tool routing, the Suspense boundary, and the React context that exposes per-tool props.

It has no tool logic of its own.

## Responsibility

- Render the navigation shell — **web** uses a sidebar; **native** uses a nested
  react-navigation stack (`categories` → `tools` → `tool`)
- Route to the active tool
- Expose `<DevTools config={DevToolsConfig} />` as the single entry point for host apps
- Look each enabled tool up in `@devtools/registry`
- Expose host-provided props to tools via `DevToolsProvider` + `useToolProps`

### Native embedding contract

The native `<DevTools />` is stateless — navigation lives in react-navigation. It
renders a **nested stack navigator** and therefore requires:

- a host-provided `NavigationContainer` somewhere above it (one per app — the shell
  never creates its own), and
- the host to pass header chrome via the `screenOptions` prop (a custom `header`),
  mirroring how `apps/ledger-live-mobile` configures its navigators. Screens are
  body-only and set their title with `navigation.setOptions`.

Navigation — including **leaving** DevTools — is the host's concern: the back button
pops within the stack, and on the root screen (where there is nothing to pop) the
host's header provides the exit affordance. The shell exposes no `onQuit`; the host
wires quit into the header it passes via `screenOptions`, the same way
`apps/ledger-live-mobile` owns the header's close button.

This adds `@react-navigation/native`, `@react-navigation/native-stack` and
`react-native-screens` as (optional, native-only) peer dependencies.

The shell is tool-agnostic — it imports no tool packages. Tool metadata and the `DevToolsConfig` union type live in `@devtools/registry`.

## Public API

```ts
import {
  DevTools,
  DevToolsProvider,
  useToolProps,
  type DevToolsProps,
  type DevToolsConfig,
} from "@devtools/shell";
```

- `<DevTools config={DevToolsConfig} />` — root component (web). The native build is exported from `index.native.ts` and additionally accepts `screenOptions?: NativeStackNavigationOptions` for host header chrome.
- `DevToolsProvider` — context provider that maps `id → config` for the rendered tools.
- `useToolProps(id)` — returns the unknown-typed config the host passed for `id`, or `undefined`.
- `DevToolsConfig` is re-exported from `@devtools/registry` for convenience.

## Usage

Pass a `config` array (`{ id, config }` per enabled tool, in display order).

### Web

```tsx
import { DevTools } from "@devtools/shell";

<DevTools config={[{ id: "feature-flags", config: featureFlagsProps }]} />;
```

### Native

The native build is stateless and renders a nested stack, so the host owns the
`NavigationContainer` and provides the header via `screenOptions`:

```tsx
import { DevTools } from "@devtools/shell"; // resolves to index.native
import { NavigationContainer } from "@react-navigation/native";

<NavigationContainer>
  <DevTools
    config={[{ id: "feature-flags", config: featureFlagsProps }]}
    screenOptions={{ header: MyHeader }}
  />
</NavigationContainer>;
```

## Package layout

```
shell/
├── src/
│   ├── DevTools/            # <DevTools /> entry point (web + native)
│   │   └── screens/         # native route screens (categories, tools, tool)
│   ├── components/          # Shell UI components (incl. Loading)
│   ├── context/             # DevToolsProvider, useToolProps
│   ├── hooks/               # Shell hooks (navigation, accordion, storage)
│   ├── utils/               # Pure helpers (platform filter)
│   ├── categoryConfig.ts    # Category metadata
│   ├── index.ts             # Web exports
│   └── index.native.ts      # Native exports
├── jest/                    # Test helpers and mocks
├── addTool.md               # Step-by-step guide for adding a new tool
├── package.json
└── tsconfig.json
```

