"use strict";

// Packages allowed to bend a rule, keyed by project root. Keep this list short and justified:
// every entry is a place where the convention does not hold, not a place where it is inconvenient.
//
// `skip` exempts the package from the barrel rule: none of its barrels are checked.
// `allowNonRelative` is narrower: it lifts only the proxy rule, for a package whose job *is* to
// re-expose another one. Prefer `allowNonRelative`, and prefer neither.
//
// Every entry is temporary. Give each one an exit condition so it can be deleted rather than
// inherited.

/** @type {Record<string, { skip?: boolean, allowNonRelative?: boolean, reason: string }>} */
const PACKAGE_EXCEPTIONS = {
  "shared/env": {
    skip: true,
    reason:
      "TEMPORARY. Deprecated typed facade over the legacy @ledgerhq/live-env (see " +
      ".agents/skills/configuration), holding the repo's only BOUNDARY_EXCEPTION " +
      "(tools/nx-plugins/enforce-boundaries/constraints.js). Its barrel carries the wrapping " +
      "itself, and the package is retired rather than restructured. Exit condition: once its " +
      "last definition has migrated, the package is deleted, and this entry with it.",
  },
};

// Public components allowed to break R1 to R5, keyed by project root, then by component name or,
// for a check on the entry itself, by subpath. `skip` above does not reach these rules.
//
// Each package that adopts the convention deletes its entries in the same change, so this list is
// the remaining debt. A waiver that no longer matches a violation fails the check.

const COMPONENT_REASONS = {
  R1:
    "It is exported from a universal entry on one platform only, or under another name on each. " +
    "Exit condition: export it on both platforms under the same name, or move it to a platform " +
    "entry, make it internal or move it to the app that renders it, then delete this entry.",
  R2:
    "Its two implementations do not take one props type from one unsuffixed module. Exit " +
    "condition: declare the props once in a contract module both implementations import, with " +
    "no platform-suffixed sibling, annotate each first parameter with it, then delete this entry.",
  R3:
    "Its contract depends on a platform: a platform import or type, a className or style prop, " +
    "a gesture callback name, or a platform-only prop that is not an optional primitive. Exit " +
    "condition: keep platform types in the implementations, name callbacks after the user's " +
    "intent, then delete this entry.",
  R4:
    "A platform module that declares it also exports something else, such as its props type. " +
    "Exit condition: move the props type to the contract and anything else to an unsuffixed " +
    "module, then delete this entry.",
  R5:
    "It is exported from both a universal entry and a platform entry. Exit condition: keep one " +
    "kind of entry for it, then delete this entry.",
};

const ENTRY_REASON =
  "TEMPORARY. This platform entry points at a module of a universal entry, or at a module " +
  "without its platform's suffix. Exit condition: drop the subpath and move its importers to the " +
  "universal entry, or point it at a suffixed module of its own that holds platform components " +
  "only, then delete this entry.";

/**
 * @param {...("R1" | "R2" | "R3" | "R4" | "R5")} rules
 * @returns {{ rules: string[], reason: string }}
 */
function componentWaiver(...rules) {
  return { rules, reason: `TEMPORARY. ${rules.map(rule => COMPONENT_REASONS[rule]).join(" ")}` };
}

/** @returns {{ rules: string[], reason: string }} */
function entryWaiver() {
  return { rules: ["R5"], reason: ENTRY_REASON };
}

/** @type {Record<string, Record<string, { rules: string[], reason: string }>>} */
const COMPONENT_EXCEPTIONS = {
  "features/flow/account-detail-settings": {
    AccountSettings: componentWaiver("R1"),
    AccountSettingsDialog: componentWaiver("R1"),
    AccountSettingsSheet: componentWaiver("R1"),
  },
  "features/flow/contacts": {
    ContactsButton: componentWaiver("R2", "R4"),
    ContactsView: componentWaiver("R2", "R3"),
  },
  "features/flow/flow-contacts-add-address": {
    "./native": entryWaiver(),
    ContactsAddAddressEntry: componentWaiver("R2", "R3", "R4", "R5"),
    ContactsAddAddressFlowContent: componentWaiver("R2", "R4", "R5"),
    ContactsAddAddressName: componentWaiver("R2", "R3", "R4", "R5"),
    ContactsAddAddressNameInput: componentWaiver("R1", "R3", "R4"),
    ContactsAddAddressReview: componentWaiver("R2", "R4", "R5"),
  },
  "features/flow/flow-contacts-add-contact": {
    "./native": entryWaiver(),
    ContactsAddContactContent: componentWaiver("R2", "R5"),
    ContactsAddContactDialog: componentWaiver("R1"),
    ContactsAddContactFooter: componentWaiver("R1", "R5"),
  },
  "features/flow/flow-contacts-delete-address": {
    ContactsDeleteAddressDialog: componentWaiver("R2"),
  },
  "features/flow/flow-contacts-delete-contact": {
    ContactsDeleteContactDialog: componentWaiver("R2"),
  },
  "features/flow/flow-contacts-detail": {
    "./native": entryWaiver(),
    ContactAddressDetailDialog: componentWaiver("R2", "R4", "R5"),
    ContactDetailActions: componentWaiver("R1", "R4"),
    ContactDetailActionsMenu: componentWaiver("R1", "R4", "R5"),
    ContactDetailView: componentWaiver("R3", "R5"),
    ContactsEditSignerMismatchDialog: componentWaiver("R2", "R4", "R5"),
  },
  "features/flow/flow-contacts-edit-address": {
    ContactsRenameAddressDialog: componentWaiver("R2"),
  },
  "features/flow/flow-contacts-edit-contact": {
    "./native": entryWaiver(),
    ContactsRenameContactDialog: componentWaiver("R1"),
    ContactsRenameContactDrawer: componentWaiver("R1", "R5"),
    ContactsRenameContactFooter: componentWaiver("R1", "R5"),
  },
  "features/flow/flow-contacts-list": {
    "./native": entryWaiver(),
    ContactsAddContactHeaderButton: componentWaiver("R1", "R4", "R5"),
    ContactsCompactList: componentWaiver("R3", "R5"),
    ContactsCompactRow: componentWaiver("R1", "R3", "R5"),
    ContactsListView: componentWaiver("R2", "R3", "R5"),
    ContactsSearchNoResults: componentWaiver("R1", "R5"),
  },
  "features/flow/pay-card-assets": {
    CardAssetDetailsDrawer: componentWaiver("R1"),
    CardAssetDetailsWithdrawDrawer: componentWaiver("R1"),
    CardAssetsManageDrawer: componentWaiver("R1"),
    CardAssetsManageFooter: componentWaiver("R1"),
    CardAssetsView: componentWaiver("R1", "R3"),
    CardAssetTransactionDetailDrawer: componentWaiver("R1"),
  },
  "features/flow/pay-card-details": {
    CardArtwork: componentWaiver("R2"),
    CardPrimaryActionButton: componentWaiver("R1"),
    CardTopUpButton: componentWaiver("R1"),
  },
  "features/flow/pay-card-transactions": {
    CardTransactionDetail: componentWaiver("R2"),
    CardTransactions: componentWaiver("R3"),
    CategoryIcon: componentWaiver("R4"),
    ListItem: componentWaiver("R3"),
  },
  "features/flow/pay-contact": {
    Contacts: componentWaiver("R2", "R3"),
    PaySuccess: componentWaiver("R2", "R4"),
  },
  "features/platform/contacts": {
    "./native": entryWaiver(),
    "./web": entryWaiver(),
    ContactAvatar: componentWaiver("R2", "R4", "R5"),
    ContactConfirmationBottomSheet: componentWaiver("R1", "R4", "R5"),
    ContactConfirmationDialog: componentWaiver("R1"),
    ContactNameDisclaimer: componentWaiver("R1", "R5"),
    ContactNameInput: componentWaiver("R2", "R5"),
  },
  "shared/ui-info-state": {
    DialogBackgroundGradient: componentWaiver("R1"),
    DialogBackgroundToneProvider: componentWaiver("R1"),
    InfoState: componentWaiver("R2"),
  },
};

// Files allowed to keep their violations, keyed by posix path from the repo root. These are the
// modules a barrel reaches through `export *`, or that `package.json#exports` names, which held
// a named re-export or a proxy before the rule followed them. The list only shrinks: a test fails
// on an entry whose file is gone or no longer has a violation.

const NAMED_REEXPORT =
  "TEMPORARY. Picks names from a file it re-exports, so that file mixes public and private. " +
  "Exit condition: move the private part to an internals location and write `export * from`, " +
  "then delete this entry.";

const WORKSPACE_PROXY =
  "TEMPORARY. Re-exports another workspace package, so this package is a proxy for it. Exit " +
  "condition: consumers import the original provider and declare it, this file goes, then delete " +
  "this entry.";

const THIRD_PARTY_PROXY =
  "TEMPORARY. Re-exports `useTheme` from styled-components, a proxy for a third-party package. " +
  "Exit condition: consumers import it from the provider, or the package owns a hook of its own, " +
  "then delete this entry.";

const INTERNALS_REEXPORT =
  "TEMPORARY. Re-exports from an internals location, which makes private code public. Exit " +
  "condition: move what is public out of internals, then delete this entry.";

/** @type {Record<string, string>} */
const FILE_EXCEPTIONS = {
  "domain/entity/client-identity/src/types.ts": NAMED_REEXPORT,
  "domain/entity/contact/src/cloudSync/module.ts": NAMED_REEXPORT,
  "features/flow/contacts/src/contactsListFacade.native.ts": WORKSPACE_PROXY,
  "features/flow/contacts/src/contactsListFacade.web.ts": WORKSPACE_PROXY,
  "features/flow/contacts/src/contactsViewFacade.native.ts": NAMED_REEXPORT,
  "features/flow/contacts/src/contactsViewFacade.web.ts": NAMED_REEXPORT,
  "features/flow/contacts/src/hooks/contactsHooks.ts": WORKSPACE_PROXY,
  "features/flow/flow-contacts-add-address/src/screens/AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry.types.ts":
    NAMED_REEXPORT,
  "features/flow/flow-contacts-add-address/src/screens/AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry.types.web.ts":
    NAMED_REEXPORT,
  "features/flow/flow-contacts-add-address/src/screens/AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry.web.tsx":
    NAMED_REEXPORT,
  "features/flow/flow-contacts-add-address/src/screens/AddressName/components/Input/ContactsAddAddressNameInput.web.tsx":
    NAMED_REEXPORT,
  "features/flow/flow-contacts-detail/src/native.ts": NAMED_REEXPORT,
  "features/flow/flow-contacts-detail/src/web.ts": NAMED_REEXPORT,
  "features/platform/contacts/src/contactDeviceIntentsPort.ts": NAMED_REEXPORT,
  "features/platform/content-ab-tests/src/store.ts": INTERNALS_REEXPORT,
  "features/platform/style/src/hooks/useTheme.native.ts": THIRD_PARTY_PROXY,
  "features/platform/style/src/hooks/useTheme.web.ts": THIRD_PARTY_PROXY,
  "shared/analytics/src/analyticsEvents.ts": INTERNALS_REEXPORT,
  "shared/feature-flags/src/data/schema.ts": NAMED_REEXPORT,
};

module.exports = { COMPONENT_EXCEPTIONS, FILE_EXCEPTIONS, PACKAGE_EXCEPTIONS };
