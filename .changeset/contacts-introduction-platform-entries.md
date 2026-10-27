---
"@features/flow-contacts-introduction": minor
"@features/flow-contacts": minor
"ledger-live-desktop": minor
"live-mobile": minor
---

refactor(contacts-introduction): split the platform components into web and native entries

The dialogs move to `@features/flow-contacts-introduction/web` and the bottom-sheet contents to `@features/flow-contacts-introduction/native`, with their props types. The root entry keeps the state, resolvers, preference port and hooks, and is the same on both platforms.
