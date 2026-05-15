# Contacts (internal alpha) — status

Read [`contacts.md`](contacts.md) first for the project rule, hook contract,
and DMK verb cheat sheet. This file tracks the L0–L4 rollout state.

## Ladder

- [x] L0 — Foundation
- [x] L1 — Top-bar access point + Lumen Dialog validation panel
- [x] L2 — Send ETH device-side decoration + recipient pill
- [x] L2.1 — Diagnose missing device-side decoration during Send
- [x] L2.2 — Registered Ledger account decoration (From + self-transfer To) + Send badges
- [x] L3 — Validation panel enrichment for designer handoff
- [x] L3.1 — Code simplification pass
- [x] L3.2 — Decorated "Select account" rows in Send
- [x] L3.3 — Recipient autocomplete from Contacts on Send → To:
- [x] L3.4 — Sectioned recipient picker + green hardware-bound badge
- [ ] L4 — Designer-led Contacts management UX
- [ ] L5 — Send recipient picker

## Milestones

### L0 — Foundation

Local `contactsAlpha` Developer toggle (settings slice). Isolated
`electron-store` at `lld-contacts.json` with dedicated IPC channels.
Renderer hook `useContactsStore()` as the single read/write seam. Persisted
schema mirrors the DMK `Wallet` shape (camelCase) so values flow into
`SignerEth` / `ContactsService` with no renaming.

### L1 — Top-bar access point + Lumen Dialog validation panel

Top-bar icon (rightmost, after "My Ledger"), gated on the alpha flag. Lumen
`Dialog` with one button per DMK verb, hard-coded fixtures, no form polish.
Each button maps 1:1 to a `useContacts()` method. Storage viewer is a dialog
sub-view, reachable via a `Link` and a back-arrow on the `DialogHeader`.

### L2 — Send ETH device-side decoration + recipient pill

DMK auto-decoration pipeline wired: a `liveContactsDataSource` singleton in
`@ledgerhq/live-dmk-shared` is registered on `DmkSignerEth`'s
`ContextModule`. EVM Send shows a recipient pill on the Amount step
decorated from the local Contacts store. All gated on the alpha flag —
byte-equal to today when off. Initial sign-review decoration was broken
by an address-prefix mismatch in the renderer adapter — see L2.1.

### L2.1 — Diagnose missing device-side decoration during Send

Root cause was in our renderer-side adapter, not DMK/firmware: the L1
dialog's "Add contact" fixture stores `addressHex` without a `0x`
prefix, but ethers gives `tx.to` a `0x`-prefixed EIP-55 string at Sign
time. The lookup `normalize()` in `contactsDataSource.ts` and
`useDisplayAddress.ts` only lowercased — so `lookupTo` missed,
`ContactsContextLoader` emitted nothing, and no Provide Contact APDU
ever reached the device. Fix: strip an optional `0x` prefix in both
`normalize()` callers; storage stays verbatim so the device-side HMAC
on the registered address still validates. Regression test cases
added for stored-without-prefix / stored-with-prefix in
`contactsDataSource.test.ts`. Cross-consumer store-sync issue
(populating in the dialog vs. reading in the registration hook on
`Default.tsx`) resolved in L3 via a module-level snapshot exposed
through `useSyncExternalStore` in
`renderer/contacts/hooks.ts` — every consumer now observes the same
wallet object.

### L2.2 — Registered Ledger account decoration (From + self-transfer To) + Send badges

Closes the second decoration gap: signing **from** a registered Ledger
account, and the self-transfer **to** case where `to == from`. DMK's
`SignTransactionDeviceAction` already resolves the sender via
`GetAddressCommand` and injects `subset.from`, so the wire was ready —
the gap was that the L1 fixture registered a placeholder account at a
derivation path that did not match the user's actual signing account.
The dialog's "Add Ledger account" verb now reads the first Ethereum
account from Redux (`accountsSelector`) and registers *that* account's
real `name` / `freshAddressPath` / chainId, and the panel renders the
picked address below the button so the tester can paste it into Send
for the self-transfer scenario. The data source's existing `lookupFrom`
+ Ledger-account-precedence in `lookupTo` then do the rest. The
Send-flow surfacing gets a tiny `ContactBadge` component
(`renderer/contacts/ContactBadge.tsx`): a Lumen-tokenized chip with two
labels — "Contact" (external) and "Account" (registered Ledger
account) — rendered next to the recipient input on the Amount step and
above-right of the description on every step when the active LWD
account is registered. All deferred polish — designer-led icons /
colours on the badge, a real account picker dropdown for
registration, and richer name-mismatch handling — lands in L3.

### L3 — Validation panel enrichment for designer handoff

Lumen Dialog brought up to parity with the DMK sample app's Contacts
forms (`apps/sample/src/components/ContactsView/*Form.tsx` in the
`LedgerHQ/device-sdk-ts` repo). Five form sections, one per DMK verb
(`RegisterExternalAddress`, `RegisterLedgerAccount`, `RenameContact`,
`EditAddress`, `EditAddressLabel`), each with per-field validation,
duplicate detection, char counters, and surfaced device-action errors.
Canonical device flow via a `<DeviceAction>` connect→verify step that
matches every other device-bound flow in LWD; `useContacts` opens its
DMK transport via `withDevice` and verbs are scoped to the active
device session. Module-level `useSyncExternalStore` snapshot in
`renderer/contacts/hooks.ts` so the dialog, the data source
registration, and the Send-side decoration all observe the same wallet
without re-mounting — closes the L2.1 store-sync follow-up.

### L3.4 — Sectioned recipient picker + green hardware-bound badge

Three coordinated UI polish moves on the Send surface:

- `ContactBadge` for `kind="ledgerAccount"` now renders as Lumen
  `Tag` `appearance="success"` with the `Devices` symbol icon —
  green + a device glyph communicates "hardware-bound" inline.
  Single source of truth, so the sender pill above the input AND the
  L3.2 "Select account" row decoration both pick up the new look.
- The recipient-side pill (next to the input on the Recipient and
  Amount steps) is removed entirely. The picker rows already show
  which kind each suggestion is, and the Amount step shows the
  resolved contact name in the input itself — a separate pill was
  redundant.
- `RecipientSuggestionsDropdown` is replaced by an inline
  `RecipientPicker`: when the recipient input is empty, it lists the
  full inventory grouped under "Ledger accounts" and "Address book"
  (Lumen `Subheader` headers, Lumen `ListItem` rows, Lumen `Avatar`
  for now — per-contact avatars are a follow-up). Typing filters
  both sections by name or address prefix and hides any section that
  goes empty. Clicking a row sets the full 0x address; the picker
  auto-folds when the entered query is the full address of an
  existing entry. The pure builder is `buildRecipientSuggestionGroups`
  in `hooks/useRecipientSuggestions.ts`, covered by 9 unit tests:
  empty wallet, browse-mode inventory, chainId filter, name/address
  prefix filtering, Ledger-over-external dedup, full-address self-
  hide (matching vs. non-matching).

### L3.3 — Recipient autocomplete from Contacts on Send → To:

Typing into the Send recipient input now opens a dropdown of saved
Contacts (external entries + registered Ledger accounts) that match
the typed prefix on the active chain. Clicking a suggestion fills the
field with the full 0x-prefixed address; the existing validation
pipeline picks up from there exactly as if the user had pasted it.
The pure builder is in `hooks/useRecipientSuggestions.ts`
(`buildRecipientSuggestions`) — covered by 11 unit tests: chainId
filter, case-insensitive name prefix, hex prefix with/without 0x,
Ledger-over-external dedup precedence, MAX_SUGGESTIONS=5 cap, full
40-char address self-hide. Hook gates on `contactsAlpha`; component
(`components/RecipientSuggestionsDropdown`) sits absolute under the
`AddressInput` and uses `onMouseDown` + preventDefault to fire its
select before the input's blur tears it down.

### L3.2 — Decorated "Select account" rows in Send

When the user opens the Send flow's account selector, EVM accounts that
have been registered through Contacts now carry an inline Lumen `Tag`
next to the account name showing the on-device-registered identity
(e.g. "Trezor Migration"). Implementation: a pure `resolveContact`
helper extracted from `useDisplayAddress` (sync, no hooks, safe to
call inside a `.map`), an optional `titleDecoration` slot on
`ModularDialog`'s `AccountListItem`, and a `getTitleDecoration`
closure threaded through `AccountVirtualList` from
`AccountSelectorContent` — that's the only place that knows the
asset's `chainId` and observes the wallet snapshot. Behind the
`contactsAlpha` flag; non-EVM assets and non-registered addresses
render unchanged.

### L3.1 — Code simplification pass

Tightening sweep before Send-flow surfacing (L4+). `ContactBadge`
switched from inline Tailwind to the Lumen `Tag` primitive
(`size="sm"`, `appearance="accent-subtle" | "gray"`). Two-step
"pick contact → pick entry" state machine shared between
`EditAddressSection` and `EditAddressLabelSection` extracted into
`hooks/useContactEntryPicker`. Five inline name/label/address
validity expressions across the form files collapsed into two
predicates in `validation.ts` (`isInvalidAsciiLabel`,
`isInvalidPartialAddressHex`). `PRINTABLE_ASCII` regex inlined to
its sole consumer in `validation.ts` and dropped from `constants.ts`.
No behavior change — all five forms still call the same DMK verbs
with the same payloads.

### L4 — Designer-led Contacts management UX

Real list view + forms in the designer's Figma-driven shape, replacing the
L3 enrichment panel as the user-facing surface. Hook contract is still
frozen — no DMK or signer churn. Pure Lumen UI work driven by design.

### L5 — Send recipient picker

In the EVM Send flow, swap the paste/ENS recipient field for a Contacts
dropdown sourced from `useContacts`. Device-side decoration is handled by
L2's `ContactsDataSource` registration (assuming L2.1 closes cleanly).
Resolve the open precedence question (Contact vs `provideTrustedName`)
when this lands.

## Pinned dependencies

`@ledgerhq/device-management-kit`, `@ledgerhq/device-signer-kit-ethereum`,
and `@ledgerhq/context-module` are pinned to a snapshot from the
`feat/contacts` branch of `LedgerHQ/device-sdk-ts`. Exact tag lives in
`pnpm-lock.yaml`.

## Sync surface

The Contacts feature is co-developed across three public LedgerHQ repos:
this one (`ledger-live`, Wallet Desktop consumer), `device-sdk-ts` (DMK
core + `signer-eth` + `context-module`, on the `feat/contacts` branch),
and `app-ethereum` (firmware-side Ethereum app — device-side rendering of
contact names on the Sign review). The pnpm pin above tracks DMK;
firmware coordination happens at the `app-ethereum` repo directly.

## Update protocol

When an L# is committed, flip its checkbox above (`[ ]` → `[x]`) and, if
scope shifted during implementation, update its paragraph in **Milestones**
to match what shipped. Both edits go in the same commit as the L# feature
code so status and code move in lock-step. Same rule applies to
sub-milestones like L2.1.
