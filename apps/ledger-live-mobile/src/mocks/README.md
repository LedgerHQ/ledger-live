Mocking API calls in development (MSW)

Enable

- Set env var before starting Metro: `MSW_ENABLED=true pnpm start -- --reset-cache` or `pnpm start:msw -- --reset-cache`.

How it works

- `index.js` imports `src/mocks/init`, which checks `MSW_ENABLED` and starts the worker.
- `init.ts` loads `polyfills.ts` first (adds TransformStream for React Native).
- Handlers live in `src/mocks/handlers.ts` and are registered via `src/mocks/server.ts`.

Add/edit mocks

- Update `src/mocks/handlers.ts` to intercept requests. Example:

```ts
import { http, HttpResponse } from "msw";
import { mockAssets } from "./dada/mockAssets";

export default [
  http.get("https://dada.api.ledger-test.com/v1/assets", () => {
    return HttpResponse.json(mockAssets);
  }),
];
```

Verify

- Look for console logs:
  - `MSW: Starting Mock Service Worker`
  - `MSW: Dada request intercepted`

Disable

- Or start normally: `pnpm start  -- --reset-cache`.
