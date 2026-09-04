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
  labels={{ name, addresses, transactions, formatTransactionCount, payAction, moreAction, viewTransactions }}
  renderAddresses={addresses => <PayContactAddresses addresses={addresses} />}
  onPayContact={openNewPayment}
  onViewTransactions={openContactHistory}
  operations={operations}
/>;
```

`renderAddresses` is app-owned (e.g. `IconStack`). Optional `operations` (incoming + outgoing
`ContactOperation`s) fill the transaction count and order rows by last sent-to. The row overflow
(`...`) menu exposes **View transactions** → `onViewTransactions(contact)`.

## Native

```tsx
import { Contacts } from "@features/flow-pay-contact";

<Contacts title={title} payLabel={payLabel} onPay={openSend} onSeeAll={openContactsList} />;
```

Caps at 8 contacts. `onSeeAll` opens the full list when there are more. `onContactPress` is optional
and unused for now.
