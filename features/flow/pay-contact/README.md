# @features/flow-pay-contact

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Pay-tab contacts. Web is a table of saved contacts; native is a horizontal strip with a leading
Pay tile. Both exclude the `me` contact.

Mount `Contacts` under a Redux `Provider` with `contactsSlice`. Desktop adapter:
`usePayTabContacts`.

## Web

```tsx
import { Contacts } from "@features/flow-pay-contact";

<Contacts
  title={title}
  emptyState={{ info, addContactLabel }}
  addContact={{ labels, contactCreation, onRequestAddContact, onSaveSuccess, callbacks }}
  labels={{ name, addresses, transactions, formatTransactionCount, payAction, moreAction, viewContact, viewTransactions }}
  renderAddresses={addresses => <PayContactAddresses addresses={addresses} />}
  onContactPress={openNewPayment}
  onViewContact={openContactDetail}
  onViewTransactions={openContactHistory}
  operations={operations}
/>;
```

`renderAddresses` is app-owned (e.g. `IconStack`). Optional `operations` (incoming + outgoing
`ContactOperation`s) fill the transaction count and order rows by last sent-to. Clicking a row (or
its Telegram button) calls `onContactPress(contact)`. The row overflow (`...`) menu exposes
**View contact** → `onViewContact(contact)` and **View transactions** → `onViewTransactions(contact)`;
each item is shown only when its handler is provided.

## Native

```tsx
import { Contacts } from "@features/flow-pay-contact";

<Contacts title={title} payLabel={payLabel} onPay={openSend} onSeeAll={openContactsList} />;
```

Caps at 8 contacts. `onSeeAll` opens the full list when there are more. `onContactPress(contact)`
fires when a contact tile is pressed.
