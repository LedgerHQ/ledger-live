# @features/flow-pay-contact

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change. Web only for now.

Pay-tab contacts section: a title and an empty state with an **Add contact** CTA.

The package reads the contacts and derives the empty state itself. The host injects the copy and the
`onAddContact` handler.

```tsx
import { Contacts } from "@features/flow-pay-contact";

<Contacts title={title} emptyState={{ info, addContactLabel, onAddContact }} />;
```

Desktop's `usePayTabContacts` is the reference adapter. Hosts must render `Contacts` under a Redux
`Provider` with the `contactsSlice` reducer.

The add-contact dialog and the Ledger Sync gate behind the CTA land in a follow-up; until then the
host passes a no-op `onAddContact`.

Do not mount this package on Mobile yet. Native views land in LIVE-36500.
