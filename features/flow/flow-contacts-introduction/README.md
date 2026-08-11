# @features/flow-contacts-introduction

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the Contacts feature.

Contacts Feature Introduction and Ledger Sync Introduction leaf flow for Desktop and Mobile.

## Scope

- Feature Introduction state, resolver, preference port, constants, and action deduplication.
- Ledger Sync Introduction status and resolver.
- Web dialogs and React Native bottom-sheet content for both introductions.

## Public API

Apps that mount an introduction directly import this package for its hooks, types, helpers, and
native content. `ContactsView` from `@features/flow-contacts` remains the aggregate API for the
complete Contacts experience and composes these introductions on Web.

Files under `src/` are internal and must not be imported through package subpaths.
