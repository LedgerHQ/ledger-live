# Contacts (internal alpha)

If you're working on the Contacts feature in Ledger Wallet Desktop, read this
first. Everything you need to write code in this app is below.

## Project rule (rigid)

All new UI in this feature MUST use the Lumen design system —
`@ledgerhq/lumen-ui-react` for components, `@ledgerhq/lumen-ui-react/symbols`
for icons. Do not introduce `styled-components` or `@ledgerhq/react-ui`
components in new Contacts code. If Lumen is missing a primitive you need,
raise it through the usual Lumen-adoption channel for this repo.

## What's working today (after L3.5)

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
- Send-side surfacing across three seams:
  - On-device decoration via the `liveContactsDataSource` singleton
    registered on `DmkSignerEth`'s ContextModule.
  - "Select account" rows (ModularDialog `AccountSelector`) carry an
    inline Lumen `Tag` — green `appearance="success"` + `Devices`
    symbol — next to any LL account whose address matches a
    registered Ledger account in the local store. Resolution via
    `resolveContact` (pure) in `renderer/contacts/useDisplayAddress.ts`.
  - Recipient input on Send → To: hosts an inline `RecipientPicker`
    (`mvvm/features/Send/components/RecipientPicker.tsx`) with two
    sections, Contacts first and Ledger accounts second (Lumen
    `Subheader` + `ListItem` + `Avatar`). Empty input → full
    inventory on the active chain; typing filters both sections by
    name or address-hex prefix; picker auto-folds when the entered
    query is the full address of an existing entry. Click a row →
    `recipientSearch.setValue(addressHex)` and the standard
    validation pipeline takes over.

## What you're building (L4, L5)

- **L4 — Designer-led Contacts management UX**: a real user-facing surface
  for browsing / creating / editing contacts, in the designer's
  Figma-driven shape. Consumes `useContacts()` only — hook contract is
  frozen, no DMK or signer churn. Pure Lumen UI work. Lives in a new
  subtree under `mvvm/features/Contacts/<new-surface>/`; the existing L1
  validation panel stays mounted as a hidden dev tool alongside it.
- **L5 — Send recipient picker**: in the EVM Send flow, replace the
  paste/ENS field with a Contacts-driven dropdown. Most of the picker UI
  already shipped in L3.3–L3.5 (see `RecipientPicker` below); L5 is the
  swap of the address input itself and the resolution of the Contact vs.
  `provideTrustedName` precedence question. Device-side decoration on the
  review screen is already handled by the DMK ContextModule's
  `ContactsDataSource` — you no longer call `provideContact` /
  `provideLedgerAccount` manually before signing.

## Surface inventory (for L4 / L5 work)

Three tiers — know which one a file belongs to before you change it.

### Frozen — DO NOT modify

DMK plumbing and the hook contract. The designer never edits these.

- `src/renderer/contacts/useContacts.ts` — the hook contract.
- `src/renderer/contacts/storage.ts` — IPC bridge to `lld-contacts.json`.
- `src/renderer/contacts/hooks.ts` — `useSyncExternalStore` snapshot.
- `src/renderer/contacts/types.ts` — schema mirroring DMK types.
- `src/renderer/contacts/contactsDataSource.ts` — device-side lookup.
- `src/renderer/contacts/useContactsDataSourceRegistration.ts` —
  app-mount registration on `DmkSignerEth`'s `ContextModule`.
- `libs/live-dmk-shared/src/services/LiveContactsDataSource.ts` — the
  singleton shared with DMK.

### Dev tool — leave as-is

The L1 validation panel (the dialog that opens from the top-bar icon)
under `src/mvvm/features/Contacts/`. Treat the whole subtree as frozen
during L4 — it stays mounted in parallel with the new design-led surface
as a dev panel. Do not refactor or rip it out.

### Extension points — your playground

These are the small, pure pieces the designer iterates on for L4 and L5.

- `src/renderer/contacts/ContactBadge.tsx` — the Lumen `Tag` chip
  ("Contact" / hardware-bound "Account") rendered next to recipient
  and account rows.
- `src/renderer/contacts/useDisplayAddress.ts` — exports the pure
  `resolveContact(address, chainId, wallet)` helper. No hooks, safe to
  call inside `.map`. Reuse this instead of writing new lookup logic.
- `src/mvvm/features/Send/components/RecipientPicker.tsx` — the inline
  picker under Send → To.
- `src/mvvm/features/Send/hooks/useRecipientSuggestions.ts` — pure
  builder `buildRecipientSuggestionGroups` (covered by unit tests in
  `__tests__/`). Reuse this for any list-of-suggestions UI.
- `src/mvvm/features/Send/screens/Recipient/components/AddressListItem.tsx` —
  EVM account row in the "Select account" modal with the
  `titleDecoration` slot. New decoration variants plug in here.

## How to test your changes

1. Run the desktop app: `pnpm desktop dev` from the repo root.
2. Settings → Developer → enable **"Contacts alpha"**. Flag toggle lives
   at `src/renderer/screens/settings/sections/Developer/ContactsAlphaToggle.tsx`.
3. Click the rightmost top-bar icon (after "My Ledger") to seed contacts
   via the L1 dev panel, then walk Send → To to see the picker, the
   badges, and the decorated account rows.

## Working with Figma

Paste a `figma.com` URL into your Claude prompt and Claude will use the
Figma MCP server to pull design context. Two rules to lean on:

- All new Contacts UI **must** use `@ledgerhq/lumen-ui-react` (see the
  project rule at the top). Claude has the `ldls-web` skill — it will
  auto-load when you do UI work; let it.
- Match existing extension-point components (`ContactBadge`,
  `RecipientPicker`, decorated `AddressListItem`) before introducing
  new primitives — they already encode the agreed visual language for
  this feature.

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
