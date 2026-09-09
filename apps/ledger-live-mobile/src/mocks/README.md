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

## Pay Card session renewal (LIVE-34741)

`src/mocks/card/handler.ts` mocks the OAuth2 renewal grant, so every branch of the Pay Card session
renewal can be driven by hand. It only intercepts `grant_type=refresh_token`; the login grant reaches
the real provider, so you can still sign in. It also answers the Card reads once its own mock tokens
are in play, because the provider rejects tokens it never issued.

Drive it from **Settings > Debug > DevTools > Card / Pay**, under "MSW Auth Renewal Mock". One button
per documented answer of `POST /v1/auth/oauth2/token`, named by status code so each matches the Baanx
API reference: 200, 400, 422, 498, 499 and 500, plus a slow 200, a 200 the schema rejects, and a
transport failure.

Only **200** and **200 slow** keep the session. Every other button ends it, which is the one renewal
rule — see "Renewal" in `@features/platform-card`. The buttons still differ, because a tester must
see that each documented status reaches that end, and by which route.

The panel works without MSW too: the buttons still call the real session accessors, and every request
reaches the real provider. Only the answer buttons and the renewal counter need `MSW_ENABLED=true`.

> [!IMPORTANT]
>
> **A handler runs twice for every request it passes through.** `msw/native` installs two
> interceptors, one on `fetch` and one on `XMLHttpRequest`, and React Native's `fetch` is
> `whatwg-fetch`, which is built on `XMLHttpRequest`. So a pass-through is performed with the real
> `fetch`, that `fetch` opens an `XMLHttpRequest`, and the second interceptor hands the same request
> back to the handler. A request the handler answers arrives once.
>
> So a Pay Card handler counts only what it answers. Do not count a pass-through here: count it in
> the client. The `[card api]` trace in `@shared/api-services` prints one line per request.

`src/mocks/card/state.ts` holds the switchboard the panel and the handler share. It lives on
`globalThis`, because the panel's props are built in `@devtools/bindings`, which cannot import from
an app.
