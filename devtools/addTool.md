# How to add a new tool

A tool is a standalone React component packaged as `@devtools/<id>`. The shell never imports it directly: it looks the tool up in `@devtools/registry`, where each tool is declared by a metadata object plus a lazy `loader: () => import("@devtools/<id>")`. The host opts in by listing the tool's id (and its props) in the `DevToolsConfig` array passed to `<DevTools />`.

## 1. Create the tool package

```
devtools/my-tool/
├── src/
│   ├── MyTool.tsx
│   ├── types.ts
│   └── index.ts
├── package.json   # "name": "@devtools/my-tool", "private": true
└── tsconfig.json
```

## 2. Define the props type (if needed)

```ts
// devtools/my-tool/src/types.ts
export interface MyToolProps {
  value: string;
  onChange: (value: string) => void;
}
```

## 3. Write the component

The component takes its props directly — it knows nothing about the shell or the registry.

```tsx
// devtools/my-tool/src/MyTool.tsx
import type { MyToolProps } from "./types";

export function MyTool({ value, onChange }: MyToolProps) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}

export default MyTool;
```

## 4. Default-export the component from the package entry

The registry's loader is `() => import("@devtools/<id>")`, which resolves to the package's default export. Re-export the props type so the registry can wire it into `DevToolConfig`.

```ts
// devtools/my-tool/src/index.ts
import MyTool from "./MyTool";

export type { MyToolProps } from "./types";

export default MyTool;
```

## 5. Register the tool in `@devtools/registry`

Add a metadata file under `metadata/<team>/<tool>.ts`:

```ts
// devtools/registry/src/metadata/team-platform/my-tool.ts
import { Category, type ToolMetadata } from "../../types";

export type { MyToolProps } from "@devtools/my-tool";

export const myTool: ToolMetadata = {
  label: "My Tool",
  category: Category.CONFIGURATION,
  owner: "Platform",
  desc: "Does something useful.",
  loader: () => import("@devtools/my-tool"),
  // platform: "web",       // omit to enable on both web and native
};
```

Then wire it into the registry index and `DevToolConfig` union:

```ts
// devtools/registry/src/index.ts
import { featureFlags, type FeatureFlagsToolProps } from "./metadata/team-platform/feature-flags";
import { myTool, type MyToolProps } from "./metadata/team-platform/my-tool";

export * from "./types";

export const tools = {
  "feature-flags": featureFlags,
  "my-tool": myTool,
} as const;

export type DevToolsConfig = Array<DevToolConfig>;

export type DevToolConfig =
  | { id: "feature-flags"; config: FeatureFlagsToolProps }
  | { id: "my-tool"; config: MyToolProps }
  | { id: "prop-less-tool"; config: undefined};
```

The `DevToolConfig` union is the single point where each tool's id is bound to its props type. Adding a tool means adding one branch to the union — every host that includes the tool gets full type-checking automatically.

### Restricting to one platform

Set `platform: "web"` or `platform: "native"` on the metadata to hide the tool from the other platform. Tools with no `platform` field render on both. They still need to be loaded by the host by passing the tool id at least.

## 6. Use the tool in a host app

The host imports `DevTools` and `DevToolsConfig` from the shell and builds a typed config array:

```tsx
import { DevTools, type DevToolsConfig } from "@devtools/shell";
import { useMyToolProps } from "../hooks/useMyToolProps";

export default function DevToolsPage() {
  const myToolProps = useMyToolProps();
  const config: DevToolsConfig = [
    { id: "my-tool", config: myToolProps },
  ];

  return (
    <div style={{ height: "100vh" }}>
      <DevTools config={config} />
    </div>
  );
}
```

Host-side props can come from any source — Redux selectors, context, a hand-rolled hook. The shell only sees the `config` object you pass.

`config` is consumed as a context value by `DevToolsProvider`; if you derive it from multiple selectors, memoize the entries so unrelated re-renders don't churn every tool.

## Notes

- A tool can be rendered standalone, outside the shell. The shell injects host props through React context at render time, but the component itself only depends on its declared props — `import MyTool from "@devtools/my-tool"` and pass props directly works anywhere in the host app.
- Use the `owner` field to identify the team responsible for the tool. The shell renders it as a tag next to the tool's title.
- `ToolMetadata` is validated at the type level via `ToolMetadataSchema` (zod). The schema is also exported from `@devtools/registry` for runtime validation if you need it.
