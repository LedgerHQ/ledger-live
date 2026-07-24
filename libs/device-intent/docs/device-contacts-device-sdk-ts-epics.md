# Device Contacts — device-sdk-ts epic and ticket draft

## Scope

This is a Jira-ready draft for the device-sdk-ts work behind the Contacts
feature. Create all three epics and every ticket below in the **DSDK** Jira
project (not LIVE). It is deliberately split by independently reviewable
behavior:

1. a reusable Contacts kit and a web playground validation surface;
2. Ethereum clear-signing integration;
3. Tron clear-signing integration.

The source contracts are:

- [Contacts kit ADR](./device-contacts-kit-adr.md);
- [Firmware Address Book specification](https://ledgerhq.atlassian.net/wiki/spaces/FW/pages/6992035925/Address+Book+Final+Specifications).

`Proof`, `groupHandle`, and device identifiers are opaque device values. The
real SDK types should use the representation exposed by the device SDK (for
example, `Uint8Array`), not stringify those values for convenience.

`chainId` is an Ethereum-only unsigned integer of up to 8 bytes. Generic
Contacts models should represent it as `chainId?: bigint`: required for
Ethereum and omitted for other blockchain families. Before implementing the
`Command` encoding, clarify with firmware whether HMAC computation uses a fixed
8-byte or minimum-length representation.

---

## Epic 1 — `[TS][Contacts] Contacts management kit`

**Goal:** deliver `@ledgerhq/device-contacts-kit`, a protocol-level Contacts API
that can be used by any host, then validate every management operation against a
device in the web playground.

`ContactsManager` is stateless. It only drives device interactions: taking
caller input, running the device operation, and returning the device output
(including proof material). It does not store anything, own the address book, or
handle persistence. The host is responsible for persisting and managing the
address book.

**Epic acceptance criteria**

- The published kit exposes a `ContactsManager` and builder, with reusable
version requirements that both `DeviceAction` instances and Ledger Wallet can
consume.
- Every Contacts management APDU is implemented by a `Command`,
  `DeviceAction`, and internal `UseCase` trio. Each `ContactsManager` method
  resolves its `UseCase`; the `UseCase` delegates to `ContactsAppBinder`; and
  the binder uses its injected `dmk`, `sessionId`, and, where applicable,
  `appName` to construct and execute the `DeviceAction`. All layers are fully
  unit tested.
- The web playground supports all six management operations, persists the
complete address book locally, and validates them on a compatible device.

### Ticket 1.1 — `[TS][Contacts] Scaffold package`

Create `@ledgerhq/device-contacts-kit`, following the public/internal
architecture and dependency-injection conventions of the signer kits.

The existing signer scaffolding script can be used as a starting point. Adapt
its output for a Contacts kit, including package name, class names, public
entrypoints, and any signer-specific files or assumptions.

**Scaffolding**

- `src/api/`
  - `ContactsManager` public interface.
  - `ContactsManagerBuilder`, receiving `dmk`, `sessionId`, and `appName`.
  - Public exports.
- `src/internal/`
  - `DefaultContactsManager`.
  - Inversify dependency injection following signer-kit conventions, with
    external bindings for `dmk`, `sessionId`, and `appName`.
  - Feature-module structure for DI and internal `UseCase`s.
  - `ContactsAppBinder` and its DI module.
  - `app-binder` structure for future `Command`, `Task`, and `DeviceAction`
    implementations.
- Package entrypoint, configuration, README, and test setup.

Concrete operations and their types are implemented by their dedicated
tickets.

**Acceptance criteria**

- The package only depends on DMK, except for standard shared SDK dependencies
already required by the kit convention.
- The package builds, type-checks, lints, and tests successfully.
- Unit tests verify that the builder creates a `DefaultContactsManager` and
  that the DI container binds `dmk`, `sessionId`, `appName`, and
  `ContactsAppBinder`.
- The package exposes no concrete Contacts operation or placeholder behavior
  before its dedicated implementation ticket.

### Ticket 1.2 — `[TS][Contacts] Define reusable version requirements`

Define the static Contacts version data and the public/internal API that
resolves the minimum supported app and OS versions.

**Requirements**

- The version requirements must be easy for Contacts `DeviceAction` instances to consume
internally.
- Ledger Wallet must be able to consume the same requirements externally when
composing its own app-readiness checks.
- The exact exported API, data representation, and dependency boundary are
intentionally TBD and should be decided while implementing this ticket.
- `ApplicationChecker` from DMK is a candidate implementation for app-version
validation, not a prescribed requirement.

**Acceptance criteria**

- Ledger Wallet can import or otherwise consume the app-version requirement
without duplicating the data.
- Unit tests cover at least one app-version and one OS-version requirement.

### Ticket 1.3 — `[TS][Contacts] Registering an external address`

Implement `RegisterExternalAddressCommand` for `REGISTER IDENTITY`,
`RegisterExternalAddressDeviceAction`, and `RegisterExternalAddressUseCase`.
Add `ContactsManager.registerExternalAddress()` as the public entrypoint to the
internal `UseCase`.

- Firmware `Command`: [REGISTER IDENTITY](https://ledgerhq.atlassian.net/wiki/spaces/FW/pages/6992035925/Address+Book+Final+Specifications#Register-Identity).
- Open `appName` by default, then check the resolved app minimum version using
the version-requirements API.
- Accept `skipOpenApp: true` to omit only the open-app `DeviceAction`; retain the
version guard.
- Support both a new contact group and adding an address to an existing group.
- `derivationPath` is temporary for external-address operations. The kit owns a
single internal constant for now and does not expose this parameter publicly;
it will no longer be passed to the `Command` later.
- Return the new group handle/proofs or the new address proof.

**Suggested types**

The `Command` input/output should closely follow the firmware specification.
The composed `DeviceAction` should expose a richer host-facing shape that echoes the
values needed to persist the returned proof material.

```ts
type RegisterExternalAddressDeviceActionInput = {
  contactName: string;
  scope: string;
  identifier: Uint8Array;
  blockchainFamily: string;
  chainId?: bigint;
  existingContactGroup?: {
    groupHandle: Uint8Array;
    hmacProof: Uint8Array;
  };
  skipOpenApp?: boolean;
};

type RegisterExternalAddressDeviceActionOutput = {
  mode: "newContactGroup" | "existingContactGroup";
  contactName: string;
  scope: string;
  identifier: Uint8Array;
  blockchainFamily: string;
  chainId?: bigint;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
  hmacRest: Uint8Array;
};
```

**Acceptance criteria**

- `RegisterExternalAddressCommand`, `RegisterExternalAddressDeviceAction`, and
  `RegisterExternalAddressUseCase` are implemented and fully unit tested.
- `ContactsManager.registerExternalAddress()` delegates to the internal
  `RegisterExternalAddressUseCase`, which passes the caller input to
  `ContactsAppBinder`. The binder uses its injected `dmk`, `sessionId`, and
  `appName` to construct and execute `RegisterExternalAddressDeviceAction`.
- The `DeviceAction` surfaces any `requiredUserInteraction` from the underlying
`openApp` `DeviceAction` and while `REGISTER IDENTITY` awaits the user's
validation on the device.
- Tests cover both new and existing contact-group flows.
- Tests cover the default open-app path and `skipOpenApp`.
- The web playground can create an external address and persist every returned
proof value locally.

### Ticket 1.4 — `[TS][Contacts] Renaming an external contact`

Implement `RenameExternalContactCommand` for `EDIT CONTACT NAME`,
`RenameExternalContactDeviceAction`, and `RenameExternalContactUseCase`.
Add `ContactsManager.renameExternalContact()` as the public entrypoint to the
internal `UseCase`.

- Firmware `Command`: [EDIT CONTACT NAME](https://ledgerhq.atlassian.net/wiki/spaces/FW/pages/6992035925/Address+Book+Final+Specifications#Edit-Contact-Name).
- This command has to be run on the dashboard.
- Always run the `goToDashboard` `DeviceAction`
- Check the resolved minimum OS version before sending the APDU.
- `derivationPath` is temporary for external-address operations. The kit owns a
single internal constant for now and does not expose this parameter publicly;
it will no longer be passed to the `Command` later.
- Return the replacement group-level `hmacProof`.

**Suggested types**

```ts
type RenameExternalContactDeviceActionInput = {
  previousContactName: string;
  newContactName: string;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
};

type RenameExternalContactDeviceActionOutput = {
  previousContactName: string;
  contactName: string;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
};
```

**Acceptance criteria**

- `RenameExternalContactCommand`, `RenameExternalContactDeviceAction`, and
  `RenameExternalContactUseCase` are implemented and fully unit tested.
- `ContactsManager.renameExternalContact()` delegates to the internal
  `RenameExternalContactUseCase`, which passes the caller input to
  `ContactsAppBinder`. The binder uses its injected `dmk` and `sessionId` to
  construct and execute `RenameExternalContactDeviceAction`; `appName` is not
  used for this dashboard operation.
- The `DeviceAction` surfaces any `requiredUserInteraction` from the underlying
`goToDashboard` `DeviceAction` and while `EDIT CONTACT NAME` awaits the
user's validation on the device.
- Tests prove that the `DeviceAction` navigates to the dashboard and never calls
`openApp`.
- Tests cover an unsupported OS version and a successful proof replacement.
- The web playground can rename a persisted external contact.

### Ticket 1.5 — `[TS][Contacts] Editing an external address identifier`

Implement `EditExternalAddressIdentifierCommand` for `EDIT IDENTIFIER`,
`EditExternalAddressIdentifierDeviceAction`, and
`EditExternalAddressIdentifierUseCase`. Add
`ContactsManager.editExternalAddressIdentifier()` as the public entrypoint to
the internal `UseCase`.

- Firmware `Command`: [EDIT IDENTIFIER](https://ledgerhq.atlassian.net/wiki/spaces/FW/pages/6992035925/Address+Book+Final+Specifications#Edit-Identifier).
- Open the coin app by default; support `skipOpenApp: true`.
- Check the app minimum version using the version-requirements API.
- `derivationPath` is temporary for external-address operations. The kit owns a
single internal constant for now and does not expose this parameter publicly;
it will no longer be passed to the `Command` later.
- Return the replacement address-level `hmacRest`.

**Suggested types**

```ts
type EditExternalAddressIdentifierDeviceActionInput = {
  contactName: string;
  scope: string;
  previousIdentifier: Uint8Array;
  newIdentifier: Uint8Array;
  blockchainFamily: string;
  chainId?: bigint;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
  hmacRest: Uint8Array;
  skipOpenApp?: boolean;
};

type EditExternalAddressIdentifierDeviceActionOutput = {
  contactName: string;
  scope: string;
  previousIdentifier: Uint8Array;
  identifier: Uint8Array;
  blockchainFamily: string;
  chainId?: bigint;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
  hmacRest: Uint8Array;
};
```

**Acceptance criteria**

- `EditExternalAddressIdentifierCommand`,
  `EditExternalAddressIdentifierDeviceAction`, and
  `EditExternalAddressIdentifierUseCase` are implemented and fully unit tested.
- `ContactsManager.editExternalAddressIdentifier()` delegates to the internal
  `EditExternalAddressIdentifierUseCase`, which passes the caller input to
  `ContactsAppBinder`. The binder uses its injected `dmk`, `sessionId`, and
  `appName` to construct and execute
  `EditExternalAddressIdentifierDeviceAction`.
- The `DeviceAction` surfaces any `requiredUserInteraction` from the underlying
`openApp` `DeviceAction` and while `EDIT IDENTIFIER` awaits the user's
validation on the device.
- Tests preserve the contact-group proof and replace only `hmacRest`.
- The web playground can edit an external address and persist the returned proof.

### Ticket 1.6 — `[TS][Contacts] Editing an external address scope`

Implement `EditExternalAddressScopeCommand` for `EDIT SCOPE`,
`EditExternalAddressScopeDeviceAction`, and `EditExternalAddressScopeUseCase`.
Add `ContactsManager.editExternalAddressScope()` as the public entrypoint to
the internal `UseCase`.

- Firmware `Command`: [EDIT SCOPE](https://ledgerhq.atlassian.net/wiki/spaces/FW/pages/6992035925/Address+Book+Final+Specifications#Edit-Scope).
- Open the coin app by default; support `skipOpenApp: true`.
- Check the app minimum version using the version-requirements API.
- `derivationPath` is temporary for external-address operations. The kit owns a
single internal constant for now and does not expose this parameter publicly;
it will no longer be passed to the `Command` later.
- Return the replacement address-level `hmacRest`.

**Suggested types**

```ts
type EditExternalAddressScopeDeviceActionInput = {
  contactName: string;
  previousScope: string;
  newScope: string;
  identifier: Uint8Array;
  blockchainFamily: string;
  chainId?: bigint;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
  hmacRest: Uint8Array;
  skipOpenApp?: boolean;
};

type EditExternalAddressScopeDeviceActionOutput = {
  contactName: string;
  previousScope: string;
  scope: string;
  identifier: Uint8Array;
  blockchainFamily: string;
  chainId?: bigint;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
  hmacRest: Uint8Array;
};
```

**Acceptance criteria**

- `EditExternalAddressScopeCommand`, `EditExternalAddressScopeDeviceAction`,
  and `EditExternalAddressScopeUseCase` are implemented and fully unit tested.
- `ContactsManager.editExternalAddressScope()` delegates to the internal
  `EditExternalAddressScopeUseCase`, which passes the caller input to
  `ContactsAppBinder`. The binder uses its injected `dmk`, `sessionId`, and
  `appName` to construct and execute `EditExternalAddressScopeDeviceAction`.
- The `DeviceAction` surfaces any `requiredUserInteraction` from the underlying
`openApp` `DeviceAction` and while `EDIT SCOPE` awaits the user's validation
on the device.
- Tests preserve the address identifier and contact-group proof.
- The web playground can edit a scope and persist the returned proof.

### Ticket 1.7 — `[TS][Contacts] Registering a Ledger account contact`

Implement `RegisterLedgerAccountCommand` for `REGISTER LEDGER ACCOUNT`,
`RegisterLedgerAccountDeviceAction`, and `RegisterLedgerAccountUseCase`.
Add `ContactsManager.registerLedgerAccount()` as the public entrypoint to the
internal `UseCase`.

- Firmware `Command`: [REGISTER LEDGER ACCOUNT](https://ledgerhq.atlassian.net/wiki/spaces/FW/pages/6992035925/Address+Book+Final+Specifications#Register-Ledger-Account).
- Open the coin app by default; support `skipOpenApp: true`.
- Check the app minimum version using the version-requirements API.
- Return the Ledger-account `hmacProof`.

**Suggested types**

```ts
type RegisterLedgerAccountDeviceActionInput = {
  accountName: string;
  derivationPath: string;
  blockchainFamily: string;
  chainId?: bigint;
  skipOpenApp?: boolean;
};

type RegisterLedgerAccountDeviceActionOutput = {
  accountName: string;
  derivationPath: string;
  blockchainFamily: string;
  chainId?: bigint;
  hmacProof: Uint8Array;
};
```

**Acceptance criteria**

- `RegisterLedgerAccountCommand`, `RegisterLedgerAccountDeviceAction`, and
  `RegisterLedgerAccountUseCase` are implemented and fully unit tested.
- `ContactsManager.registerLedgerAccount()` delegates to the internal
  `RegisterLedgerAccountUseCase`, which passes the caller input to
  `ContactsAppBinder`. The binder uses its injected `dmk`, `sessionId`, and
  `appName` to construct and execute `RegisterLedgerAccountDeviceAction`.
- The `DeviceAction` surfaces any `requiredUserInteraction` from the underlying
`openApp` `DeviceAction` and while `REGISTER LEDGER ACCOUNT` awaits the
user's validation on the device.
- Tests cover app opening, skipped app opening, and the returned proof.
- The web playground can register and locally persist a Ledger account contact.

### Ticket 1.8 — `[TS][Contacts] Renaming a Ledger account contact`

Implement `RenameLedgerAccountCommand` for `EDIT LEDGER ACCOUNT`,
`RenameLedgerAccountDeviceAction`, and `RenameLedgerAccountUseCase`.
Add `ContactsManager.renameLedgerAccount()` as the public entrypoint to the
internal `UseCase`.

- Firmware `Command`: [EDIT LEDGER ACCOUNT](https://ledgerhq.atlassian.net/wiki/spaces/FW/pages/6992035925/Address+Book+Final+Specifications#Edit-Ledger-Account).
- Open the coin app by default; support `skipOpenApp: true`.
- Check the app minimum version using the version-requirements API.
- Return the replacement Ledger-account `hmacProof`.

**Suggested types**

```ts
type RenameLedgerAccountDeviceActionInput = {
  previousAccountName: string;
  newAccountName: string;
  derivationPath: string;
  blockchainFamily: string;
  chainId?: bigint;
  hmacProof: Uint8Array;
  skipOpenApp?: boolean;
};

type RenameLedgerAccountDeviceActionOutput = {
  previousAccountName: string;
  accountName: string;
  derivationPath: string;
  blockchainFamily: string;
  chainId?: bigint;
  hmacProof: Uint8Array;
};
```

**Acceptance criteria**

- `RenameLedgerAccountCommand`, `RenameLedgerAccountDeviceAction`, and
  `RenameLedgerAccountUseCase` are implemented and fully unit tested.
- `ContactsManager.renameLedgerAccount()` delegates to the internal
  `RenameLedgerAccountUseCase`, which passes the caller input to
  `ContactsAppBinder`. The binder uses its injected `dmk`, `sessionId`, and
  `appName` to construct and execute `RenameLedgerAccountDeviceAction`.
- The `DeviceAction` surfaces any `requiredUserInteraction` from the underlying
`openApp` `DeviceAction` and while `EDIT LEDGER ACCOUNT` awaits the user's
validation on the device.
- Tests replace only the Ledger-account proof.
- The web playground can rename and persist a Ledger account contact.

### Ticket 1.9 — `[TS][Contacts] Playground integration`

Add a **Contacts** section to the device-sdk-ts web playground. It is the
end-to-end validation surface for every ticket in this epic and the signer
epics.

The playground invokes only the public management methods on `ContactsManager`;
it does not call internal `UseCase`s, `Command`s, or `DeviceAction`s directly.

Persist a full address-book model in browser local storage.
The playground implementation owns its persistence format, serialization, and
address-book manipulation. These choices are not part of the Contacts kit API.

**Suggested types**

```ts
type AddressBook = {
  contactGroups: ContactGroup[];
  externalAddresses: ExternalAddress[];
  ledgerAccounts: LedgerAccountContact[];
};

type ContactGroup = {
  id: string;
  contactName: string;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
};

type ExternalAddress = {
  id: string;
  contactGroupId: string;
  groupHandle: Uint8Array;
  scope: string;
  address: string;
  blockchainFamily: string;
  chainId?: bigint;
  hmacRest: Uint8Array;
};

type LedgerAccountContact = {
  id: string;
  accountName: string;
  derivationPath: string;
  blockchainFamily: string;
  chainId?: bigint;
  hmacProof: Uint8Array;
};
```

`ContactGroup.groupHandle` is canonical. The copy on each `ExternalAddress` is
kept for operation payloads and must match the linked contact group. External
contact/address models do not expose `derivationPath`; implementations use the
kit-owned internal constant.

`id` and `contactGroupId` are client-side identifiers for host storage and UI
linking only. They are not device values and never appear in the kit or signer
contracts, where records are linked by the device value `groupHandle`.

**Acceptance criteria**

- The UI invokes all six public management methods on `ContactsManager` and
  renders the progress states and errors emitted by each method.
- The UI stays unaware of kit internals: it does not reference `UseCase`s,
  `Command`s, `DeviceAction`s, or the app binder directly.
- A single canonical address-book contract is reused by the playground and
  signer integrations, or explicit family adapters are provided. The model
  preserves blockchain family, chain reference, group linkage, and opaque proof
  material without exposing the external-contact derivation path.
- The UI persists and reloads the full address book.
- Successful flows update only the proof fields returned by the corresponding
`ContactsManager` method.
- A documented manual validation matrix covers all six public `ContactsManager`
operations on a compatible device.

### Ticket 1.10 — `[TS][Contacts] Exposing reusable address-book utilities`

Optional follow-up. While building the playground (Ticket 1.9), the developer
will likely write helpers to serialize proof values, look up contacts and
addresses, and update the address book after a successful operation. This ticket
moves the generic ones into `@ledgerhq/device-contacts-kit` so other hosts can
reuse them.

Decide per helper whether it is host-agnostic (belongs in the kit) or specific
to the browser/UI (stays in the playground).

**Acceptance criteria**

- Only host-agnostic helpers already used by the playground are moved into the
  kit. Browser and UI-specific code stays in the playground.
- Moved helpers are documented and fully unit tested.
- Optional: this ticket does not block the playground or Epic 1.

---

## Epic 2 — `[TS][Contacts] Ethereum signer contact clear signing`

**Goal:** when an Ethereum signing flow has matching Contacts data, provide it
to the device before the signing APDU so the device can clear-sign the contact
names.

**Epic acceptance criteria**

- `SignerEthBuilder` optionally accepts a complete, EVM-compatible address-book
snapshot without changing existing behavior when it is absent.
- Ethereum signing flows match the recipient to an external contact and the
signing account to a Ledger-account contact for the active chain.
- Matches are provided automatically to the device before signing, with typed
`DeviceAction` progress and errors; non-matches preserve the existing flow.
- The web playground validates external-contact and Ledger-account contact
clear-signing on a compatible device.

### Ticket 2.1 — `[TS][Contacts] Accepting an address book in the Ethereum signer`

Add an optional `addressBook` to `SignerEthBuilder`. It must be a complete
snapshot of the address book; mutation and persistence remain the host's
responsibility.

Building this snapshot from the canonical address book filters by
`blockchainFamily`: only EVM-family contacts and accounts belong in an
`EvmAddressBook`. Family selection happens here, so the signer's in-flow
matching never needs `blockchainFamily` and the EVM models do not carry it.

```ts
type EvmAddressBook = {
  contactGroups: EvmContactGroup[];
  externalAddresses: EvmExternalAddress[];
  ledgerAccounts: EvmLedgerAccountContact[];
};

type EvmContactGroup = {
  contactName: string;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
};

type EvmExternalAddress = {
  groupHandle: Uint8Array;
  scope: string;
  address: `0x${string}`;
  chainId: bigint;
  hmacRest: Uint8Array;
};

type EvmLedgerAccountContact = {
  accountName: string;
  derivationPath: string;
  chainId: bigint;
  hmacProof: Uint8Array;
};
```

**Acceptance criteria**

- The model retains every field required to provide an external contact or
Ledger-account contact to the device.
- The signer reuses the canonical address-book contract or provides an explicit
  EVM adapter. The public model does not expose the external-contact derivation
  path.
- The builder remains backwards compatible when no address book is supplied.
- Unit tests cover construction with and without contacts.

### Ticket 2.2 — `[TS][Contacts] Providing matching external contacts in the Ethereum signer`

Use `ProvideContactCommand` (for `PROVIDE CONTACT`) in the Ethereum signing
flows. It is a public, standalone `Command` in `@ledgerhq/device-contacts-kit`,
not attached to `ContactsManager`. If it does not exist in the kit yet, add it
here; otherwise reuse it.

Before each Ethereum signing entrypoint sends its signing APDU, match the
transaction `to` address against `EvmExternalAddress` records for the
transaction chain. On a match, send `ProvideContactCommand` with the matched
contact group and external address before signing.

- Firmware `Command`: [PROVIDE CONTACT](https://ledgerhq.atlassian.net/wiki/spaces/FW/pages/6992035925/Address+Book+Final+Specifications#Provide-Contact).
- Match on recipient `address` + `chainId` only. Blockchain family is already
resolved upstream (the signer receives an EVM-only `EvmAddressBook`), so a
same-address record in another family is never present here. Within EVM,
`chainId` disambiguates the same address across chains.
- The matching lives in the Ethereum signer (exact location left to the
implementer) and is a pure, independently testable step.
- Insert the provide step into the existing signing flows, following the
signer's established clear-signing patterns. Do not add a new public API or make
the host call a separate Contacts API.
- Apply this consistently to every signer entrypoint that has a transaction
recipient.
- No match must preserve existing signing behavior.

**Suggested types**

```ts
type ProvideEvmContactInput = {
  contactName: string;
  scope: string;
  address: `0x${string}`;
  chainId: bigint;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
  hmacRest: Uint8Array;
};

type ProvideEvmContactOutput = void;
```

**Acceptance criteria**

- `ProvideContactCommand` exists in the kit as a public standalone `Command`,
fully unit tested (payload encoding and response decoding); this ticket adds it
if missing and never duplicates it.
- The Ethereum signer's contact-matching step is fully unit tested,
independently of device I/O.
- Tests cover an exact recipient/chain match, no match, and a same-address
different-chain non-match.
- The provide step is inserted into the existing signing flows and exposes its
progress through the signing `DeviceAction` before signing.
- A failed provide follows the firmware/API error policy and is surfaced as a
typed signer `DeviceAction` error.
- The web playground can sign a transaction to a saved external contact and
verify the device's clear-signing display.

### Ticket 2.3 — `[TS][Contacts] Providing matching Ledger account contacts in the Ethereum signer`

Use `ProvideLedgerAccountContactCommand` (for `PROVIDE LEDGER ACCOUNT CONTACT`)
in the Ethereum signing flows. It is a public, standalone `Command` in
`@ledgerhq/device-contacts-kit`, not attached to `ContactsManager`. If it does
not exist in the kit yet, add it here; otherwise reuse it.

Before each Ethereum signing entrypoint sends its signing APDU, match the
transaction `from` account context against `EvmLedgerAccountContact` records
by derivation path and chain. On a match, send
`ProvideLedgerAccountContactCommand` with the matched Ledger-account contact
before signing.

- Firmware `Command`: [PROVIDE LEDGER ACCOUNT CONTACT](https://ledgerhq.atlassian.net/wiki/spaces/FW/pages/6992035925/Address+Book+Final+Specifications#Provide-Ledger-Account-Contact).
- Match on `derivationPath` + `chainId` only. Blockchain family is already
resolved upstream (the signer receives an EVM-only `EvmAddressBook`), so a
same-path account in another family — e.g. Tron — is never present here. Within
EVM, `chainId` disambiguates the same path across chains.
- Match by device-account identity, not by an address string supplied by an
untrusted transaction payload.
- The matching lives in the Ethereum signer (exact location left to the
implementer) and is a pure, independently testable step.
- Insert the provide step into the existing signing flows, following the
signer's established clear-signing patterns. Do not add a new public API.

**Suggested types**

```ts
type ProvideEvmLedgerAccountContactInput = {
  accountName: string;
  derivationPath: string;
  chainId: bigint;
  hmacProof: Uint8Array;
};

type ProvideEvmLedgerAccountContactOutput = void;
```

**Acceptance criteria**

- `ProvideLedgerAccountContactCommand` exists in the kit as a public standalone
`Command`, fully unit tested (payload encoding and response decoding); this
ticket adds it if missing and never duplicates it.
- The Ethereum signer's account-matching step is fully unit tested,
independently of device I/O.
- Tests cover matching and non-matching derivation paths and chain IDs.
- The provide step is inserted into the existing signing flows and exposes its
progress through the signing `DeviceAction` before signing.
- A failed provide follows the firmware/API error policy and is surfaced as a
typed signer `DeviceAction` error.
- The web playground can sign from a saved Ledger-account contact and verify
the device's clear-signing display.

---

## Epic 3 — `[TS][Contacts] Tron signer contact clear signing`

**Goal:** provide matching Contacts data in Tron signing flows with the same
behavioral guarantees as Ethereum, while preserving Tron-specific address
handling.

**Epic acceptance criteria**

- The Tron signer optionally accepts a complete address-book snapshot that
preserves all proof material.
- Tron signing flows match recipients and signing accounts against saved
external and Ledger-account contacts.
- Matches are provided automatically to the device before signing, with typed
`DeviceAction` progress and errors; non-matches preserve the existing flow.
- The web playground validates external-contact and Ledger-account contact
clear-signing on a compatible device.

### Ticket 3.1 — `[TS][Contacts] Accepting an address book in the Tron signer`

Add an optional `addressBook` to the Tron signer builder. The model must retain
the same proof material as the Contacts kit, with Tron-specific identifiers.

Building this snapshot from the canonical address book filters by
`blockchainFamily`: only Tron-family contacts and accounts belong in a
`TronAddressBook`. Family selection happens here, so the signer's in-flow
matching never needs `blockchainFamily` and the Tron models do not carry it.

```ts
type TronAddressBook = {
  contactGroups: TronContactGroup[];
  externalAddresses: TronExternalAddress[];
  ledgerAccounts: TronLedgerAccountContact[];
};

type TronContactGroup = {
  contactName: string;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
};

type TronExternalAddress = {
  groupHandle: Uint8Array;
  scope: string;
  address: string;
  hmacRest: Uint8Array;
};

type TronLedgerAccountContact = {
  accountName: string;
  derivationPath: string;
  hmacProof: Uint8Array;
};
```

**Acceptance criteria**

- Tron models omit `chainId`, which the firmware specification only includes
  for Ethereum.
- The signer reuses the canonical address-book contract or provides an explicit
  Tron adapter. The public model does not expose the external-contact
  derivation path.
- The builder remains backwards compatible without an address book.
- Unit tests cover construction and the address-book serialization boundary.

### Ticket 3.2 — `[TS][Contacts] Providing matching external contacts in the Tron signer`

Use `ProvideContactCommand` (for `PROVIDE CONTACT`) in the Tron signing flows.
It is a public, standalone `Command` in `@ledgerhq/device-contacts-kit`, not
attached to `ContactsManager`. If it does not exist in the kit yet, add it here;
otherwise reuse it.

Before a Tron signing entrypoint sends its signing APDU, match the transaction
recipient to an external address record. On a match, send `ProvideContactCommand`
with the matched contact before signing.

- Firmware `Command`: [PROVIDE CONTACT](https://ledgerhq.atlassian.net/wiki/spaces/FW/pages/6992035925/Address+Book+Final+Specifications#Provide-Contact).
- Match on recipient `address` only (Tron has a single chain). Blockchain family
is already resolved upstream (the signer receives a Tron-only `TronAddressBook`),
so a same-address record in another family is never present here.
- Normalize addresses only through existing Tron signer utilities; do not
introduce a second normalization implementation.
- The matching lives in the Tron signer (exact location left to the
implementer) and is a pure, independently testable step.
- Insert the provide step into the existing signing flows, following the
signer's established clear-signing patterns. Do not add a new public API.

**Suggested types**

```ts
type ProvideTronContactInput = {
  contactName: string;
  scope: string;
  address: string;
  groupHandle: Uint8Array;
  hmacProof: Uint8Array;
  hmacRest: Uint8Array;
};

type ProvideTronContactOutput = void;
```

**Acceptance criteria**

- `ProvideContactCommand` exists in the kit as a public standalone `Command`,
fully unit tested (payload encoding and response decoding); this ticket adds it
if missing and never duplicates it.
- The Tron signer's contact-matching step is fully unit tested, independently of
device I/O.
- Tests cover match, no match, and normalized-equivalent addresses.
- The provide step is inserted into the existing signing flows and exposes its
progress through the signing `DeviceAction` before signing.
- A failed provide follows the firmware/API error policy and is surfaced as a
typed signer `DeviceAction` error.
- The web playground can sign to a saved Tron external contact and confirm the
contact is clear-signed on device.

### Ticket 3.3 — `[TS][Contacts] Providing matching Ledger account contacts in the Tron signer`

Use `ProvideLedgerAccountContactCommand` (for `PROVIDE LEDGER ACCOUNT CONTACT`)
in the Tron signing flows. It is a public, standalone `Command` in
`@ledgerhq/device-contacts-kit`, not attached to `ContactsManager`. If it does
not exist in the kit yet, add it here; otherwise reuse it.

Before a Tron signing entrypoint sends its signing APDU, match the selected
signing account against the saved Ledger-account contacts by derivation path. On
a match, send `ProvideLedgerAccountContactCommand` with the matched account
contact before signing.

- Firmware `Command`: [PROVIDE LEDGER ACCOUNT CONTACT](https://ledgerhq.atlassian.net/wiki/spaces/FW/pages/6992035925/Address+Book+Final+Specifications#Provide-Ledger-Account-Contact).
- Match on `derivationPath` only (Tron has a single chain). Blockchain family is
already resolved upstream (the signer receives a Tron-only `TronAddressBook`), so
a same-path account in another family — e.g. Ethereum — is never present here.
- Match by device-account identity, not by an address string supplied by an
untrusted transaction payload.
- The matching lives in the Tron signer (exact location left to the
implementer) and is a pure, independently testable step.
- Insert the provide step into the existing signing flows, following the
signer's established clear-signing patterns. Do not add a new public API.

**Suggested types**

```ts
type ProvideTronLedgerAccountContactInput = {
  accountName: string;
  derivationPath: string;
  hmacProof: Uint8Array;
};

type ProvideTronLedgerAccountContactOutput = void;
```

**Acceptance criteria**

- `ProvideLedgerAccountContactCommand` exists in the kit as a public standalone
`Command`, fully unit tested (payload encoding and response decoding); this
ticket adds it if missing and never duplicates it.
- The Tron signer's account-matching step is fully unit tested, independently of
device I/O.
- Tests cover matching and non-matching derivation paths.
- The provide step is inserted into the existing signing flows and exposes its
progress through the signing `DeviceAction` before signing.
- A failed provide follows the firmware/API error policy and is surfaced as a
typed signer `DeviceAction` error.
- The web playground can sign from a saved Tron Ledger-account contact and
verify the device's clear-signing display.

---

## Cross-epic completion criteria

- Every firmware `Command` has unit coverage, and every public operation
(management and signer clear-signing) has a manual playground validation
scenario on a compatible device.
- No Contacts operation persists state in the kit or signers; hosts own the
address book and only persist returned proof material after success.
- `skipOpenApp` is offered only by coin-app Contacts management `DeviceAction`s.
- The version helper data, the Contacts kit, and signer clear-signing behavior
are documented in their respective package READMEs or API docs.

