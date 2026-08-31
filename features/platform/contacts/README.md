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
- `createMockContactDeviceIntentsPort()`: returns temporary typed device results for Contacts flows.
- Contacts analytics building blocks: `ContactsGlobalProperties`,
  `buildContactsGlobalProperties()`, and `resolveContactsCurrencyAnalytics()` for shared global
  event properties and currency resolution.
- `useContactsFeature()` and related resolvers: expose the Contacts feature configuration for both
  applications and Contacts leaf flows.
- `resolveEligibleAddressCurrencyIds()`: resolves configured Contacts families to production
  network identifiers.
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

The combined edit emits a payload-free `partial-result` between its two device confirmations. It
carries nothing to persist, because the device stores no address book: it verifies the `hmacRest`
proof it is given, asks the user, and returns a fresh one. Each proof therefore covers one specific
`(identifier, scope)` pair, which is what dictates the chain — the identifier step proves
`(previousAddress, previousScope)` and yields a proof over `(newAddress, previousScope)`, exactly
what the scope step must present.

That statelessness also makes the chain atomic from the host's point of view. Abandoning a combined
edit between its two confirmations drops an intermediate proof and leaves the stored record
untouched and still valid, so a retry restarts the whole chain from the stored proof rather than
resuming mid-way.
