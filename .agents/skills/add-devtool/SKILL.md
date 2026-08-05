---
name: add-devtool
description: Create a new devtool in the devtools folder
argument-hint: "<tool-name>"
---

# Add Devtool

Reference: `devtools/README.md`.

## Identify the tool

1. Ask for the tool name if not already provided as an argument or in context.
2. If `devtools/<tool-name>/` exists, read only enough from that folder to determine: its purpose (for `label` and `desc`), whether it exports a props type (for step 2), and whether it uses platform-specific files (for step 1). Do not read anything outside `devtools/<tool-name>/`.
3. If the tool does not exist yet, ask the user what it should do.

---

Warning: `bindings`, `protocols`, `registry`, `shell`, `transport`, `transport-panel`, and `wire` are internal platform packages, not tools — do not register them. `feature-flags` is an example of a real tool.

**Do not read any other package in the devtools folder at any point during these steps.** All necessary patterns and file contents are provided inline below.

## Steps

### 1. Create the tool package

If the target platform cannot be inferred from the diff or the user's description, ask:

```
AskUserQuestion({
  questions: [{
    question: "Which platform does this tool target?",
    header: "Platform",
    multiSelect: false,
    options: [
      { label: "Web only",          description: "Rendered in LLD and web hosts only." },
      { label: "Native only",       description: "Rendered in LLM only." },
      { label: "Both web & native", description: "Rendered on all platforms." },
    ]
  }]
})
```

**Web-only tool:**
```
devtools/my-tool/
├── src/
│   ├── MyTool.web.tsx
│   ├── types.ts
│   └── index.ts         ← web entry (used as "main")
├── package.json         # "name": "@devtools/my-tool", "private": true
├── tsconfig.json        # base: files: [], references to tsconfig.web.json
└── tsconfig.web.json
```

**Cross-platform tool (web + native):**
```
devtools/my-tool/
├── src/
│   ├── MyTool.web.tsx
│   ├── MyTool.native.tsx
│   ├── types.ts
│   ├── index.ts         ← web entry (used as "main")
│   └── index.native.ts  ← native entry (used as "react-native")
├── package.json         # "name": "@devtools/my-tool", "private": true
├── tsconfig.json        # base: files: [], references to both platform configs
├── tsconfig.web.json
└── tsconfig.native.json
```


**`package.json`** must have `"private": true` and the correct entry point fields so bundlers resolve the right platform file:

```json
{
  "name": "@devtools/my-tool",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "react-native": "src/index.native.ts",
  "types": "src/index.ts",
  "devDependencies": {
    "react": "catalog:"
  },
  "peerDependencies": {
    "react": ">=19"
  }
}
```

Web bundlers use `"main"` → `index.ts`. Native bundlers use `"react-native"` → `index.native.ts`. For a web-only tool, omit `"react-native"`.

**`tsconfig.json`** (base — no files, only references):
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.web.json" },
    { "path": "./tsconfig.native.json" }
  ]
}
```

**`tsconfig.web.json`**:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "moduleSuffixes": [".web", ""] },
  "include": ["src/**/*", "**/*.d.ts"],
  "exclude": ["node_modules", "src/**/*.native.*"]
}
```

**`tsconfig.native.json`**:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "moduleSuffixes": [".native", ""] },
  "include": ["src/**/*", "**/*.d.ts"],
  "exclude": ["node_modules", "src/**/*.web.*"]
}
```

Also register the new package in `devtools/tsconfig.json`:
```json
{ "path": "./my-tool" }
```

### 2. Define props (if needed)

```ts
// devtools/my-tool/src/types.ts
export interface MyToolProps {
  value: string;
  onChange: (value: string) => void;
}
```

### 3. Write the component

Always write a minimal placeholder — a single `<div>` (web) or `<Text>` (native) showing the tool name. The real UI is for the tool owner to build; this skill only wires the tool into the platform.

```tsx
// devtools/my-tool/src/MyTool.web.tsx
export default function MyTool() {
  return <div>My Tool</div>;
}
```

```tsx
// devtools/my-tool/src/MyTool.native.tsx
import { Text } from "@ledgerhq/lumen-ui-rnative";

export default function MyTool() {
  return <Text>My Tool</Text>;
}
```

### 4. Export from the package entry

Create one file per platform. Both must default-export the component and re-export the props type:

Use bare specifiers — no platform suffix in the import path. The bundler resolves the correct file via `moduleSuffixes` at build time.

```ts
// devtools/my-tool/src/index.ts  (web entry — "main")
import MyTool from "./MyTool";

export type { MyToolProps } from "./types"; // omit if prop-less
export default MyTool;
```

```ts
// devtools/my-tool/src/index.native.ts  (native entry — "react-native")
import MyTool from "./MyTool";

export type { MyToolProps } from "./types"; // omit if prop-less
export default MyTool;
```

For a web-only tool, create only `index.ts`.

### 5. Register in `@devtools/registry`

If the category or owner cannot be inferred, ask both at once before writing the metadata file. For unlisted teams or categories, the user can type the answer in chat.

Team names match the folder names under `shared/feature-flags/src/flags/` (stripping the `team-` prefix, consistent with `devtools/registry/src/metadata/platform/`). New teams may have been added — accept whatever the user types.

```
AskUserQuestion({
  questions: [
    {
      question: "Which category best fits this tool?",
      header: "Category",
      multiSelect: false,
      options: [
        { label: "Debugging",        description: "Inspect runtime state, logs, or errors." },
        { label: "Configuration",    description: "Toggle flags, settings, or environment values." },
        { label: "Features & flows", description: "Exercise or simulate product features." },
        { label: "Connectivity",     description: "Manage transports, devices, or network state." },
      ]
    },
    {
      question: "Which team owns this tool?",
      header: "Owner",
      multiSelect: false,
      options: [
        { label: "platform",         description: "" },
        { label: "wallet-xp",        description: "" },
        { label: "ptx",              description: "" },
        { label: "live-devices",     description: "" },
      ]
    }
  ]
})
```

**Before writing any file: add `@devtools/my-tool` to `devtools/registry/package.json` dependencies using the workspace protocol.** Without this the bundler cannot resolve the `loader` import and will crash.

```json
"@devtools/my-tool": "workspace:*"
```

**Add a metadata file** under `devtools/registry/src/metadata/<team>/my-tool.ts`:

```ts
import { Category, type ToolMetadata } from "../../types";

export type { MyToolProps } from "@devtools/my-tool"; // omit if prop-less

export const myTool: ToolMetadata = {
  label: "My Tool",
  category: Category.CONFIGURATION,
  owner: "Platform",
  desc: "Does something useful.",
  loader: () => import("@devtools/my-tool"),
  // platform: "web",    // set only to restrict to one platform
};
```

**Wire into `devtools/registry/src/index.ts`**:

```ts
import { myTool, type MyToolProps } from "./metadata/platform/my-tool";

export const tools = {
  "feature-flags": featureFlags,
  "my-tool": myTool,
} as const;

export type DevToolConfig =
  | { id: "feature-flags"; config: FeatureFlagsToolProps }
  | { id: "my-tool"; config: MyToolProps }
  | { id: "prop-less-tool"; config: undefined };
```

### 6. Wire into the host app

Before writing anything, always ask:

```
AskUserQuestion({
  questions: [{
    question: "Which host apps should I wire this tool into?",
    header: "Host wiring",
    multiSelect: true,
    options: [
      { label: "LLD",        description: "apps/ledger-live-desktop" },
      { label: "LLM",        description: "apps/ledger-live-mobile" },
      { label: "web-tools",  description: "apps/web-tools" },
    ]
  }]
})
```

Stop here if the user selects none.

**If the tool has props**, create `devtools/bindings/src/use<ToolName>Props.ts` with a hook that reads from the host app's state and returns the tool's props type. Then re-export it from `devtools/bindings/src/index.ts`. The host calls:

```ts
const myToolProps = useMyToolProps();
```

**In LLD** — `apps/ledger-live-desktop/src/mvvm/features/DevTools/screens/DevToolsScreen/useDevToolsScreenViewModel.ts`
**In LLM** — `apps/ledger-live-mobile/src/mvvm/features/DevTools/screens/DevToolsScreen/useDevToolsScreenViewModel.ts`
**In web-tools** — `apps/web-tools/src/pages/dev-tools.tsx`

Add the tool to the `config` array:

```ts
const config: DevToolsConfig = useMemo(
  () => [
    { id: "feature-flags", config: featureFlagsProps },
    { id: "my-tool", config: myToolProps },
  ],
  [featureFlagsProps, myToolProps],
);
```

### 7. Done

Suggest the user opens DevTools in the app to verify the tool appears and works correctly.
