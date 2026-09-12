# @features/flow-pay-card

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Pay Card flow orchestrator for Ledger Wallet Desktop and Mobile. It composes the independent Pay
Card leaf flows into a single entry point, mirroring the Contacts aggregate (`@features/flow-contacts`).

## Usage

```tsx
import { Card } from "@features/flow-pay-card";

<Card
  oauthConfig={oauthConfig}
  callback={callback}
  formatCountervalue={formatCountervalue}
  balanceLabel={balanceLabel}
/>;
```

`Card` mounts the card visual and the authentication controls together:

- The card face from [`@features/flow-pay-card-details`](../pay-card-details/README.md): `CardVisual`
  once the host provides a countervalue formatter and a balance label, the bare `CardArtwork`
  otherwise. Freeze and More also come from that package (`CardActions` on web; `Freeze` and `More`
  side by side on native).
- `CardLogin` from [`@features/flow-pay-card-auth`](../pay-card-auth/README.md) — it shows while
  nobody is signed in, and `useCardLogout` ends the session from the More menu.

The flow owns the (currently mocked) card balance, so hosts no longer assemble the visual themselves.
They pass only the two things the flow cannot know: `formatCountervalue` (needs the app's locale and
counter-value currency) and `balanceLabel` (i18n stays with the host). `oauthConfig` and `callback`
come from `@features/flow-pay-card-auth`. Desktop mounts this flow in the Pay tab's right panel.

## MVVM

The flow follows the app MVVM split so both platforms share the logic and differ only in markup:

- `useCardViewModel` (shared) turns the host `CardProps` into the resolved `CardViewProps` — chiefly
  building the balance overlay (or leaving it `undefined` for the bare artwork).
- `CardView.web.tsx` / `CardView.native.tsx` are the presentational views; they render what the view
  model resolved and nothing more.
- `Card` is the container: it wires the hook to the platform view (`<CardView {...useCardViewModel(props)} />`).

## Public API vs leaves

This package **composes**; it does not re-export its leaves. Each leaf keeps its own public API and is
imported directly when an app needs a single piece or its Redux state:

- Auth-only runtime state (`payCardAuth`) stays behind `@features/flow-pay-card-auth/state`.
- [`CardAssets`](../pay-card-assets/README.md) is composed under the card; import it from
  `@features/flow-pay-card-assets` if you need the list on its own.
- Other Pay Card surfaces (`Balance`, `DepositOptions`, `RequestReceive`, `FeatureTour`) remain
  independent `@features/flow-pay-card-*` leaves that the app assembles on its Pay tab.

## Platform resolution

`Card.tsx` imports the view suffix-free (`./CardView`); the bundlers (Rspack `resolve.extensions`,
Metro platform extensions) and the package's own `tsconfig` `moduleSuffixes` pick `CardView.web.tsx`
or `CardView.native.tsx` per platform. The `exports` condition in `package.json` selects the barrel
(`index.ts` for web, `index.native.ts` for React Native); both re-export the shared `./Card`
container. The leaf packages resolve their own Web / React Native implementations the same way.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-card/
├── package.json
└── src/
    ├── Card.tsx                  # Container: wires the view model to the platform view
    ├── Card.types.ts            # CardProps (host input) + CardViewProps (resolved view props)
    ├── useCardViewModel.ts      # Shared view model: builds the card visual from host inputs
    ├── CardView.web.tsx         # Presentational view (web)
    ├── CardView.native.tsx      # Presentational view (native)
    ├── Card.web.test.tsx
    ├── Card.native.test.tsx
    ├── index.ts                 # Web public API barrel → ./Card
    └── index.native.ts          # Native public API barrel → ./Card
```
