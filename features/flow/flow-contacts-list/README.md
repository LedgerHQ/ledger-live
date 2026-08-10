# @features/flow-contacts-list

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Reusable Contacts List leaf flow for Desktop and Mobile.

## Scope

- Contact list, search, empty state, list view models, and List-specific UI
- Platform variants colocated with their UI concept (`*.web.tsx` / `*.native.tsx`)
- Themed folders such as `components/ListHeader` and `components/PageLayout`

This package does not know `@features/flow-contacts`, Contact Detail, or introductions.

## Public API

Use `@features/flow-contacts-list` when a consumer only needs a contact list. The package root
resolves to the relevant Web or React Native implementation. Consumers must not import files under
`src/` or use the internal Native entry point used by `@features/flow-contacts` for type-safe
orchestration.

For the complete Contacts aggregate, use `ContactsView` from `@features/flow-contacts` instead.
