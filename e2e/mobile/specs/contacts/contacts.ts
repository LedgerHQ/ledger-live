import {
  SEEDED_CONTACT_NAMES,
  createSeededContactGroups,
  generateContactName,
} from "@ledgerhq/live-e2e-shared/contacts";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import type { LedgerSyncCliCommand } from "@ledgerhq/live-e2e-shared/ledgerSync/setup";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { describeIfNotNanoS } from "@e2e/helpers/commonHelpers";
import {
  LEDGER_SYNC_FEATURE_FLAGS,
  cleanupLedgerSyncAfterAll,
  setupLedgerSyncSeed,
  verifyLedgerSyncEnvironment,
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

// i18n `contacts.addressCount_zero`.
const NO_ADDRESS_LABEL = "0 address";

/** Boots the app already a member of a freshly created trustchain, skipping the activation UI. */
async function initApp(
  options: ApplicationOptions & { seedCommands?: LedgerSyncCliCommand[] } = {},
) {
  await verifyLedgerSyncEnvironment();
  await app.init({
    userdata: options.userdata ?? CONTACTS_USERDATA,
    speculosApp: AppInfos.LS,
    featureFlags: { ...CONTACTS_FEATURE_FLAGS, ...options.featureFlags },
    cliCommands: [
      ...app.ledgerSync.initializeEmptyTrustchain(),
      ...(options.seedCommands ?? []),
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
 * B2CQA-6240. Contacts are pulled from a pre-seeded Ledger Sync document rather than created in
 * the UI, so browse/search starts from a populated list the app must sort alphabetically.
 */
export function runBrowseAndSearchContactsTest(tmsLinks: string[], tags: string[]) {
  describeIfNotNanoS("Contacts", () => {
    setupLedgerSyncSeed();
    cleanupLedgerSyncAfterAll();

    beforeAll(async () => {
      await initApp({
        seedCommands: [app.ledgerSync.pushContactsToTrustchain(createSeededContactGroups())],
      });
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it("Browse and search contacts", async () => {
      const sortedContactNames = SEEDED_CONTACT_NAMES.toSorted((left, right) =>
        left.localeCompare(right),
      );
      const firstContactName = sortedContactNames[0];
      const searchedContactName = sortedContactNames[sortedContactNames.length - 3];

      await app.mainNavigation.openMyWallet();
      await app.myWallet.openContacts();
      await app.contacts.expectSavedContactDisplayed(firstContactName);
      await app.contacts.expectMeContactDisplayed();
      await app.contacts.expectSavedContactsInOrder(sortedContactNames);

      await app.contacts.search(searchedContactName);
      await app.contacts.expectSavedContactDisplayed(searchedContactName);
      await app.contacts.expectSavedContactNotDisplayed(firstContactName);
      await app.contacts.expectMeContactHidden();

      const contactRowId = await app.contacts.getSavedContactRowId(searchedContactName);
      await app.contacts.openSavedContact(contactRowId);
      await app.contacts.detail.expectName(searchedContactName);

      await app.common.goToPreviousPage();
      await app.contacts.expectScreenVisible();
      await app.contacts.clearSearch();
      await app.contacts.expectMeContactDisplayed();
      await app.contacts.expectSavedContactsInOrder(sortedContactNames);
    });
  });
}
