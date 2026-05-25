# @apps/swap

Module Federation **remote** consumed by `apps/ledger-live-mobile`. Exposes a `HelloWorld` component as `RemoteApp/HelloWorld`.

## Architecture

- MF container name: `RemoteApp`
- Container file: `RemoteApp.container.js.bundle`
- Manifest URL the host fetches: `http://localhost:9000/${platform}/mf-manifest.json`
- Exposed modules: `./HelloWorld` → `./src/HelloWorld`

Bundling is done by `@callstack/repack` + `@rspack/core` via `rspack.config.cjs`. No Metro, no native projects — the host (`apps/ledger-live-mobile`) drives the device.

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

Then run the mobile host the usual way; the Portfolio screen lazy-imports `RemoteApp/HelloWorld` and the host's reducer registry (`@shared/mobile-host-runtime`) shares Redux state with this remote.
