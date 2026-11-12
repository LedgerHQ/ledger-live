# @features/flow-contacts-detail

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Reusable Contact Detail leaf flow for Desktop and Mobile.

## Scope

- Empty and populated contact detail, including address rows and open-detail intents
- Contact detail edit and delete scenario state
- Contact address detail, including the selected address, QR payload, and quick actions.
  Address deletion itself lives in `@features/flow-contacts-delete-address`.
- Platform variants colocated with their UI concept (`*.web.tsx` / `*.native.tsx`)

This package does not import `@features/flow-contacts`. Desktop `ContactsView` composes this leaf
with List and Introduction. Mobile mounts `ContactDetailView` from the Contact Detail screen.

## Public API

- `@features/flow-contacts-detail`: the view models, ports and three universal components, each
  with one contract in its `*.types.ts`:
  - `ContactDetailView`, the screen. Its `detailActions` are shown in the Web header; Mobile shows
    them in its navigation header instead.
  - `ContactAddressDetailDialog`, the selected address with its quick actions. The Share action
    shows only when the host sets `onShareAddress`.
  - `ContactsEditSignerMismatchDialog`.

  Web renders dialogs; Native renders the content of a bottom sheet the app mounts in its own
  `QueuedBottomSheet`, and reads the sheet's bottom inset itself.
- `@features/flow-contacts-detail/native`: `ContactDetailActionsMenu`, the edit and delete menu.
  It is native sheet content that the Mobile host mounts in its own `QueuedBottomSheet`. Web
  shows the same actions inline in the `ContactDetailView` header.

The package resolves its own copy with `@shared/i18n`. Consumers must not import files under
`src/`.

For the complete Contacts aggregate, use `ContactsView` from `@features/flow-contacts`. That
package keeps cross-journey orchestration, including the ports and analytics that connect Contact
Detail to edit, delete, and add-address journeys.
