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
  color and Unicode initial. Import it from the package root; the consumer's platform
  configuration resolves the target implementation.
- `ContactDeviceIntentsPort`: defines the typed boundary for Contacts device interactions.
- `@features/platform-contacts/test`: exposes deterministic device intent results for tests.
- Contacts analytics building blocks: `ContactsGlobalProperties`,
  `buildContactsGlobalProperties()`, and `resolveContactsCurrencyAnalytics()` for shared global
  event properties and currency resolution.
- `useContactsFeature()` and related resolvers: expose the Contacts feature configuration for both
  applications and Contacts leaf flows.
- `resolveEligibleAddressCurrencyIds()`: resolves configured Contacts families to production
  network identifiers, keeping only the networks the device can register an address on.
- `ContactEditPort` and `createContactEditPort()`: define and implement the shared Contact rename
  operation, including device credentials for external contacts.
- `ContactAddressEditPort` and `createContactAddressEditPort()`: define and implement the shared
  Contact address update operation, including device credentials for external addresses.
- `ContactNameInput`: a cross-platform primitive resolved from the package root and shared by Add
  and Edit contact without coupling their leaf flows.
- `ContactNameDisclaimer`: a Web-only primitive shared by the Add and Edit contact dialogs.
  Contact-name validation and its length limit are owned by `@domain/entity-contact`.
- Address-entry primitives: validation types, entry-state transitions, presentation resolution,
  and input helpers shared by Add address and Edit address. Flow-specific UI decisions remain in
  their respective leaf flows.
- `ContactConfirmationDialog` and `ContactConfirmationBottomSheet`: shared confirmation
  presentation primitives used by Contacts deletion and signer-confirmation journeys.

## Device Intent Executor scaffold

The Contacts DIE contracts are deliberately isolated from the package root:

```ts
import {
  createIntent,
} from "@features/platform-device-intent";
import {
  registerExternalAddressIntentDefinition,
} from "@features/platform-contacts/device/intents";
```

The subpath exports five intents covering the seven ADR operations: external-address registration,
external-contact rename, external-address edit, Ledger-account registration and Ledger-account
rename. The edit intent covers three ADR operations on its own — identifier edit, scope edit, and
both at once — through its `EditExternalAddressStep`.

Each intent lives in its own directory with `types.ts`, `job.ts` and a component-less
`intentDefinition.ts`. The three external-contact intents — registration, rename and edit — drive
`@ledgerhq/device-contacts-kit`'s `ContactsManager` for real. The two Ledger-account intents are
still deterministic scaffolds: they emit `pending`, `awaiting-device-confirmation`, then a
persistence-friendly `completed` result without invoking DMK or the kit.

The renderers are app-owned, because a `features/` package cannot resolve translations today. Each
app keeps them under `src/mvvm/features/Contacts/deviceIntents/<intent>/`, composes each shared
definition with its own component into an `IntentPlatformDefinition`, and injects the resulting bag
into `useContactsIntentsOrchestrator`.
