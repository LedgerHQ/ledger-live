# MSW endpoint mocks

Integration tests fake the network, not modules: the real store, RTK Query and SDK clients run,
and each HTTP route is answered by a `jest.fn()` the test configures and asserts on.

Don't `jest.mock` API clients, services or RTK Query hooks, and keep handlers free of state and
branching. `jest.mock` is for what cannot run under Jest (native modules, device transport).

```ts
import { HttpResponse, http, server } from "tests/server"; // mobile: "@tests/server"

const endpoints = { push: jest.fn<Response, [{ request: Request }]>() };

beforeEach(() => {
  // mockImplementation, not mockReturnValue: a Response body can only be read once
  endpoints.push.mockReset().mockImplementation(() => HttpResponse.json({ status: "updated" }));
  server.use(http.post(`${BASE_URL}/live`, endpoints.push));
});

it("should push local data", async () => {
  // ...
  await waitFor(() => expect(endpoints.push).toHaveBeenCalledTimes(1));
  expect(await endpoints.push.mock.calls[0][0].request.json()).toMatchObject({ version: 8 });
});

it("should show an error when the push fails", async () => {
  endpoints.push.mockReturnValueOnce(HttpResponse.json({}, { status: 500 }));
  // ...
});
```

## Repo specifics

- App jest-setup resets handlers after each test: register them with `server.use` in `beforeEach`.
- App servers use `onUnhandledRequest: "bypass"`. A handler returning `undefined` still counts as a
  call (`toHaveBeenCalled` passes), but the request goes on to the default `tests/handlers` or the
  real network. Always set a default implementation.
- Packages without an app server (`shared/*`, `domain/*`, `features/*`, `libs/*`) call
  `setupServer` themselves, with `onUnhandledRequest: "error"`, or start the server their
  `domain/api/*` package ships ([packages.md](packages.md#domain-msw-handlers)).

## Examples

- [useWatchWalletSync.integration.test.ts](../../../../apps/ledger-live-desktop/src/mvvm/features/WalletSync/__integrations__/useWatchWalletSync.integration.test.ts)
- [createAuthenticatedBaseQuery.test.ts](../../../../shared/auth/src/createAuthenticatedBaseQuery.test.ts)
