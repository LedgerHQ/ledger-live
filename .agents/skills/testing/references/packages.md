# Testing packages in the layers

Packages under `shared/`, `domain/`, `features/` and `devtools/` run their own jest, configured by
a `@support/jest` preset. They have no app harness: no `tests/testSetup`, no `@tests/test-renderer`,
no app MSW server.

## Presets

The package declares `"@support/jest": "workspace:*"` in `devDependencies`, and its
`jest.config.js` exports one factory call:

| Preset | Default call | Packages |
| --- | --- | --- |
| `@support/jest/shared` | `createSharedJestConfig({ rootDir: __dirname })` | node logic: `shared/*`, `domain/*`, `features/platform/*` without UI |
| `@support/jest/shared` | `createSharedUiJestConfig()` | `shared/ui-*` with web and native tests |
| `@support/jest/shared` | `createSharedUiNativeJestConfig()` | `shared/ui-*` with native tests only |
| `@support/jest/features-flow` | `createFlowJestConfig()` | `features/flow/*`, `features/platform/*` that render UI |
| `@support/jest/features-flow` | `createFlowNativeJestConfig()` | the same, native tests only |
| `@support/jest/devtools` | `createWebJestConfig()`, `createNativeJestConfig()` in `jest.native.config.js` | `devtools/*` |
| `@support/jest/libs-coin` | `createLibsCoinJestConfig({ rootDir: __dirname })` | `libs/coin-modules/*`, `libs/wallet-btc` |

Start from the default call. The options, the overrides and how they merge are documented in
[support/jest/README.md](../../../../support/jest/README.md) and each preset's README: look them up
there when the package needs more, and don't copy them into docs, the factory API is still moving.

`pnpm lint:tool-config` fails a package that depends on `@support/jest` and exports anything but a
factory call. Most `domain/*` packages still carry a hand-written config from before the presets; a
new package starts from the factory.

Run a package's tests with `pnpm nx run <package-name>:test`, which builds its dependencies first
([repo commands](../../../../docs/repo-commands.md)).

## Web and native projects

A dual factory (`createFlowJestConfig`, `createSharedUiJestConfig`) runs two jest projects, picked
by file name:

- `*.web.test.ts(x)`: the `web` project, jsdom, `@testing-library/react`. Desktop code.
- `*.native.test.ts(x)`: the `native` project, node, `@testing-library/react-native` on mocked
  React Native. Mobile code.
- An unsuffixed `*.test.ts(x)` runs in `web` under `createFlowJestConfig`, and nowhere under
  `createSharedUiJestConfig`.

A test takes the suffix of the file it tests: `ContactsButton.web.test.tsx` next to
`ContactsButton.web.tsx`, `ContactsButton.native.test.tsx` next to `ContactsButton.native.tsx`
(`@features/flow-contacts`). A view model without platform code is tested once, in `web`.

Lumen is replaced by passthrough stubs that render their children: assert on your view and view
model wiring, not on Lumen's behaviour. Run one project with
`pnpm --filter <package-name> test --selectProjects native`.

## Where tests sit

- Next to the code, under `src/` (the presets' `roots`): `domain/entity/contact/src/slice.test.ts`.
- Mock factories in `*.mock.ts` beside what they mock (`schema.mock.ts`). They stay out of the
  barrel; another package reaches them through a subpath export, such as
  `@domain/entity-contact/schema.mock`.
- Helpers shared by several test files (store wrappers, render helpers) in `src/__tests__/`, with
  no `.test.` in their name so jest does not run them as suites.
- Except in `devtools/*`: the `@support/jest/devtools` web project keeps jest's default
  `testMatch`, which runs every file under `__tests__/` as a suite. Its helpers, fixtures and mocks
  go in the package's `jest/` folder and are imported as `jest/...`
  ([support/jest/devtools/README.md](../../../../support/jest/devtools/README.md)).

## Domain MSW handlers

A `domain/api/*` package that owns endpoints ships their MSW handlers and fixtures as mocks, so
every flow and app that calls them fakes them the same way. `@domain/api-card-management` exports,
from `./mock/card-api`: the URLs, the fixtures, the default handlers (`signedInCardApiHandlers`),
the failure variants, `listenToCardApi()`, which starts a server with
`onUnhandledRequest: "error"` and resets it after each test, and the thunk extra argument
`mockCardApiExtraArgument()`.

```ts
import { http, HttpResponse } from "msw";
import {
  CARD_TRANSACTIONS_URL,
  listenToCardApi,
} from "@domain/api-card-management/mock/card-api";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";

const server = listenToCardApi();

beforeEach(() => {
  server.use(http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())));
});
```

The package lists `msw` in its `devDependencies`. App integration tests reuse the same fixtures
with the app server (`tests/server`). The `jest.fn()` endpoint recipe of
[msw-endpoints.md](msw-endpoints.md) applies inside packages too.
