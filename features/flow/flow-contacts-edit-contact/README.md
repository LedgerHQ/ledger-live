# @features/flow-contacts-edit-contact

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Shared Edit contact journey for Desktop and Mobile.

## Scope

This package owns contact-name edit state and the universal `ContactsRenameContactDialog`. It
uses the contact-name validation contract from `@domain/entity-contact` and receives the
contact-edit port as an explicit dependency so it can be mounted independently.

## Public API

- `@features/flow-contacts-edit-contact`: the view models and `ContactsRenameContactDialog`,
  whose contract is `ContactsRenameContactDialog.types.ts`. Web renders a dialog; Native renders
  the content of a bottom sheet the app mounts in its own `QueuedBottomSheet`.
- `@features/flow-contacts-edit-contact/native`: `ContactsRenameContactFooter`, the confirm
  button the app passes to that sheet's `footer`, so it stays above the keyboard.

`@features/platform-contacts` owns the shared contact-edit port implementation and contact-name
input primitives. Applications own their container placement, navigation, and analytics. This
package resolves its own copy with `@shared/i18n`.
