# @features/platform-contacts

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development as part of the DDD migration.

Contacts domain selectors, display helpers, React hooks, Device Intent ports, and shared
analytics building blocks used by flow packages.

## Exports

- `useContacts()`: selects the Contacts collection from the Redux store.
- `getContactInitial(name)`: returns the first Unicode letter and its combining marks in uppercase.
- `useContactsMeContact()`: selects the self Contact from the Redux store.
- `identityFormatMeDisplayName()` and `resolveMeContactDisplayName()`: resolve the shared display
  name rules used by Contacts List and Detail.
- `ContactAvatar`: renders the Me profile image when `isMe` is set, otherwise a deterministic
  color and Unicode initial. The root entry resolves the Web implementation; the `native` entry
  resolves the React Native implementation.
- `ContactDeviceIntentsPort`: defines the typed boundary for Contacts device interactions.
- `createMockContactDeviceIntentsPort()`: returns temporary typed device results for Contacts flows.
- Contacts analytics building blocks: `ContactsGlobalProperties` and
  `buildContactsGlobalProperties()` for shared global event properties.
