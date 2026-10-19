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

Import `@features/flow-contacts-detail` from both platforms. The package root resolves the Web or
React Native implementation. `ContactDetailView` is the screen; dialogs, drawers, and view models
are exported beside it. The package resolves its own copy with `@shared/i18n`.

Consumers must not import files under `src/`.

For the complete Contacts aggregate, use `ContactsView` from `@features/flow-contacts`. That
package keeps cross-journey orchestration, including the ports and analytics that connect Contact
Detail to edit, delete, and add-address journeys.
