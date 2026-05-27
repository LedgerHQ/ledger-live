# @devtools/shell

The shell is the navigation and layout layer of the `devtools/` namespace. It owns the `<DevTools />` entry point that host apps embed, the sidebar, the tool routing, the Suspense boundary, and the React context that exposes per-tool props.

It has no tool logic of its own.

## Responsibility

- Render the navigation shell (sidebar, overview, category grouping)
- Route to the active tool
- Expose `<DevTools config={DevToolsConfig} />` as the single entry point for host apps
- Look each enabled tool up in `@devtools/registry`, wrap its component in `React.lazy(loader)`, and render it inside a Suspense boundary with the `Loading` fallback
- Expose host-provided props to tools via `DevToolsProvider` + `useToolProps`

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

- `<DevTools config={DevToolsConfig} />` — root component (web). The native build is exported from `index.native.ts`.
- `DevToolsProvider` — context provider that maps `id → config` for the rendered tools.
- `useToolProps(id)` — returns the unknown-typed config the host passed for `id`, or `undefined`.
- `DevToolsConfig` is re-exported from `@devtools/registry` for convenience.

## Package layout

```
shell/
├── src/
│   ├── DevTools/            # <DevTools /> entry point (web + native)
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
