# @features/flow-pay-contact

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change. Web only for now.

Pay-tab contacts section: a title, an empty state with an **Add contact** CTA, and the shared Add
contact dialog from `@features/flow-contacts-add-contact`.

The package reads the contacts, derives the empty state, and owns the dialog. The host injects the
copy, the Add contact `labels`, a `ContactCreationPort`, optional analytics `callbacks` /
`onSaveSuccess`, and `onRequestAddContact` — a gate (e.g. Ledger Sync) the CTA runs before opening.

```tsx
import { Contacts } from "@features/flow-pay-contact";

<Contacts
  title={title}
  emptyState={{ info, addContactLabel }}
  addContact={{ labels, contactCreation, onRequestAddContact, onSaveSuccess, callbacks }}
/>;
```

Desktop's `usePayTabContacts` is the reference adapter: it builds the labels and creation port,
reuses the Contacts analytics callbacks, and gates the CTA through the Ledger Sync mutation guard.
The Ledger Sync activation UI stays app-owned and is mounted next to `Contacts` by the Pay tab.

Hosts must render `Contacts` under a Redux `Provider` with the `contactsSlice` reducer.

Web only. The native barrel exposes types only; native views land in LIVE-36500.
