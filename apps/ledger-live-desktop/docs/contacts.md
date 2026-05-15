# Contacts (internal alpha)

If you're working on the Contacts feature in Ledger Wallet Desktop, read this
first. Everything you need to write code in this app is below.

## Project rule (rigid)

All new UI in this feature MUST use the Lumen design system —
`@ledgerhq/lumen-ui-react` for components, `@ledgerhq/lumen-ui-react/symbols`
for icons. Do not introduce `styled-components` or `@ledgerhq/react-ui`
components in new Contacts code. If Lumen is missing a primitive you need,
raise it through the usual Lumen-adoption channel for this repo.

## What's working today (after L3)

- A local Contacts store (separate from LWD's main persistence —
  `lld-contacts.json`).
- A top-bar icon (rightmost, after "My Ledger") gated on
  `settings.contactsAlpha`. Toggle the flag in Developer settings →
  "Enable Contacts alpha". Clicking the icon opens a Lumen Dialog containing
  the validation panel.
- The panel has one form section per DMK Contacts verb
  (`RegisterExternalAddress`, `RegisterLedgerAccount`, `RenameContact`,
  `EditAddress`, `EditAddressLabel`) with field-level validation, char
  counters, duplicate guards, and surfaced device-action errors.
- A canonical device flow: each verb runs through a `<DeviceAction>`
  connect→verify step (matching every other device-bound flow in LWD)
  and `useContacts` opens its DMK transport via `withDevice`.
- A stable hook `useContacts()` at
  `apps/ledger-live-desktop/src/renderer/contacts/useContacts.ts` that
  exposes every verb as a Promise-based method.
- Send-side surfacing: a `ContactBadge` (Lumen `Tag`) next to the
  recipient pill and above the sender description when either side is
  registered, plus on-device decoration via the `liveContactsDataSource`
  singleton registered on `DmkSignerEth`'s ContextModule.

## What you're building (L4, L5)

- **L4 — Designer-led Contacts management UX**: real list view + forms in
  the designer's Figma-driven shape, replacing the L3 enrichment panel as
  the user-facing surface. Hook contract is still frozen — no DMK or
  signer churn. Pure Lumen UI work driven by design.
- **L5 — Send recipient picker**: in the EVM Send flow, replace the
  paste/ENS field with a Contacts dropdown. Decoration on the device's
  review screen is handled by the DMK ContextModule's `ContactsDataSource`
  (registered on the SignerEth ContextModule) — you no longer call
  `provideContact` / `provideLedgerAccount` manually before signing. The
  `useContacts` hook is the read surface; integration with the signer-eth
  ContextModule is a separate seam to land during L5 planning.

## DMK action cheat sheet

| User verb                       | Hook method (returns Promise)              |
|---------------------------------|--------------------------------------------|
| Add contact (fresh)             | `addContact({name, addressHex, scope, derivationPath, chainId})` |
| Add address to existing contact | `addAddressToContact({contactName, name, addressHex, scope, …})` |
| Edit address label              | `editAddressLabel({contactName, oldLabel, newLabel, addressHex, chainId})` |
| Edit address (rotate bytes)     | `editAddress({contactName, oldAddressHex, newAddressHex, chainId})` |
| Rename contact                  | `renameContact({oldName, newName})`        |
| Add Ledger account              | `addLedgerAccount({name, derivationPath, chainId})` |
| Reset local data                | `reset()`                                  |

You do NOT import from `@ledgerhq/device-management-kit` or
`@ledgerhq/device-signer-kit-ethereum` directly. The hook is the contract.
Cryptographic proof fields (`groupHandleHex`, `hmacNameHex`, `hmacRestHex`,
`hmacProofHex`) are looked up from the local store and rotated automatically
on each successful device action — never pass them yourself.

## Storage contract

- The hook auto-persists after every successful device action.
- Schema mirrors the DMK TypeScript types (camelCase: `groupHandleHex`,
  `hmacNameHex`, `hmacRestHex`, `addressHex`, etc.). Never rename fields.
- The store is local-only and lives in `lld-contacts.json` (separate from
  LWD's main persistence).

## Don'ts

- No second storage path. No Redux-persist on Contacts. No Ledger Sync.
- No bypassing the `useContacts` hook — every DMK call routes through the
  same wrapper. One instrumentation point, one snapshot-to-upstream swap
  point.
- For L5: the new ContactsDataSource path is contact-decoration only. Order
  of precedence between Contact decoration and `provideTrustedName` is a
  known open design question; revisit when L5 lands.

## Tester gotchas

- After any `editAddress` or `editAddressLabel`, contact metadata on the
  device may show stale state until the Ethereum app is closed and
  reopened — quit/relaunch between scenarios.
- `editExternalAddressLabel` is typed-only in the current DMK snapshot — the
  default implementation throws "not implemented". The hook surface exists
  so L3 doesn't need to change shape when a future DMK release lands the
  real APDU wiring.

## Pointer

Current L0–L5 status: see [`contacts-status.md`](contacts-status.md) next to
this doc.

Cross-repo coordination: the DMK + signer-eth + context-module snapshot
consumed here ships from the `feat/contacts` branch of
`LedgerHQ/device-sdk-ts`; the firmware-side Ethereum app coordinates from
`LedgerHQ/app-ethereum`. See `contacts-status.md` for the live state.
