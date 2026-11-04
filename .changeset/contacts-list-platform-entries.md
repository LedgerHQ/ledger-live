---
"@features/flow-contacts-list": minor
"@features/flow-contacts": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

`@features/flow-contacts-list` exports `ContactsListView` from `./web` and `./native`, each with its own props, and `ContactsAddContactHeaderButton` from `./native`. The `.` entry has no `react-native` condition and exports the list logic plus the universal `ContactsCompactList`, which now calls `onSelectContact` and takes an optional `testID`. `ContactsCompactRow` and `ContactsSearchNoResults` are no longer exported, and `@features/flow-contacts` stops re-exporting `ContactsAddContactHeaderButton`.
