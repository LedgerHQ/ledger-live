# @features/flow-contacts-list

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Reusable Contacts List leaf flow for Desktop and Mobile.

## Scope

- Contact list, search, empty state, list view models, and List-specific UI
- Platform variants colocated with their UI concept (`*.web.tsx` / `*.native.tsx`)
- Themed folders such as `components/ListHeader` and `components/PageLayout`

This package does not know `@features/flow-contacts`, `@features/flow-contacts-detail`, or
introductions. The Introduction leaf is `@features/flow-contacts-introduction`; it is composed only
by the parent orchestrator when the complete Contacts aggregate is needed.

## Public API

Use `@features/flow-contacts-list` when a consumer only needs a contact list. The package resolves
its own copy with `@shared/i18n`.

- `@features/flow-contacts-list`: list and search view models, hooks, shared types, and the
  universal `ContactsCompactList`, on both platforms. `ContactsCompactList` renders a
  consumer-provided ordered set of contacts without search, sections, headers, empty states, or
  navigation. Consumers provide its optional maximum, its `onSelectContact` callback, and an
  optional `testID`.
- `@features/flow-contacts-list/web`: `ContactsListView`, the two-pane Contacts page, and
  `ContactsListViewProps`.
- `@features/flow-contacts-list/native`: `ContactsListView`, the sectioned Contacts list, with
  `ContactsListViewNativeProps` and `ContactsListSurface`, and `ContactsAddContactHeaderButton`
  with `ContactsAddContactHeaderButtonProps`.

Import a platform entry only from code of that platform. Consumers must not import files under
`src/`.

For the complete Contacts aggregate, use `ContactsView` from `@features/flow-contacts` instead.
