# @devtools/shell

The shell is the navigation and layout layer of the `devtools/` namespace. It owns the `<DevTools />` entry point that host apps embed, the sidebar, the tool routing, and the tool registry. It has no tool logic of its own.

## Responsibility

- Render the navigation shell (sidebar, overview, category grouping)
- Route to the active tool
- Expose `<DevTools toolLoaders={...} toolProps={...} />` as the single entry point for host apps
- Await each host-provided loader inside a Suspense boundary
- Surface failed tool loads as disabled rows without breaking the rest of the shell

The shell is tool-agnostic — it imports no tool packages. The contract types (`Category`, `DevToolsPropsRegistry`, `ToolId`, id constants) live in the sibling `@devtools/core` package.

## What is implemented

- **`<DevTools />`** — root component, web and native variants
- **Sidebar** — category and tool navigation
- **Overview** — landing screen listing all tools by category
- **ToolShell** — wrapper rendered around the active tool
- **CategoryCard / CategoryRow / ToolCard / ToolRow** — navigation primitives
- **`useDevToolsNavigation`** — navigation state hook
- **`useDevToolsStorage`** — persistence hook (web only)
- **`useAccordion`** — accordion state for category groups

## Package structure

```
shell/
├── src/
│   ├── DevTools/            # <DevTools /> entry point (web + native)
│   ├── components/          # Shell UI components (incl. Loading)
│   ├── context/             # DevToolsProvider, useToolProps, useToolBinding
│   ├── hooks/               # Shell hooks (navigation, accordion, storage)
│   ├── registry/            # useResolvedTools (lazy-load runtime)
│   ├── utils/               # Pure helpers (platform filter)
│   ├── categoryConfig.ts    # Category metadata
│   ├── types.ts             # Tool / ToolDescriptor type
│   ├── index.ts             # Web exports
│   └── index.native.ts      # Native exports
├── jest/                    # Test helpers and mocks
├── package.json
└── tsconfig.json
```
