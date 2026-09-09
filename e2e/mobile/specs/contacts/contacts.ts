import { generateContactName } from "@ledgerhq/live-e2e-shared/contacts";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { describeIfNotNanoS } from "@e2e/helpers/commonHelpers";
import {
  LEDGER_SYNC_FEATURE_FLAGS,
  cleanupLedgerSyncAfterAll,
  setupLedgerSyncSeed,
} from "@e2e/helpers/ledgerSyncHelpers";
import { FF_LWM_WALLET_40_Q2 } from "@e2e/utils/featureFlagUtils";

import type { ApplicationOptions } from "@e2e/page/index";
import type { PartialFeatures } from "@shared/feature-flags";

// Pinned: the Contacts entry point lives on My Wallet, which the Q1 preset turns off.
const CONTACTS_FEATURE_FLAGS: PartialFeatures = {
  lwmContacts: {
    enabled: true,
    params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
  },
  // Contacts gates every mutation behind a Ledger Sync status of exactly "ready", which needs both
  // this flag and a hydrated trustchain — see `useContactsLedgerSyncMutationGuard`.
  ...LEDGER_SYNC_FEATURE_FLAGS,
  ...FF_LWM_WALLET_40_Q2,
};

// skip-onboarding with the one-time Contacts introduction already dismissed.
const CONTACTS_USERDATA = "contacts";

const CONTACT_NAME = generateContactName();
const RENAMED_CONTACT_NAME = generateContactName();
const KEYBOARD_CONTACT_NAME = generateContactName();
const KEYBOARD_RENAMED_CONTACT_NAME = generateContactName();
// i18n `contacts.addressCount_zero`.
const NO_ADDRESS_LABEL = "0 address";

/** Boots the app already a member of a freshly created trustchain, skipping the activation UI. */
async function initApp(options: ApplicationOptions = {}) {
  await app.init({
    userdata: options.userdata ?? CONTACTS_USERDATA,
    speculosApp: AppInfos.LS,
    featureFlags: { ...CONTACTS_FEATURE_FLAGS, ...options.featureFlags },
    cliCommands: [
      ...app.ledgerSync.initializeEmptyTrustchain(),
      userdataPath => app.ledgerSync.saveTrustchainToUserdata(userdataPath),
    ],
  });
  await app.mainNavigation.waitForWallet40Ready();
}

/**
 * B2CQA-6238. Speculos is used to create the trustchain the app boots into, not to confirm anything
 * in the test itself: Contacts blocks create/rename/delete until Ledger Sync reports "ready", and
 * pre-seeding is what gets it there without the in-app activation prompt.
 */
export function runCreateRenameDeleteContactTest(tmsLinks: string[], tags: string[]) {
  describeIfNotNanoS("Contacts", () => {
    setupLedgerSyncSeed();
    cleanupLedgerSyncAfterAll();

    beforeAll(async () => {
      await initApp();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it("Create, rename and delete a contact without an address", async () => {
      await app.mainNavigation.openMyWallet();
      await app.myWallet.openContacts();
      await app.contacts.expectMeContactDisplayed();
      await app.contacts.expectMeAddressCount(NO_ADDRESS_LABEL);

      await app.contacts.addContact(CONTACT_NAME);

      await app.contacts.expectSavedContactDisplayed(CONTACT_NAME);
      await app.contacts.expectSavedContactAddressCount(CONTACT_NAME, NO_ADDRESS_LABEL);

      // Resolved before the rename: the row id survives it, the name does not.
      const contactRowId = await app.contacts.getSavedContactRowId(CONTACT_NAME);

      await app.contacts.openSavedContact(contactRowId);
      await app.contacts.detail.expectName(CONTACT_NAME);
      await app.contacts.detail.expectNoAddresses();

      await app.contacts.detail.renameContact(RENAMED_CONTACT_NAME);
      await app.contacts.detail.expectName(RENAMED_CONTACT_NAME);

      await app.common.goToPreviousPage();
      await app.contacts.expectScreenVisible();
      await app.contacts.expectSavedContactRowName(contactRowId, RENAMED_CONTACT_NAME);

      await app.contacts.deleteContact(contactRowId);

      await app.contacts.expectScreenVisible();
      await app.contacts.expectSavedContactRemoved(contactRowId);
      await app.contacts.expectEmptyState();
    });
  });
}

/**
 * The keyboard opens on its own here: both name drawers focus their field as they mount. Every
 * assertion runs with it up, and `typeName*LeavingKeyboardOpen` keeps it there instead of
 * submitting — a name still in the field after typing is the evidence the drawer did not dismiss it.
 *
 * Full visibility is the point: at Detox's default 75% a save button half-under the keyboard still
 * passes.
 */
export function runContactsKeyboardTest(tmsLinks: string[], tags: string[]) {
  describeIfNotNanoS("Contacts keyboard", () => {
    setupLedgerSyncSeed();
    cleanupLedgerSyncAfterAll();

    beforeAll(async () => {
      await initApp();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it("Keeps the name form and its action clear of the keyboard while adding and editing", async () => {
      await app.mainNavigation.openMyWallet();
      await app.myWallet.openContacts();

      await app.contacts.openAddContactDrawer();
      await app.contacts.typeAddContactNameLeavingKeyboardOpen(KEYBOARD_CONTACT_NAME);

      await app.contacts.expectAddContactName(KEYBOARD_CONTACT_NAME);
      await app.contacts.expectAddContactContentFullyVisible();
      await app.contacts.expectAddContactSaveFullyVisible();

      await app.contacts.saveContact();
      await app.contacts.expectSavedContactDisplayed(KEYBOARD_CONTACT_NAME);

      const contactRowId = await app.contacts.getSavedContactRowId(KEYBOARD_CONTACT_NAME);
      await app.contacts.openSavedContact(contactRowId);
      await app.contacts.detail.openActionsMenu();
      await app.contacts.detail.openRenameDrawer();

      const renameDrawer = app.contacts.detail.renameDrawer;
      await renameDrawer.typeNameLeavingKeyboardOpen(KEYBOARD_RENAMED_CONTACT_NAME);

      await renameDrawer.expectName(KEYBOARD_RENAMED_CONTACT_NAME);
      await renameDrawer.expectVisible();
      await renameDrawer.expectConfirmFullyVisible();

      await renameDrawer.confirm();
      await app.contacts.detail.expectName(KEYBOARD_RENAMED_CONTACT_NAME);
    });
  });
}
