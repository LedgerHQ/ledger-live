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
  labels={{ name, addresses, transactions, formatTransactionCount, payAction, moreAction }}
  renderAddresses={addresses => <PayContactAddresses addresses={addresses} />}
  onPayContact={openNewPayment}
  outgoingOperations={outgoingOperations}
/>;
```

`renderAddresses` is app-owned (e.g. `IconStack`). Optional `outgoingOperations` sort by last
sent-to and fill the transaction count.

## Native

```tsx
import { Contacts } from "@features/flow-pay-contact";

<Contacts title={title} payLabel={payLabel} onPay={openSend} onSeeAll={openContactsList} />;
```

Caps at 8 contacts. `onSeeAll` opens the full list when there are more. `onContactPress` is optional
and unused for now.
