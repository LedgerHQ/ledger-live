# Contacts (internal alpha)

If you're working on the Contacts feature in Ledger Wallet Desktop, read this
first. Everything you need to write code in this app is below.

## Project rule (rigid)

All new UI in this feature MUST use the Lumen design system —
`@ledgerhq/lumen-ui-react` for components, `@ledgerhq/lumen-ui-react/symbols`
for icons. Do not introduce `styled-components` or `@ledgerhq/react-ui`
components in new Contacts code. If Lumen is missing a primitive you need,
raise it on the LWD channel rather than reaching for the legacy library.

## What's working today (after L1)

- A local Contacts store (separate from LWD's main persistence —
  `lld-contacts.json`).
- A top-bar icon (rightmost, after "My Ledger") gated on
  `settings.contactsAlpha`. Toggle the flag in Developer settings →
  "Enable Contacts alpha". Clicking the icon opens a Lumen Dialog containing
  the L1 validation panel.
- The panel has one button per DMK Contacts verb, hard-coded inputs, no
  polish. Each click maps 1:1 to a `useContacts()` hook method — this is
  your reference implementation.
- A stable hook `useContacts(sessionId)` at
  `apps/ledger-live-desktop/src/renderer/contacts/useContacts.ts` that
  exposes every verb as a Promise-based method.

## What you're building (L3 and L4)

- **L3 — Contacts management UX**: replace the L1 Dialog body with the real
  panel. Same verbs, real forms, real list. Each user click maps 1:1 to a
  hook method below.
- **L4 — Send recipient picker**: in the EVM Send flow, replace the
  paste/ENS field with a Contacts dropdown. Decoration on the device's
  review screen is now handled by the DMK ContextModule's
  `ContactsDataSource` (registered on the SignerEth ContextModule) — you no
  longer call `provideContact` / `provideLedgerAccount` manually before
  signing. The `useContacts` hook is the read surface; integration with the
  signer-eth ContextModule is a separate seam to land during L4 planning.

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
- For L4: the new ContactsDataSource path is contact-decoration only. ENS /
  `provideTrustedName` precedence is still unresolved upstream — prefer
  contact-wins until firmware specifies otherwise.

## Tester gotchas

- After any `editAddress` or `editAddressLabel`, quit and reopen the
  Ethereum app on the device before the next Sign-like operation (the
  device's Provide cache only flushes on `app_quit`).
- `editExternalAddressLabel` is typed-only in the current DMK snapshot — the
  default implementation throws "not implemented". The hook surface exists
  so L3 doesn't need to change shape when M4 lands the real APDU wiring.

## Pointer

Deeper context (Python protocol reference, upstream firmware asks, strategic
timeline): see the PM's local playground repo, not committed here.
