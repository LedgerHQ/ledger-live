# @devtools/shell

The shell is the navigation and layout layer of the `devtools/` namespace. It owns the `<DevTools />` entry point that host apps embed, the sidebar, the tool routing, and the tool registry. It has no tool logic of its own.

## Responsibility

- Render the navigation shell (sidebar, overview, category grouping)
- Route to the active tool
- Expose `<DevTools />` as the single entry point for host apps
- Maintain `tools.config.ts` — the registry that maps tool descriptors to their component entry points

The shell is the only package in `devtools/` that imports from tool packages. It does so exclusively through `tools.config.ts`.

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
│   ├── hooks/               # Shell hooks
│   ├── tools.config.ts      # Tool registry
│   ├── categoryConfig.ts    # Category metadata
│   ├── types.ts             # Tool & Category types
│   ├── index.ts             # Web exports
│   └── index.native.ts      # Native exports
├── jest/                    # Test helpers and mocks
├── package.json
└── tsconfig.json
```

## Notes

- `"private": true` — not published to npm.
- React `>=19` is a peer dependency — the host app provides it.
- No build step: `main` and `types` in `package.json` point directly at `src/index.ts`. The consuming bundler compiles the TypeScript source.

