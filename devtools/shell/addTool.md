# How to add a new tool

A tool is a standalone React component packaged as `@devtools/<id>`. Hosts opt in to a tool by listing it in the `toolLoaders` map passed to `<DevTools />`; the shell loads each tool lazily on first open and renders it inside the shell's navigation.

The host owns the `import()` call so the bundler can resolve the tool package against the host's own dependencies — the shell never imports a specific tool.

## 1. Reserve an ID

Add the tool's id constant to `@devtools/core`:

```ts
// devtools/core/src/index.ts
export const MY_TOOL_ID = parse("my-tool");
```

The id is the package's name suffix — `@devtools/<id>` must resolve. The shell does `import(\`@devtools/${id}\`)` to load the tool.

## 2. Define your props type

In a `types.ts` at the root of your tool package:

```ts
// devtools/my-tool/src/types.ts
export interface MyToolProps {
  value: string;
  onChange: (value: string) => void;
}
```

## 3. Write the component

The component receives its props directly — it does not need to know about the shell.

```tsx
// devtools/my-tool/src/MyTool.tsx
import type { MyToolProps } from "./types";

export function MyTool({ value, onChange }: MyToolProps) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} />
  );
}
```

A host can render `<MyTool ... />` anywhere with its own props — outside the shell too.

## 4. Default-export a tool descriptor

The package's entry exports a `ToolDescriptor` as `default`. The shell reads that default after loading the package.

```ts
// devtools/my-tool/src/index.ts
import { Category, MY_TOOL_ID, createTool } from "@devtools/core";
import type { ToolDescriptor } from "@devtools/core";
import { MyTool } from "./MyTool";
import type { MyToolProps } from "./types";

declare module "@devtools/core" {
  interface DevToolsPropsRegistry {
    [MY_TOOL_ID]?: MyToolProps;
  }
}

const descriptor: ToolDescriptor<typeof MY_TOOL_ID> = {
  id: MY_TOOL_ID,
  label: "My Tool",
  category: Category.CONFIGURATION,
  component: MyTool,
  owner: "Platform",
  desc: "Does something useful.",
  optional: false,
};

export default createTool(descriptor);

export { MY_TOOL_ID } from "@devtools/core";
export { MyTool } from "./MyTool";
export type { MyToolProps } from "./types";
```

**Why `?:` is required.** All entries in `DevToolsPropsRegistry` must be marked optional. The host opts into wiring each tool by passing its props; tools that aren't wired by the host still need to be expressible as "absent" in the registry type.

### `optional: true` vs `optional: false`

- **`optional: false`** — the host *must* pass props for this tool. The shell shows a "not configured" state if the host doesn't wire them.
- **`optional: true`** — the host may or may not pass props. The tool always renders. Use this for tools with all-optional props or no props at all.

## 5. Register the loader in `@devtools/registry`

`@devtools/registry` is the central map between a tool id and its `import("@devtools/<id>")` call. Add an entry there so every host can pick up the tool by id:

```ts
// devtools/registry/src/index.ts
import { MY_TOOL_ID, FEATURE_FLAGS_ID, ... } from "@devtools/core";

const ALL_LOADERS: Required<Record<ToolId, ToolLoader>> = {
  [FEATURE_FLAGS_ID]: () => import("@devtools/feature-flags"),
  [MY_TOOL_ID]: () => import("@devtools/my-tool"),
};
```

Because `@devtools/registry` depends on every tool package, importing from it also pulls each tool's `declare module "@devtools/core"` augmentation — `toolProps` stays typed in every host without per-tool side-effect imports.

## 6. Use the tool in a host app

Add `@devtools/registry` as a dependency and pick the tool by id:

```tsx
import { useMemo } from "react";
import { DevTools } from "@devtools/shell";
import { MY_TOOL_ID } from "@devtools/core";
import { getToolLoaders } from "@devtools/registry";

const TOOL_IDS = new Set([MY_TOOL_ID]);

export default function DevToolsPage() {
  const toolLoaders = useMemo(() => getToolLoaders(TOOL_IDS), []);
  const myToolProps = useMyToolProps(); // your hook returning a memoized MyToolProps

  const devToolsProps = useMemo(
    () => ({ [MY_TOOL_ID]: myToolProps }),
    [myToolProps],
  );

  return (
    <div style={{ height: "100vh" }}>
      <DevTools toolLoaders={toolLoaders} toolProps={devToolsProps} />
    </div>
  );
}
```

**Memoize `toolProps`.** The object passed to `<DevTools toolProps={...} />` becomes the context value for all tools. A new object on every render causes every consuming tool to re-render. Use `useMemo` against the underlying props. Keep `toolLoaders` module-scoped (or memoized) for the same reason.

### Skipping the registry

If a host needs a tool that isn't in `@devtools/registry` yet, build the loader map by hand. The host then has to take responsibility for pulling the type augmentation itself:

```tsx
import type {} from "@devtools/my-tool"; // side-effect: pulls the props type augmentation

const toolLoaders = {
  [MY_TOOL_ID]: () => import("@devtools/my-tool"),
};
```

## Notes

- A tool can be rendered standalone, outside the DevTools shell. The shell uses React context to inject the host's props at render time, but the component itself only depends on its declared props. Importing `MyTool` and passing props directly works anywhere in the host app.

- A tool can be restricted to a single platform via the `platform` field on the descriptor. Tools without a `platform` are rendered on both web and native. A tool tagged `platform: "web"` is hidden from native hosts (and vice versa) even if the host loads it.

```ts
const descriptor: ToolDescriptor<typeof MY_TOOL_ID> = {
  id: MY_TOOL_ID,
  label: "My Tool",
  category: Category.DEBUGGING,
  component: MyTool,
  platform: "web",
  optional: true,
};
```

In practice, hosts already pick which tools to load, so `platform` is rarely needed — it's a safety net.

- Use the `owner` field to identify the team responsible for the tool. The shell renders it as a tag next to the tool's title.

- `DevToolsPropsRegistry` lives in `@devtools/core`. Tool packages augment that interface; the shell reads it. Both sides import the same package specifier, which keeps the augmentation surface stable as the shell's internal layout evolves.
