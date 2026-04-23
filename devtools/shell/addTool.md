# How to add a new tool

A tool is a standalone React component that can be rendered in any host app. To make it appear in the DevTools shell, the tool's package declares its props in the registry and exposes a registration function. Host apps then opt-in by calling that function.

## 1. Create an ID for the tool

In a `constants.ts` file at the root of your tool package:

```ts
// src/constants.ts
export const MY_TOOL_ID = "my-tool" as const;
```

The id must be unique across all tools. Re-registering the same id logs a warning and the second registration is ignored.

## 2. Define your props type

In a `types.ts` at the root of your tool package:

```ts
// src/types.ts
export interface MyToolProps {
  value: string;
  onChange: (value: string) => void;
}
```

## 3. Write the component

The component receives props directly — it does not need to know about the shell.

```tsx
// src/MyTool.tsx
import type { MyToolProps } from "./types";

export function MyTool({ value, onChange }: MyToolProps) {
  return (
    <div>
      <input value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
```

Because the component takes its props directly, it can be used outside the shell too — a host can render `<MyTool ... />` anywhere with its own props.

## 4. Register the tool

Create a `register.ts` at the root of your tool package. It augments the shell's props registry and exposes a registration function.

```ts
// src/register.ts
import { registerToolWithRequiredProps, Category } from "@devtools/shell";
import { MY_TOOL_ID } from "./constants";
import { MyTool } from "./MyTool";
import type { MyToolProps } from "./types";

declare module "@devtools/shell" {
  interface DevToolsPropsRegistry {
    [MY_TOOL_ID]?: MyToolProps;
  }
}

export function registerMyTool() {
  registerToolWithRequiredProps({
    id: MY_TOOL_ID,
    label: "My Tool",
    category: Category.CONFIGURATION,
    component: MyTool,
    owner: "Platform",
    desc: "Does something useful.",
  });
}
```

**Why `?:` is required.** All entries in `DevToolsPropsRegistry` must be marked optional. The host opts into wiring each tool by passing its props; tools that aren't wired by the host still need to be expressible as "absent" in the registry type.

### Choosing a register function

- **`registerToolWithRequiredProps`** — the host *must* pass props for this tool. Tools registered this way show a "not configured" state in the shell when the host doesn't wire them.
- **`registerTool`** — the host may or may not pass props. The tool always renders. Use this for tools with all-optional props, or tools with no props at all.

For a tool with no props, declare its registry entry as `Record<string, never>`:

```ts
declare module "@devtools/shell" {
  interface DevToolsPropsRegistry {
    [MY_TOOL_ID]?: Record<string, never>;
  }
}

export function registerMyTool() {
  registerTool({
    id: MY_TOOL_ID,
    label: "My Tool",
    category: Category.DEBUGGING,
    component: MyTool,
  });
}
```

## 5. Export from the package entry

```ts
// src/index.ts
export { MY_TOOL_ID } from "./constants";
export { registerMyTool } from "./register";
export { MyTool } from "./MyTool";
export type { MyToolProps } from "./types";
```

## 6. Use the tool in a host app

Add the tool package as a dependency, then register it at the host level and pass its props through `<DevTools>`:

```tsx
import { useMemo } from "react";
import { DevTools, setupDevTools } from "@devtools/shell";
import { registerMyTool, MY_TOOL_ID } from "@devtools/my-tool";

setupDevTools([registerMyTool]);

export default function DevToolsPage() {
  const myToolProps = useMyToolProps(); // your hook returning a memoized MyToolProps

  const devToolsProps = useMemo(
    () => ({ [MY_TOOL_ID]: myToolProps }),
    [myToolProps],
  );

  return (
    <div style={{ height: "100vh" }}>
      <DevTools toolProps={devToolsProps} />
    </div>
  );
}
```

`setupDevTools` runs every registration function in order. It returns the list of registered tools, which you can ignore.

**Memoize `toolProps`.** The object passed to `<DevTools toolProps={...} />` becomes the context value for all tools. A new object on every render causes every consuming tool to re-render. Use `useMemo` against the underlying props.

## Notes

- A tool can be rendered standalone, outside the DevTools shell. The shell uses React context to inject the host's props at render time, but the component itself only depends on its declared props. Importing `MyTool` and passing props directly works anywhere in the host app.

- A tool can be restricted to a single platform via the `platform` field on `registerTool` / `registerToolWithRequiredProps`. Tools without a `platform` are rendered on both web and native. A tool tagged `platform: "web"` is hidden from native hosts (and vice versa) even if the host registers it.

```ts
export function registerMyTool() {
  registerTool({
    id: MY_TOOL_ID,
    label: "My Tool",
    category: Category.DEBUGGING,
    component: MyTool,
    platform: "web",
  });
}
```

In practice, hosts already pick which tools to register, so `platform` is rarely needed — it's a safety net.

- Use the `owner` field to identify the team responsible for the tool. The shell renders it as a tag next to the tool's title.

- `DevToolsPropsRegistry` is declared in `@devtools/shell`'s public entry, so consumers augment the package specifier itself rather than a sub-path. This keeps the augmentation surface stable as the shell's internal layout evolves.