# @apps/swap

Module Federation **remote** consumed by `apps/ledger-live-mobile`. Exposes a `HelloWorld` component as `swap/HelloWorld`.

## Architecture

- MF container name: `swap`
- Container file: `swap.container.js.bundle`
- Manifest URL the host fetches: `http://localhost:9000/${platform}/mf-manifest.json`
- Exposed modules: `./HelloWorld` → `./src/HelloWorld`

Bundling is done by `@callstack/repack` + `@rspack/core` via `rspack.config.cjs`. No Metro, no native projects — the host (`apps/ledger-live-mobile`) drives the device.

## Declaring & injecting the module

`@module-federation/bridge-react` is DOM/`react-dom`-only and cannot run under React Native. Since MF exposed modules are already loaded behind the federation runtime's async boundary, the producer just exports a plain component; the host owns loading + error handling via `createRemoteComponent` (from `@shared/mobile-host-runtime`):

- **Producer** (`src/HelloWorld.tsx`) — the exposed entry is the component itself. It can import non-eager shared deps (`react-redux`, `@reduxjs/toolkit`, `@shared/mobile-host-runtime`) directly and runs `import "./state/register"` to register the `swap` Redux slice on load. No lazy/`Suspense` indirection needed.

- **Consumer** (mobile host) — `createRemoteComponent` injects the remote with a loading state and an error fallback (a down dev server / failed bundle no longer crashes the host screen):

  ```tsx
  const HelloWorld = createRemoteComponent<{ name?: string }>({
    loader: () => import("swap/HelloWorld"),
    loading: <ActivityIndicator />,
    fallback: () => <Text>Couldn't load swap module</Text>,
  });
  ```

## Shared singletons

Versions must stay in lockstep with the host's `shared` block (`apps/ledger-live-mobile/rspack.config.mjs`):

- `react`, `react-native`
- `react-redux`, `@reduxjs/toolkit`
- `@shared/mobile-host-runtime`

Workspace catalog (`pnpm-workspace.yaml`) is the source of truth.

## Develop

```sh
pnpm --filter @apps/swap start            # dev server on :9000
pnpm --filter @apps/swap typecheck
```

Then run the mobile host the usual way; the Portfolio screen imports `swap/HelloWorld` and the host's reducer registry (`@shared/mobile-host-runtime`) shares Redux state with this remote.
