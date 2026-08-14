# Pay Card Auth

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Cross-platform Pay Card authentication flow for Ledger Wallet.

## Usage

```tsx
import { CardLogin } from "@features/flow-pay-card-auth";

<CardLogin oauthConfig={oauthConfig} callback={callback} />;
```

`CardLogin` runs the whole login and shows nothing once it succeeds.

`oauthConfig` carries the OAuth client id and redirect URI: both are the app's to know, and the
provider matches the redirect URI verbatim. That same value goes to the authorization initiation, to
the secure browser — which needs it to know which callback ends the session — and to the token
exchange.

`callback` carries the OAuth redirect, when the app already has one. The app's router owns the deep
link, so it hands over the `code` and `state` it parsed. On mobile that is
`ledgerlive://paytab?code=…&state=…`, which react-navigation turns into route params. Desktop does not
pass it yet (LIVE-34740).

## The login

An XState 5 machine owns the journey. It is three files: the states, guards and transitions in
[`machine.ts`](./src/state/machine.ts), the asynchronous steps in
[`actors.ts`](./src/state/actors.ts), and the context, events and input in
[`types.ts`](./src/state/types.ts).

```text
PKCE minted and stored → authorize initiation → OS browser → redirect → state compared
→ code exchanged → session stored → attempt wiped → GET /v1/user
```

The machine holds no React, no redux and no platform API. Everything it touches is a port
(`src/state/ports.ts`), and `createCardLoginPorts` binds those ports to RTK Query, to this flow's PKCE
store and to `@features/platform-card`. That is what makes every path testable with plain
`jest.fn()`s — see `src/state/__tests__/machine.native.test.ts`.

Two secrets, two owners:

| Secret | Owner | Store |
| --- | --- | --- |
| PKCE `{ state, codeVerifier }` | this flow | `expo-secure-store` (native) / memory (web) |
| Access and refresh tokens | [`@features/platform-card`](../../platform/card/README.md) | `expo-secure-store` (native) / memory (web) |

The redirect can arrive twice, from the browser session and from the app's deep link. The first one
wins and the second is ignored.

Renewal, logout and the desktop redirect are later work (LIVE-34741, LIVE-34740).

App composition and DevTools consume shared Pay Card entity state through
`@domain/entity-pay-card`. Auth-only runtime state (`hasCard`) lives in this flow's
`payCardAuth` slice, exposed through `@features/flow-pay-card-auth/state`. Other Pay Card UI state is
owned by the flow it belongs to: the balance filter by `@features/flow-pay-card-balance` and the
feature-tour flag by `@features/flow-pay-card-feature-tour`.

## Card API

This flow owns no API code. The Card endpoints, their wire schemas and the generated hooks live in
[`@domain/api-card-management`](../../../domain/api/card-management/README.md), which injects them
into the shared `cardApi` service. `createCardLoginPorts` imports
`cardManagementApi` from there directly — that import is what triggers the injection.

## Platform resolution

Platform files live side by side (`.web` / `.native`). Imports omit the suffix; TypeScript
`moduleSuffixes` and the bundlers resolve the right file:

```ts
import { CardLoginView } from "./CardLoginView";
// → CardLoginView.web.tsx (desktop) or CardLoginView.native.tsx (mobile)
```

| Tooling | How it resolves |
| ------- | --------------- |
| TypeScript (IDE) | Solution-style `tsconfig.json` → `tsconfig.web.json` / `tsconfig.native.json` |
| Desktop (Rspack) | `.web` / unsuffixed |
| Mobile (Re.Pack) | `.native` / unsuffixed |
| Jest | Tests import `.web` / `.native` files explicitly |

| Platform         | File resolved                        |
| ---------------- | ------------------------------------ |
| Mobile (Re.Pack) | `CardLogin/index.native.tsx`         |
| Desktop (Rspack) | `CardLogin/index.web.tsx`            |

## Structure

This package follows the [Structure & Flow ADR](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117/Guideline+Monorepo+DDD+Re-architecture+Structure+Flow). Add optional directories only when the flow needs them; do not keep empty scaffolding.

```text
pay-card-auth/
├── package.json                            # Package metadata and public exports
└── src/
    ├── components/                         # Components shared by several screens
    │   └── CardLogin/
    │       ├── __tests__/
    │       │   ├── CardLoginView.native.test.tsx
    │       │   └── CardLoginView.web.test.tsx
    │       ├── CardLoginView.native.tsx     # Native presentational UI
    │       ├── CardLoginView.web.tsx        # Web presentational UI
    │       ├── index.native.tsx             # Native component container
    │       ├── index.web.tsx                # Web component container
    │       ├── openHostedLogin.native.ts    # Native secure-browser opener
    │       ├── openHostedLogin.web.ts       # Desktop browsing-context opener
    │       ├── types.ts                     # Component contracts
    │       └── useCardLoginViewModel.ts     # Shared state and orchestration
    ├── hooks/                              # Flow-local hooks
    ├── router/                             # Flow-local routing
    ├── state/
    │   ├── __tests__/                      # Machine, store, parser and slice tests
    │   ├── internals/
    │   │   └── attemptPayload.ts           # The PKCE key, and its encode/decode
    │   ├── actors.ts                       # The machine's asynchronous steps
    │   ├── attemptStore.native.ts          # PKCE in the keychain
    │   ├── attemptStore.web.ts             # PKCE in renderer memory
    │   ├── authorizeAttempt.ts             # Mints one CSRF state and PKCE pair
    │   ├── callbackUrl.ts                  # Reads `code` and `state` off a redirect URL
    │   ├── createCardLoginPorts.ts         # Binds the machine to RTK, the stores and the session
    │   ├── crypto.native.ts                # CSPRNG and SHA-256 through expo-crypto
    │   ├── crypto.web.ts                   # CSPRNG and SHA-256 through WebCrypto
    │   ├── errors.ts                       # Error kinds, and the 401 test
    │   ├── machine.ts                      # States, guards and transitions
    │   ├── ports.ts                        # What the machine needs from the outside
    │   ├── selectors.ts                    # Auth selectors
    │   ├── slice.ts                        # Auth-only runtime state (`hasCard`)
    │   ├── store.ts                        # Public state subpath
    │   └── types.ts                        # Flow types, machine types, auth Redux state
    ├── utils/                              # Flow-local helpers
    ├── index.native.ts                     # Native public API
    └── index.ts                            # Default/web public API
```

`hooks/`, `router/`, `screens/`, `state/`, and `utils/` are extension points. Add them only when the flow needs them.
