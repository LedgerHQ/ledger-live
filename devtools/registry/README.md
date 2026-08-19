# @devtools/registry

Static catalogue of every tool the DevTools shell can render. It is the single point of coupling between `@devtools/shell` and `@devtools/<tool>` packages.

## What it exports

- **`tools`** — a `const` map `{ [id]: ToolMetadata }`. The shell looks up each enabled tool's metadata by id.
- **`DevToolConfig`** — a discriminated union of `{ id: <literal>; config: <ToolProps> }`. One branch per registered tool. This is what types the array the host passes to `<DevTools config={...} />`.
- **`DevToolsConfig`** — `Array<DevToolConfig>`, re-exported by `@devtools/shell` for host convenience.
- **Type primitives** — `Category`, `Tool`, `ToolMetadata`, `ToolLoader`, `ToolPlatform`, `ToolId`, plus the zod schema `ToolMetadataSchema`.

## Tool metadata

A `ToolMetadata` is a plain object that describes a tool and how to load it:

```ts
import { Category, type ToolMetadata } from "@devtools/registry";

export const myTool: ToolMetadata = {
  label: "My Tool",
  category: Category.CONFIGURATION,
  owner: "Platform",
  desc: "Does something useful.",
  loader: () => import("@devtools/my-tool"),
  // icon, platform are all optional
};
```

`loader` returns the dynamic `import()` of the tool's package — `import("@devtools/<id>")`. The package's **default export** must be the React component the shell will render. The shell wraps the loader in `React.lazy` and renders it inside a Suspense boundary, so the chunk is fetched on first activation, not on shell mount.

The `loader` field, paired with a re-export of the tool's props type, is what keeps each tool fully decoupled: the shell never depends on a tool package, and tools never depend on the shell.

## Layout

```
registry/
└── src/
    ├── metadata/
    │   ├── <team>/                  # one folder per team
    │   │   ├── <tool>.ts            # one ToolMetadata + props type re-export per tool
    │   │   └── index.ts
    │   └── index.ts
    ├── types.ts                     # Category, Tool, ToolMetadata, ToolMetadataSchema, …
    └── index.ts                     # `tools` map + DevToolConfig union
```

Metadata is grouped by team so ownership is visible in the file tree. Each tool file owns:

1. The `ToolMetadata` constant for that tool.
2. A type re-export of the tool's props (`export type { MyToolProps } from "@devtools/my-tool"`) so the registry's `index.ts` can build the `DevToolConfig` union without importing the tool's implementation.

## Adding a tool

Run the generator — it handles all wiring automatically:

```sh
pnpm --filter @devtools/registry add-tool
```

The generator will rewrite the following files on every run — **do not edit them manually**:

- `src/registry.ts` — `tools` map, `DevToolConfig` union, all imports; fully rebuilt from the metadata folder
- `src/metadata/<team>/index.ts` — all team barrel files; wiped and regenerated
- `src/metadata/index.ts` — top-level metadata barrel; wiped and regenerated
- `package.json` — `dependencies` block; orphaned tool entries are removed, new ones are added

It also creates one file you are expected to fill in:

- `src/metadata/<team>/<tool>.ts` — the `ToolMetadata` constant and optional props type re-export for the new tool

## Runtime validation

`ToolMetadataSchema` is a zod schema that mirrors the `ToolMetadata` shape (minus the `loader` function, which can't be schema-validated). Use it if you ever load metadata from outside the codebase; under normal usage the type system is enough.
