# @features/flow-contacts-add-address

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Add address flow for Desktop and Mobile.

## Scope

- Address validation, selection state, label validation, and flow transitions.
- Prefilled entry that bypasses currency and address selection and starts on the naming screen.
- Dedicated prefilled-address review UI for Web and React Native.
- Web dialog content and React Native bottom-sheet content.
- Public ports and helpers used by application-owned currency selection and validation adapters.
- Shared prefill-session orchestration (`usePrefillAddAddressFlow` and
  `useOpenPrefillAddAddressFlow`) so Desktop and Mobile only own translations and chrome.

## Structure

- `screens/` owns the Address Entry, Address Name, Review, Completion, and Flow UI. Each screen provides
  explicit `index.ts` and, where required, `index.native.ts` entry points. Address Entry and
  Address Name group their UI components separately from their view models.
- `components/` owns UI shared by more than one Add address screen.
- `state/` owns the Add address session, label validation, and currency-selection orchestration.
  Shared Contacts address-entry validation state and input behavior are consumed from
  `@features/platform-contacts`.
- `usePrefillAddAddressFlow` owns opening, saving, and settling a prefilled session. Apps mount a
  thin root that renders dialog or drawer chrome from that controller.

## Public API

Desktop and Mobile import this leaf directly when they mount Add address. Apps retain routing,
translations, modal or drawer composition, and app-owned dependency injection. Contacts feature flags
and network eligibility are provided by `@features/platform-contacts`.

Files under `src/` are internal and must not be imported through package subpaths.
