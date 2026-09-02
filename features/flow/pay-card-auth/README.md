# Pay Card Auth

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Cross-platform Pay Card authentication flow for Ledger Wallet.

## Usage

```tsx
import { CardLogin, CardMore } from "@features/flow-pay-card-auth";

<CardLogin oauthConfig={oauthConfig} callback={callback} />
<CardMore />;
```

Two components, one for each direction, and each one decides whether it belongs on screen. `CardLogin`
runs the whole login, and shows nothing once the card holder is signed in. `CardMore` does the
opposite: it shows a `More` tile-button that opens the `More` sheet, and the sheet's `Logout` row ends
the session. It shows nothing at all while nobody is signed in. A caller places both and passes
`CardMore` nothing.

They agree through one Redux flag, `payCardAuth.isSignedIn`, because two machines would each hydrate the
session and neither would agree with the other. The login machine writes the flag on entering `ready`,
`idle` and `error`. `CardMore` writes it once a logout is through, and the login machine takes a
`SESSION_ENDED` event to put the login back on offer.

`oauthConfig` carries the OAuth client id, the redirect URI and the app's deep link. All three are
the app's to know. The redirect URI goes to the authorization initiation and to the token exchange,
and the provider matches it verbatim; it has to be an `https` URL, because the provider whitelists no
other scheme.

`deepLink` is what closes the secure browser, and it is optional. Only a custom scheme can end a
session, so the redirect URI cannot serve here. The provider redirects to the deep link, and that is
what joins the two. Mobile passes `PAY_TAB_DEEP_LINK`; desktop passes none, because the user's own
browser reports nothing back (LIVE-34740).

`callback` carries the OAuth redirect, when the app already has one. The app's router owns the deep
link, so it hands over the `code` and `state` it parsed. On mobile that is
`ledgerlive://paytab?code=…&state=…`, which react-navigation turns into route params. Desktop does not
pass it yet (LIVE-34740).

## The login

An XState 5 machine owns the journey. It is three files: the states, guards and transitions in
[`machine.ts`](./src/state/machine.ts), the asynchronous steps in
[`actors.ts`](./src/state/actors.ts), and every shape they trade — the ports, the context, the events
and the input — in [`types.ts`](./src/state/types.ts).

```text
PKCE minted and stored → authorize initiation → OS browser → redirect → state compared
→ code exchanged → session stored → attempt wiped → GET /v1/user
```

Logout runs that backwards, in the one order that works: the provider is told first, while the session
can still authorize that call, and only then are the session, the attempt and the Card cache cleared.
Telling the provider is best effort — a logout on a dead network still logs the user out on this device.

The machine holds no React, no redux and no platform API. Everything it touches is a port
(`CardLoginPorts` in `src/state/types.ts`), and `createCardLoginPorts` binds those ports to RTK Query,
to this flow's PKCE store and to `@features/platform-card`. That is what makes every path testable with plain
`jest.fn()`s — see `src/state/__tests__/machine.native.test.ts`.

Two secrets, two owners:

| Secret | Owner | Store |
| --- | --- | --- |
| PKCE `{ state, codeVerifier }` | this flow | `react-native-keychain` (native) / memory (web) |
| Access and refresh tokens | [`@features/platform-card`](../../platform/card/README.md) | `react-native-keychain` (native) / memory (web) |

The redirect can arrive twice, from the browser session and from the app's deep link. The first one
wins and the second is ignored.

Renewal and the desktop redirect are later work (LIVE-34741, LIVE-34740).

App composition and DevTools consume shared Pay Card entity state through
`@domain/entity-pay-card`. This flow owns two slices, and both are exposed through
`@features/flow-pay-card-auth/state`:

| Slice | Holds | Persisted? |
| --- | --- | --- |
| `payCardAuth` | `hasCard` and `isSignedIn` | **No.** It is runtime state, so it stays out of every persisted blob. |
| `payCardLoginIntro` | `hasSeenLoginIntro` | **Yes**, in the shared `payCard` blob, beside the balance filter and the feature-tour flag. |

`hasSeenLoginIntro` says whether the card holder has already seen the login intro sheet, which
`CardLogin` shows on the first `Login` press. The flag goes up only when a login this session
started reaches `ready`, so neither a hydrated session nor a reset from the Pay Card devtool raises
it. Other Pay Card UI state is owned by the flow it belongs to: the balance filter by
`@features/flow-pay-balance` and the feature-tour flag by `@features/flow-pay-feature-tour`.

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

| Platform         | Files resolved                                        |
| ---------------- | ----------------------------------------------------- |
| Mobile (Re.Pack) | `CardLogin/index.native.tsx`, `CardMore/index.native.tsx` |
| Desktop (Rspack) | `CardLogin/index.web.tsx`, `CardMore/index.web.tsx`  |

## Structure

This package follows the [Structure & Flow ADR](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/6111232117/Guideline+Monorepo+DDD+Re-architecture+Structure+Flow). Add optional directories only when the flow needs them; do not keep empty scaffolding.

```text
pay-card-auth/
├── package.json                            # Package metadata and public exports
└── src/
    ├── components/                         # Components shared by several screens
    │   ├── CardLogin/
    │   │   ├── __tests__/                   # View, opener and ViewModel tests
    │   │   ├── CardLoginIntroView.native.tsx # Native login intro bottom sheet
    │   │   ├── CardLoginIntroView.web.tsx   # Web login intro dialog
    │   │   ├── CardLoginView.native.tsx     # Native login UI
    │   │   ├── CardLoginView.web.tsx        # Web login UI
    │   │   ├── index.native.tsx             # Native component container
    │   │   ├── index.web.tsx                # Web component container
    │   │   ├── openHostedLogin.native.ts    # Native secure-browser opener
    │   │   ├── openHostedLogin.web.ts       # Desktop browsing-context opener
    │   │   ├── payCardLoginIntro.webp       # The login intro hero image
    │   │   ├── types.ts                     # Component contracts
    │   │   └── useCardLoginViewModel.ts     # Shared state and orchestration
    │   └── CardMore/
    │       ├── __tests__/                    # View, ViewModel, sheet and row tests
    │       ├── CardMoreRow.tsx               # One sheet row, shared by both platforms
    │       ├── CardMoreRowParts.native.tsx   # Native Lumen row parts, and the row icons
    │       ├── CardMoreRowParts.web.tsx      # Web Lumen row parts, and the row icons
    │       ├── CardMoreSheet.native.tsx      # Native More bottom sheet
    │       ├── CardMoreSheet.web.tsx         # Web More dialog
    │       ├── CardMoreView.native.tsx       # Native signed-in UI, the More tile
    │       ├── CardMoreView.web.tsx          # Web signed-in UI, the More tile
    │       ├── index.native.tsx              # Native component container
    │       ├── index.web.tsx                 # Web component container
    │       ├── types.ts                      # Tile, row and sheet contracts
    │       └── useCardMoreViewModel.ts       # Visibility, the sheet, and the logout
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
    │   ├── createCardLogoutPorts.ts        # Binds the logout to RTK and the session
    │   ├── crypto.native.ts                # CSPRNG and SHA-256 through expo-crypto
    │   ├── crypto.web.ts                   # CSPRNG and SHA-256 through WebCrypto
    │   ├── errors.ts                       # Error kinds, and the 401 test
    │   ├── loginIntroSelectors.ts          # Login intro selectors, and its persistence lens
    │   ├── loginIntroSlice.ts              # The persisted `payCardLoginIntro` flag
    │   ├── machine.ts                      # States, guards and transitions
    │   ├── selectors.ts                    # Auth selectors
    │   ├── slice.ts                        # Auth-only runtime state (`hasCard`, `isSignedIn`)
    │   ├── store.ts                        # Public state subpath
    │   └── types.ts                        # Flow types, ports, machine types, Redux state
    ├── utils/                              # Flow-local helpers
    ├── assets.d.ts                         # Declares the `*.webp` module
    ├── index.native.ts                     # Native public API
    └── index.ts                            # Default/web public API
```

`hooks/`, `router/`, `screens/`, `state/`, and `utils/` are extension points. Add them only when the flow needs them.
