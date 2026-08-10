# @features/platform-contacts

> [!CAUTION]
> **Status: UNSTABLE** — In active development as part of the DDD migration.

Contacts domain selectors and React hooks shared by flow packages.

## Exports

- `useContacts()`: selects the Contacts collection from the Redux store.
- `getContactInitial(name)`: returns the first Unicode letter and its combining marks in uppercase.
