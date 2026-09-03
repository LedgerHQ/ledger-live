# @features/flow-pay-contact

> [!CAUTION]
> **Status: UNSTABLE** — In active development; API may change.

Pay-tab contacts. Web is a table of saved contacts; native is a horizontal strip with a leading
Pay tile. Both exclude the `me` contact.

Mount `Contacts` under a Redux `Provider` with `contactsSlice`. Desktop adapter:
`usePayTabContacts`.

Copy lives with the feature: the container view models resolve their own strings through
[`@shared/i18n`](../../../shared/i18n), so the host only injects behavior (callbacks, add-contact
wiring, `renderAddresses`). Keys read from the host app's **default** namespace (`app` on Desktop,
`common` on Mobile):

| Key | Rendered as |
| --- | --- |
| `payTab.contacts.title` | Section title |
| `payTab.contacts.pay` | Native leading Pay tile |
| `payTab.contacts.empty.{info,addContact}` | Web empty state |
| `payTab.contacts.table.{name,addresses,transactions,transactionCount}` | Web table headers + count |
| `payTab.contacts.actions.{pay,more,viewTransactions}` | Web row actions |
| `payTab.contacts.addressPicker.{title,addAddress}` | Web address picker dialog |

Both apps must carry these keys at the same path until translation keys are colocated per feature
(a follow-up of [LIVE-36540](https://ledgerhq.atlassian.net/browse/LIVE-36540)). The add-contact
dialog copy stays owned by `@features/flow-contacts-add-contact` and is passed via `addContact.labels`.

## Web

```tsx
import { Contacts } from "@features/flow-pay-contact";

<Contacts
  addContact={{ labels, contactCreation, onRequestAddContact, onSaveSuccess, callbacks }}
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

## Contact address picker (web)

> [!NOTE]
> Native picker lands in a later ticket.

`ContactAddressPicker` is a Lumen dialog that opens after a contact is pressed so the user can pick
which address to pay. `useContactAddressPickerViewModel` builds the presentation groups (addresses
segmented by network with asset-aware icons and truncated display), owns visibility and the selected
contact, and resolves its own copy through `@shared/i18n`. The host injects behavior only — no labels.
Grouping, icon resolution and truncation are shared from [`@features/flow-contacts`](../contacts).

```tsx
import { ContactAddressPicker, useContactAddressPickerViewModel } from "@features/flow-pay-contact";

const { open, contactAddressPicker } = useContactAddressPickerViewModel({
  onSelectAddress: address => startPayment(address),
  onAddNewAddress,
});

<Contacts {...contacts} onContactPress={open} />;
<ContactAddressPicker {...contactAddressPicker} />;
```

`onSelectAddress` receives the full `ContactAddress` (currency + recipient). `onAddNewAddress` is
optional and receives the open `contact`; wire it to the contact's add-address flow.

## Native

```tsx
import { Contacts } from "@features/flow-pay-contact";

<Contacts onPay={openSend} onSeeAll={openContactsList} />;
```

Caps at 8 contacts. `onSeeAll` opens the full list when there are more. `onContactPress` is optional
and unused for now.

Tests wrap the component in `I18nTestProvider` from `@shared/i18n/testing`.
