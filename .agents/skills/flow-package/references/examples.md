# Flow package examples

Source trees of the packages [the skill](../SKILL.md) cites, tests and assets left out. Read the
package itself before copying: these trees show the layout, not every file's role.

## One screen, flat: `@features/flow-pay-card`

```text
features/flow/pay-card/src/
├── Card.tsx                         # <CardView {...useCardViewModel(props)} />
├── Card.types.ts
├── useCardViewModel.ts
├── CardView.web.tsx
├── CardView.native.tsx
├── useCardStatusRefresh.web.ts      # platform-specific hook used by the ViewModel
├── useCardStatusRefresh.native.ts
├── useCardLifecycleTracking.ts
├── derivePayCardAnalyticsMilestones.ts
├── index.ts
└── index.native.ts
```

## Several screens: `@features/flow-contacts-add-address`

```text
features/flow/flow-contacts-add-address/src/
├── components/                      # SanctionedAddressBanner, AddressNameDisclaimer
├── copy/                            # useAddAddressEntryCopy.ts, useAddAddressReviewLabels.ts, ...
├── screens/
│   ├── AddressEntry/
│   │   ├── components/              # entry and View folders (deviation: belong at the screen root)
│   │   └── viewModel/               # deviation: the ViewModel belongs at the screen root
│   ├── AddressName/                 # deviation: native is one file, no ViewModel or View
│   ├── Review/
│   │   ├── ContactsAddAddressReview.web.tsx       # entry: View + ViewModel
│   │   ├── useContactsAddAddressReviewViewModel.web.ts
│   │   ├── ContactsAddAddressReviewView.web.tsx
│   │   ├── ContactsAddAddressReview.native.tsx    # deviation: one file, no ViewModel or View
│   │   └── types.ts
│   └── Flow/
│       ├── ContactsAddAddressFlowContent.types.ts   # the universal contract, driven by the flow state
│       ├── ContactsAddAddressFlowContent.web.tsx    # switch on the state status
│       ├── ContactsAddAddressFlowContent.native.tsx
│       └── addAddressWebFlowStep.ts                 # step helpers the desktop dialog uses
├── state/
│   ├── addAddressFlowReducer.ts     # current step and form state, used by React
│   ├── useAddAddressFlowViewModel.ts
│   ├── ports.ts
│   └── types.ts
├── urls.ts
└── index.ts                         # the one entry, for both platforms
```

## Lifecycle model: `@features/flow-contacts-delete-address`

```text
features/flow/flow-contacts-delete-address/src/
├── components/ContactsDeleteAddressDialog/
│   ├── ContactsDeleteAddressDialog.web.tsx
│   ├── ContactsDeleteAddressDialog.native.tsx
│   └── types.ts
├── copy/useDeleteAddressLabels.ts
├── model/
│   ├── addressDeleteController.ts   # takes the ports, returns the next lifecycle
│   ├── addressDeleteViewModel.ts    # pure lifecycle constructors (the name predates "lifecycle model")
│   └── ports.ts                     # ContactAddressDeletionPort, injected by the app
├── createContactAddressDeletePort.ts
├── useDeleteAddressFlowViewModel.ts # the ViewModel: the React hook over model/
├── types.ts
├── exports.ts
├── index.ts                         # ./exports + the .web dialog
└── index.native.ts                  # ./exports + the .native dialog
```

## Flow slice and logic: `@features/flow-pay-balance`

```text
features/flow/pay-balance/src/
├── components/
│   └── Hero/                        # Balance.tsx, useBalanceViewModel.ts, BalanceView.{web,native}.tsx
├── hooks/useBalanceData.ts
├── logic/                           # aggregateBalance.ts, resolveSelection.ts, ...: pure functions
├── state/
│   ├── slice.ts                     # payCardBalanceSlice: the selected filter
│   ├── selectors.ts                 # root typed as { payCardBalance: PayCardBalanceState }
│   ├── constants.ts
│   ├── types.ts
│   └── index.ts                     # exported as @features/flow-pay-balance/state
├── types.ts
├── exports.ts
└── index.ts
```

A component with its own state, such as `components/Hero/`, follows the same trio as a screen:
entry, `useXViewModel.ts`, `XView.web.tsx` / `XView.native.tsx`.

## Older layouts not to copy

| Package                                     | Layout                         | Target when touched        |
| ------------------------------------------- | ------------------------------ | -------------------------- |
| `@features/flow-app-unlock`                 | `steps/Unlock/`                | `screens/Unlock/` or flat  |
| `@features/flow-app-password-setup`         | `steps/SetupPassword/`, ...    | `screens/<Screen>/`        |
| `@features/flow-app-longer-password`        | `steps/LongerPassword/`        | `screens/` or flat         |
| `@features/flow-fear-and-greed`             | `view.web.tsx`, `view.native.tsx` | `FearAndGreedView.*.tsx` |
