# Pay Card Deposit

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Dual-platform flow package for the Pay tab **Deposit options** experience for Ledger Wallet:
a Lumen `Dialog` on desktop and a `QueuedBottomSheet` on mobile, both listing the same four
deposit options (Bank transfer, Swap, Receive, Buy).

## Usage

```tsx
import { DepositOptions } from "@features/flow-pay-card-deposit";

<DepositOptions
  isOpen={isDepositOpen}
  page="Pay"
  labels={{
    title: t("payTab.deposit.title"),
    options: {
      bankTransfer: { title: t("..."), description: t("...") },
      swap: { title: t("..."), description: t("...") },
      receive: { title: t("..."), description: t("...") },
      buy: { title: t("..."), description: t("...") },
    },
  }}
  onClose={closeDeposit}
  onSelect={handleDepositOption}
  onTrackEvent={track}
/>;
```

The overlay is opened by the host (the Pay tab Deposit / "add stablecoins" action tile) via a local
`isOpen` boolean. The view stays props-only: it emits `onSelect(id)` and the host owns navigation
(Swap tab, Receive filtered to stablecoins, Buy live app, Bank transfer flow). i18n and analytics
resolution stay in the app; this package stays i18n-agnostic.

### Tracking

On press the view-model emits `button_clicked { button, buttonLocation: "deposit", page }` via the
injected `onTrackEvent`, where `button` is `bank transfer` | `swap` | `receive via crypto address` |
`buy` (per the
[Pay Tracking Plan](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/7331315855/Pay+-+Tracking+Plan)).

## Platform resolution

Only the view carries a platform suffix (`.web` / `.native`). The container, view-model, and
`types.ts` are platform-agnostic and import without a suffix; TypeScript `moduleSuffixes`, the
bundlers (Rspack / Metro) and the jest preset resolve the right side. Each view has a test importing
it through its full platform filename.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-card-deposit/
├── package.json
└── src/
    ├── components/DepositOptions/
    │   ├── DepositOptions.tsx                 # Container (platform-agnostic)
    │   ├── useDepositOptionsViewModel.ts      # options + tracking + close
    │   ├── DepositOptionsView.web.tsx         # Lumen Dialog
    │   ├── DepositOptionsView.native.tsx      # QueuedBottomSheet
    │   └── __tests__/
    ├── types.ts                               # Component + option contracts
    ├── exports.ts                             # Public surface (container + types)
    ├── index.ts                               # Public API barrel → ./exports
    └── index.native.ts                        # Native public API barrel → ./exports
```
