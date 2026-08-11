# @features/platform-contacts

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the DDD migration.

Contacts domain selectors, display helpers, and React hooks shared by flow packages.

## Exports

- `useContacts()`: selects the Contacts collection from the Redux store.
- `getContactInitial(name)`: returns the first Unicode letter and its combining marks in uppercase.
- `useContactsMeContact()`: selects the self Contact from the Redux store.
- `identityFormatMeDisplayName()` and `resolveMeContactDisplayName()`: resolve the shared display
  name rules used by Contacts List and Detail.
