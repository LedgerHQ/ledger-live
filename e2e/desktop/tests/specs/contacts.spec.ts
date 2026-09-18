import {
  SEEDED_CONTACT_NAMES,
  createSeededContactGroups,
  generateContactName,
} from "@ledgerhq/live-e2e-shared/contacts";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { LedgerSyncCliHelper } from "@ledgerhq/live-e2e-shared/ledgerSync/helper";
import { ledgerSyncEnvironment } from "@ledgerhq/live-e2e-shared/ledgerSync/environment";
import {
  destroyTrustchain,
  generateLedgerSyncSeed,
  initializeEmptyTrustchain,
  pushContactsToTrustchain,
} from "@ledgerhq/live-e2e-shared/ledgerSync/setup";
import { type CliCommand, test } from "tests/fixtures/common";
import { deviceTagsWithoutLNS } from "tests/utils/tagsUtils";

import type { PartialFeatures } from "@shared/feature-flags";

const CONTACT_NAME = generateContactName();
const RENAMED_CONTACT_NAME = generateContactName();
const NO_ADDRESS_LABEL = "0 address";

const CONTACTS_FEATURE_FLAGS: PartialFeatures = {
  lwdContacts: {
    enabled: true,
    params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
  },
  lldWalletSync: {
    enabled: true,
    params: {
      environment: ledgerSyncEnvironment,
      watchConfig: {
        pollingInterval: 2_000,
        initialTimeout: 500,
      },
      learnMoreLink: "",
    },
  },
  lldLedgerSyncEntryPoints: { enabled: true },
};

function setupSeed() {
  let previousSeed: string | undefined;
  test.beforeAll(async () => {
    previousSeed = process.env.SEED;
    process.env.SEED = generateLedgerSyncSeed();
  });
  test.afterAll(async () => {
    if (previousSeed === undefined) delete process.env.SEED;
    else process.env.SEED = previousSeed;
  });
}

function contactsTestOptions(seedCommands: CliCommand[] = []) {
  return {
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: AppInfos.LS,
    settings: { hasDismissedContactsFeatureIntroduction: true },
    cliCommands: [
      ...initializeEmptyTrustchain(),
      ...seedCommands,
      LedgerSyncCliHelper.saveTrustchainToUserdata,
    ],
    featureFlags: CONTACTS_FEATURE_FLAGS,
  };
}

test.describe("Contacts", () => {
  setupSeed();
  test.afterAll(destroyTrustchain);

  test.use(contactsTestOptions());

  test(
    "Create, rename and delete a contact without an address",
    {
      tag: deviceTagsWithoutLNS(),
      annotation: {
        type: "TMS",
        description: "B2CQA-6238",
      },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.myWallet.openContacts();
      await app.contacts.expectScreenVisible();
      await app.contacts.expectMeContactDisplayed();
      await app.contacts.expectMeAddressCount(NO_ADDRESS_LABEL);
      await app.contacts.expectEmptyState();

      await app.contacts.addContact(CONTACT_NAME);

      await app.contacts.expectSavedContactDisplayed(CONTACT_NAME);
      await app.contacts.expectSavedContactAddressCount(CONTACT_NAME, NO_ADDRESS_LABEL);

      const contactId = await app.contacts.getSavedContactId(CONTACT_NAME);

      await app.contacts.openSavedContact(contactId);
      await app.contacts.detail.expectName(CONTACT_NAME);
      await app.contacts.detail.expectNoAddresses();

      await app.contacts.renameContact(RENAMED_CONTACT_NAME);
      await app.contacts.detail.expectName(RENAMED_CONTACT_NAME);

      await app.contacts.expectScreenVisible();
      await app.contacts.expectSavedContactRowName(contactId, RENAMED_CONTACT_NAME);

      await app.contacts.deleteContact(contactId);

      await app.contacts.expectScreenVisible();
      await app.contacts.expectSavedContactRemoved(contactId);
      await app.contacts.expectEmptyState();
    },
  );
});

test.describe("Contacts - browse and search", () => {
  setupSeed();
  test.afterAll(destroyTrustchain);

  test.use(contactsTestOptions([pushContactsToTrustchain(createSeededContactGroups())]));

  test(
    "Browse and search contacts",
    {
      tag: deviceTagsWithoutLNS(),
      annotation: {
        type: "TMS",
        description: "B2CQA-6240",
      },
    },
    async ({ app }) => {
      const sortedContactNames = SEEDED_CONTACT_NAMES.toSorted((left, right) =>
        left.localeCompare(right),
      );
      const searchedContactName = sortedContactNames[sortedContactNames.length - 3];

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.myWallet.openContacts();
      await app.contacts.expectScreenVisible();
      await app.contacts.expectMeContactDisplayed();
      await app.contacts.expectSavedContactsInOrder(sortedContactNames);

      await app.contacts.search(searchedContactName);
      await app.contacts.expectSavedContactsInOrder([searchedContactName]);
      await app.contacts.expectMeContactHidden();

      const contactId = await app.contacts.getSavedContactId(searchedContactName);
      await app.contacts.openSavedContact(contactId);
      await app.contacts.detail.expectName(searchedContactName);

      await app.contacts.clearSearch();
      await app.contacts.expectMeContactDisplayed();
      await app.contacts.expectSavedContactsInOrder(sortedContactNames);
    },
  );
});
