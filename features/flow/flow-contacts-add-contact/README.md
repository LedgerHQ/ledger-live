# @features/flow-contacts-add-contact

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the Contacts DDD migration.

Shared Add contact flow for Desktop and Mobile. Applications inject contact creation, translations,
navigation, and native drawer hosting.

## Public API

The package exposes the container-free Add contact content and view model for Web and Native, plus
the shared name-input primitives consumed by the Rename contact flow. Consumers own the dialog,
drawer, bottom sheet, positioning, cancellation, and reset behavior. The successful creation
callback receives the created `Contact`.
