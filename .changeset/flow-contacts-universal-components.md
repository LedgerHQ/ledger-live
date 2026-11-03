---
"@features/flow-contacts": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

`@features/flow-contacts` exposes `ContactsView` and `ContactsButton` from a single `.` entry with shared `ContactsViewProps` and `ContactsButtonProps` contracts. List logic and platform contact hooks are imported from `@features/flow-contacts-list` and `@features/platform-contacts`. Desktop and mobile hosts mount feature and Ledger Sync introduction UI outside `ContactsView`.
