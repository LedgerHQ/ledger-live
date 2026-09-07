# Pay Bank Transfer

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Shared cash-to-stable intro for the Pay deposit **Bank transfer** row. The view-model owns
intro content, continue / close intents, and tracking. Views are props-only. Host apps own
sheet / dialog presentation and the partner (Noah) handoff.

This is a dedicated `@features/flow-*` package because Trading owns the partner WebView, not
the Pay card package.

## Usage

```tsx
import {
  BankTransferIntroView,
  useBankTransferIntroAdapter,
} from "@features/flow-pay-bank-transfer";

const intro = useBankTransferIntroAdapter({
  labels: {
    title: t("payTab.bankTransferIntro.title"),
    description: t("payTab.bankTransferIntro.description"),
    continueLabel: t("payTab.bankTransferIntro.continue"),
    rows: [
      {
        icon: "Bank",
        title: t("payTab.bankTransferIntro.rows.bank.title"),
        description: t("payTab.bankTransferIntro.rows.bank.description"),
      },
    ],
  },
  onBankTransfer: () => navigateToPartner(),
  onTrackEvent: track,
});

// Deposit options `onSelect("bankTransfer")` → intro.open()
<QueuedBottomSheet
  isRequestingToBeOpened={intro.isOpen}
  onClose={intro.onClosePress}
>
  <BankTransferIntroView {...intro} />
</QueuedBottomSheet>
```

i18n stays in the app. This package is copy-agnostic.

## Host intents

| Intent | When | Host does |
| --- | --- | --- |
| `open()` | Deposit row **Bank transfer** | Open the intro overlay |
| `onBankTransfer` | Intro **Continue** | Partner handoff (below) |
| `onClosePress` | Overlay dismiss / close | Close the overlay; no partner |

Partner UI is **not** in this package. Known in-app routes (deep link TBD):

| App | Route | Partner |
| --- | --- | --- |
| Desktop | `/bank` | Noah `WebPlatformPlayer` (`manifestId: "noah"`) |
| Mobile | `ReceiveFunds` / `ReceiveProvider` `{ manifestId: "noah" }` | Noah `WebReceivePlayer` |

Child screens under Figma `6784:63692` are TBD.

## Tracking

Injected `onTrackEvent` only (Pay Tracking Plan). Deposit-row
`button_clicked { button: "bank transfer", buttonLocation: "deposit", page }` stays in
`@features/flow-pay-deposit`.

| Event | Payload |
| --- | --- |
| Open intro | `Page cash to stable` `{ flow: "C2S" }` |
| Continue | `button_clicked` `{ button: "continue", flow: "C2S", page: "cash to stable" }` |
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
    │   └── __tests__/
    ├── types.ts
    ├── exports.ts
    ├── index.ts
    └── index.native.ts
```
