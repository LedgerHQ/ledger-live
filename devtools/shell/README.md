# @devtools/shell

The shell package of the `devtools/` namespace. It exposes the root `<DevTools />` component that host applications embed to surface developer tooling.

## Goal

Provide a single, composable entry point for Ledger Live developer tools that can be dropped into any platform-specific app (web, desktop, mobile) without the host needing to know what tools are inside.

## What is implemented

- **`<DevTools />`** — a React component exported from `src/index.ts`. Currently renders a placeholder `<div>` that acts as the mount point for the tools panel.
- **Package wiring** — the package is registered in the pnpm workspace under `devtools/*` and consumed by `@ledgerhq/web-tools` as a workspace dependency.

## Usage

```tsx
import { DevTools } from "@devtools/shell";

export default function MyPage() {
  return (
    <main>
      <DevTools />
    </main>
  );
}
```

## Package structure

```
devtools/shell/
├── src/
│   ├── index.ts        # public exports
│   └── DevTools.tsx    # root component
├── package.json
└── tsconfig.json
```

## Notes

- React `>=19` is a peer dependency — the host app provides it.
- No build step: the package is source-first. `main` and `types` in `package.json` point directly at `src/index.ts`, so the consuming bundler picks up the TypeScript source without a compilation step.
