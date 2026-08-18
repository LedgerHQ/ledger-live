# @features/platform-contacts

> [!CAUTION]
>
> **Status: UNSTABLE** — In active development as part of the DDD migration.

Contacts domain selectors, display helpers, feature configuration, React hooks, Device Intent
ports, address-entry primitives, and shared analytics building blocks used by flow packages.

## Exports

- `useContacts()`: selects the Contacts collection from the Redux store.
- `getContactInitial(name)`: returns the first Unicode letter and its combining marks in uppercase.
- `useContactsMeContact()`: selects the self Contact from the Redux store.
- `identityFormatMeDisplayName()` and `resolveMeContactDisplayName()`: resolve the shared display
  name rules used by Contacts List and Detail.
- `ContactAvatar`: renders the Me profile image when `isMe` is set, otherwise a deterministic
  color and Unicode initial. Import it from the `web` or `native` entry according to the target
  platform.
- `ContactDeviceIntentsPort`: defines the typed boundary for Contacts device interactions.
- `createMockContactDeviceIntentsPort()`: returns temporary typed device results for Contacts flows.
- Contacts analytics building blocks: `ContactsGlobalProperties`,
  `buildContactsGlobalProperties()`, and `resolveContactsCurrencyAnalytics()` for shared global
  event properties and currency resolution.
- `useContactsFeature()` and related resolvers: expose the Contacts feature configuration for both
  applications and Contacts leaf flows.
- `resolveEligibleAddressCurrencyIds()`: resolves configured Contacts families to production
  network identifiers.
- Address-entry primitives: validation types, entry-state transitions, presentation resolution,
  and input helpers shared by Add address and Edit address. Flow-specific UI decisions remain in
  their respective leaf flows.
