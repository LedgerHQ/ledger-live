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

## Device Intent Executor scaffold

The Contacts DIE contracts are deliberately isolated from the package root:

```ts
import {
  createIntent,
} from "@features/platform-device-intent";
import {
  registerExternalAddressIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
```

The subpath exports the seven ADR intents: external-address registration, external-contact rename,
identifier edit, scope edit, combined external-address edit, Ledger-account registration, and
Ledger-account rename. Each intent lives in its own directory with `types.ts`, `job.ts`, a shared
`intentDefinition.ts` that binds `./component`, and matching `component.web.tsx` /
`component.native.tsx` files.
Their current RxJS jobs are deterministic scaffolds: they emit `pending`,
`awaiting-device-confirmation`, then a persistence-friendly `completed` result without invoking
DMK or `@ledgerhq/device-contacts-kit`.

The combined edit intentionally emits an identifier `partial-result` before the scope confirmation
when both fields change. This preserves the ADR's non-atomic recovery contract: a consumer must
persist that intermediate result before the scope step completes. Real ContactsManager adapters and
application-flow wiring are deferred to their dedicated work.
