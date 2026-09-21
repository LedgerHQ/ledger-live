# Pay Bank Transfer

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Shared cash-to-stable **feature intro** for the Pay deposit **Bank transfer** row. The view-model
owns intro content, create-account / log-in / close intents, and tracking. Views are props-only.
Native uses the Lumen bottom sheet. Web uses the Lumen Dialog. Host apps own the partner (Noah)
handoff.

This is a dedicated `@features/flow-*` package because Trading owns the partner WebView, not
the Pay card package.

## Usage

```tsx
import { BankTransferIntro, useBankTransferIntroAdapter } from "@features/flow-pay-bank-transfer";

const intro = useBankTransferIntroAdapter({
  heroImage: require("./bank-transfer-intro-hero.webp"),
  onBankTransfer: handoff => navigateToPartner(handoff),
  onTrackEvent: track,
});

// Deposit options `onSelect("bankTransfer")` → intro.open()
<BankTransferIntro {...intro.bankTransferIntro} />
```

Copy is resolved inside this package via `@shared/i18n` (`payTab.bankTransferIntro.*` in each
app's default namespace). Hosts inject data, analytics, and partner handoff only.

## Host intents

| Intent | When | Host does |
| --- | --- | --- |
| `open()` | Deposit row **Bank transfer** | Open the intro overlay |
| `onBankTransfer("createAccount")` | Intro **Create an account** | Partner signup handoff (below) |
| `onBankTransfer("logIn")` | Intro **Log in to Noah** | Partner login handoff (below) |

Partner UI is **not** in this package. Known in-app routes (deep link TBD):

| App | Route | Partner |
| --- | --- | --- |
| Desktop | `/bank?noahAuth=createAccount` or `/bank?noahAuth=logIn` | Noah `WebPlatformPlayer` (`manifestId: "noah"`) |
| Mobile | `ReceiveFunds` / `ReceiveProvider` `{ manifestId: "noah", noahAuth }` | Noah `WebReceivePlayer` |

Child screens under Figma `6784:63692` are TBD.

## Tracking

Injected `onTrackEvent` only (Pay Tracking Plan). Deposit-row
`button_clicked { button: "bank transfer", buttonLocation: "deposit", page }` stays in
`@features/flow-pay-deposit`.

| Event | Payload |
| --- | --- |
| Open intro | `Page cash to stable` `{ flow: "C2S" }` |
| Create an account | `button_clicked` `{ button: "create an account", flow: "C2S", page: "cash to stable" }` |
| Log in to Noah | `button_clicked` `{ button: "log in to noah", flow: "C2S", page: "cash to stable" }` |
| Close | `button_clicked` `{ button: "close", flow: "C2S", page: "cash to stable" }` |

## Platform resolution

Only the view carries a platform suffix. The container, view-model, adapter, and `types.ts`
are platform-agnostic.

## Structure

Every `index.*` is a pure barrel (`export *` only).

```text
pay-bank-transfer/
├── package.json
└── src/
    ├── components/BankTransferIntro/
    │   ├── BankTransferIntro.tsx
    │   ├── useBankTransferIntroViewModel.ts
    │   ├── useBankTransferIntroAdapter.ts
    │   ├── BankTransferIntroView.web.tsx
    │   ├── BankTransferIntroView.native.tsx
    │   ├── assets.ts
    │   └── __tests__/
    ├── types.ts
    ├── exports.ts
    ├── index.ts
    └── index.native.ts
```
