# @features/flow-contacts-add-contact

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the Contacts DDD migration.

Shared Add contact flow for Desktop and Mobile. Applications inject contact creation, translations,
navigation, and native drawer hosting.

## Public API

The package exposes the container-free Add contact content plus a reusable dialog lifecycle for Web
and Native:

- `useAddContactContentViewModel` — form state, saving, validation, and reset for a host-owned
  container.
- `useAddContactDialogViewModel` — the shared open/close/reset/confirm lifecycle. It is free of any
  product analytics; hosts inject tracking through `callbacks` (`onOpen`, `onConfirm`, `onClose`,
  `onInvalidNameErrorDisplayed`) so Contacts and Pay report under their own flow.
- `ContactsAddContactDialog` (web) — the shared Lumen dialog wrapper. Native hosts keep their own
  drawer / bottom-sheet chrome and render `ContactsAddContactContent`.
- `createContactCreationPort` — the default `ContactCreationPort` shared by every host; inject store
  `dispatch` and an id generator. It dispatches into `contactsSlice`, which is the Ledger Sync
  (Cloud Sync) source of truth, so creation both updates local state and syncs across devices.

The successful creation callback receives the created `Contact`.

Shared contact-name presentation primitives are provided by `@features/platform-contacts` so Add
and Edit contact remain independent leaf flows. The contact-name validation contract, including its
length limit, is owned by `@domain/entity-contact`.
