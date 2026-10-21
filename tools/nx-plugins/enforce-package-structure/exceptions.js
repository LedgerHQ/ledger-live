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

const OWNING_TEAM_DEFERRAL =
  "TEMPORARY. Conformant barrels were prepared and verified for this package, then reverted so the " +
  "owning team can land the change on its own schedule. Exit condition: the team converts its " +
  '`index.*` files to `export * from "./x"`, moving anything private to an internals location, ' +
  "then deletes this entry. Nothing here is blocked — only deferred.";

/** @type {Record<string, { skip?: boolean, allowNonRelative?: boolean, reason: string }>} */
const PACKAGE_EXCEPTIONS = {
  // @ledgerhq/engagement
  "features/flow/analytics-consent": { skip: true, reason: OWNING_TEAM_DEFERRAL },
  "features/flow/large-screen-upsell": { skip: true, reason: OWNING_TEAM_DEFERRAL },
  "features/flow/lazy-onboarding-banner": { skip: true, reason: OWNING_TEAM_DEFERRAL },

  // @ledgerhq/ptx
  "features/flow/pay-card-auth": { skip: true, reason: OWNING_TEAM_DEFERRAL },

  "shared/env": {
    skip: true,
    reason:
      "TEMPORARY. Typed facade over the legacy @ledgerhq/live-env, holding the repo's only " +
      "BOUNDARY_EXCEPTION (tools/nx-plugins/enforce-boundaries/constraints.js) — it is the single " +
      "legal path to that lib for new-architecture consumers, and its barrel currently carries the " +
      "wrapping itself. Exit condition: move the facade out of src/index.ts into a named file " +
      '(src/env.ts) and leave `export * from "./env"` behind, then delete this entry. That was ' +
      "measured to work with no consumer impact; it is deferred, not blocked.",
  },
};

// Public components allowed to break R1 or R5, keyed by project root, then by component name or,
// for a check on the entry itself, by subpath. `skip` above does not reach these rules.
//
// Each package that adopts the convention deletes its entries in the same change, so this list is
// the remaining debt. A waiver that no longer matches a violation fails the check.

const COMPONENT_REASONS = {
  R1:
    "It is exported from a universal entry on one platform only, or under another name on each. " +
    "Exit condition: export it on both platforms under the same name, or move it to a platform " +
    "entry, make it internal or move it to the app that renders it, then delete this entry.",
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
 * @param {...("R1" | "R5")} rules
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
  "features/flow/flow-contacts-add-address": {
    "./native": entryWaiver(),
    ContactsAddAddressEntry: componentWaiver("R5"),
    ContactsAddAddressFlowContent: componentWaiver("R5"),
    ContactsAddAddressName: componentWaiver("R5"),
    ContactsAddAddressNameInput: componentWaiver("R1"),
    ContactsAddAddressReview: componentWaiver("R5"),
  },
  "features/flow/flow-contacts-add-contact": {
    "./native": entryWaiver(),
    ContactsAddContactContent: componentWaiver("R5"),
    ContactsAddContactDialog: componentWaiver("R1"),
    ContactsAddContactFooter: componentWaiver("R1", "R5"),
  },
  "features/flow/flow-contacts-detail": {
    "./native": entryWaiver(),
    ContactAddressDetailDialog: componentWaiver("R5"),
    ContactDetailActions: componentWaiver("R1"),
    ContactDetailActionsMenu: componentWaiver("R1", "R5"),
    ContactDetailView: componentWaiver("R5"),
    ContactsEditSignerMismatchDialog: componentWaiver("R5"),
  },
  "features/flow/flow-contacts-edit-contact": {
    "./native": entryWaiver(),
    ContactsRenameContactDialog: componentWaiver("R1"),
    ContactsRenameContactDrawer: componentWaiver("R1", "R5"),
    ContactsRenameContactFooter: componentWaiver("R1", "R5"),
  },
  "features/flow/flow-contacts-introduction": {
    "./native": entryWaiver(),
    ContactsFeatureIntroductionContent: componentWaiver("R1", "R5"),
    ContactsFeatureIntroductionDialog: componentWaiver("R1"),
    ContactsLedgerSyncIntroductionContent: componentWaiver("R1", "R5"),
    ContactsLedgerSyncIntroductionDialog: componentWaiver("R1"),
  },
  "features/flow/flow-contacts-list": {
    "./native": entryWaiver(),
    ContactsAddContactHeaderButton: componentWaiver("R1", "R5"),
    ContactsCompactList: componentWaiver("R5"),
    ContactsCompactRow: componentWaiver("R1", "R5"),
    ContactsListView: componentWaiver("R5"),
    ContactsSearchNoResults: componentWaiver("R1", "R5"),
  },
  "features/flow/lazy-onboarding-banner": {
    LazyOnboardingBannerView: componentWaiver("R1"),
  },
  "features/flow/pay-card-assets": {
    CardAssetDetailsDrawer: componentWaiver("R1"),
    CardAssetDetailsWithdrawDrawer: componentWaiver("R1"),
    CardAssetsManageDrawer: componentWaiver("R1"),
    CardAssetsManageFooter: componentWaiver("R1"),
    CardAssetsView: componentWaiver("R1"),
    CardAssetTransactionDetailDrawer: componentWaiver("R1"),
  },
  "features/flow/pay-card-details": {
    CardPrimaryActionButton: componentWaiver("R1"),
    CardTopUpButton: componentWaiver("R1"),
  },
  "features/platform/app-lock": {
    PasswordDraftProvider: componentWaiver("R1"),
    PasswordField: componentWaiver("R1"),
  },
  "features/platform/contacts": {
    "./native": entryWaiver(),
    "./web": entryWaiver(),
    ContactAvatar: componentWaiver("R5"),
    ContactConfirmationBottomSheet: componentWaiver("R1", "R5"),
    ContactConfirmationDialog: componentWaiver("R1"),
    ContactNameDisclaimer: componentWaiver("R1", "R5"),
    ContactNameInput: componentWaiver("R5"),
  },
  "shared/analytics-react": {
    TrackPage: componentWaiver("R1"),
    TrackScreen: componentWaiver("R1"),
  },
  "shared/ui-info-state": {
    DialogBackgroundGradient: componentWaiver("R1"),
    DialogBackgroundToneProvider: componentWaiver("R1"),
  },
  "shared/ui-queued-bottom-sheet": {
    QueuedBottomSheet: componentWaiver("R1"),
  },
};

module.exports = { COMPONENT_EXCEPTIONS, PACKAGE_EXCEPTIONS };
