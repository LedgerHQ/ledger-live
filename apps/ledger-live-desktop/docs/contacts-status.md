# Contacts (internal alpha) — status

Read [`contacts.md`](contacts.md) first for the project rule, hook contract,
and DMK verb cheat sheet. This file tracks the L0–L4 rollout state.

## Ladder

- [x] L0 — Foundation
- [x] L1 — Top-bar access point + Lumen Dialog validation panel
- [x] L2 — Send ETH device-side decoration + recipient pill
- [x] L2.1 — Diagnose missing device-side decoration during Send
- [x] L2.2 — Registered Ledger account decoration (From + self-transfer To) + Send badges
- [ ] L3 — Validation panel enrichment for designer handoff
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
`contactsDataSource.test.ts`. Known follow-up (deferred to L3): each
`useContactsStore()` instance owns its own `useState`, so a `commit()`
from the dialog does not flow into the registration hook in
`Default.tsx` — populating contacts and signing within the same
session without re-mount still misses. The designer-led list/forms in
L3 will need a single source of truth (Redux slice or broadcast)
anyway, so we fix it there.

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

Bring the Lumen Dialog up to parity with the DMK sample app's Contacts
forms (`apps/sample/src/components/ContactsView/*Form.tsx` in the
`LedgerHQ/device-sdk-ts` repo). Per-verb input fields (name, hex address,
scope, derivation path, chain id) replacing fixtures; field-level
validation with inline errors; surfaced device-action errors (which verb,
which input, what the device returned); edge-case handling
(rename-to-existing, edit with stale HMAC, contact-not-found,
no-active-session); per-field loading / disabled states. The goal is a
complete functional reference the designer can use to understand input
constraints and error states without rediscovering them in Figma.

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
