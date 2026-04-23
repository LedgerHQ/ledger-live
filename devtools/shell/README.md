# @devtools/shell

The shell is the navigation and layout layer of the `devtools/` namespace. It owns the `<DevTools />` entry point that host apps embed, the sidebar, the tool routing, and the tool registry. It has no tool logic of its own.

## Responsibility

- Render the navigation shell (sidebar, overview, category grouping)
- Route to the active tool
- Expose `<DevTools />` as the single entry point for host apps
- Expose the registration primitives (`registerTool`, `registerToolWithRequiredProps`, `setupDevTools`) and the augmentable `DevToolsPropsRegistry` interface
- Maintain the runtime tool registry at `src/registry/tools.ts`, populated by tools as they register themselves

The shell is tool-agnostic — it imports no tool packages. Tools register themselves into the runtime registry; the host app orchestrates which tools are enabled via `setupDevTools([...])`.

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
│   ├── components/          # Shell UI components
│   ├── context/             # DevToolsProvider, useToolProps, useDevToolsProps
│   ├── hooks/               # Shell hooks (navigation, accordion, storage, status)
│   ├── registry/            # Runtime tool registry + register* primitives
│   ├── utils/               # Pure helpers (platform filter, status enrichment)
│   ├── categoryConfig.ts    # Category metadata
│   ├── types.ts             # Tool & Category types
│   ├── index.ts             # Web exports (declares DevToolsPropsRegistry)
│   └── index.native.ts      # Native exports
├── jest/                    # Test helpers and mocks
├── package.json
└── tsconfig.json
```
