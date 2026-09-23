import {
  CONTACT_ADDRESS_DATASET,
  CONTACTS_OS_VERSION_BY_MODEL,
  SEEDED_CONTACT_NAMES,
  createSeededContactGroups,
  generateContactName,
} from "@ledgerhq/live-e2e-shared/contacts";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { getSpeculosModel } from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { LedgerSyncCliHelper } from "@ledgerhq/live-e2e-shared/ledgerSync/helper";
import type { LedgerSyncCliCommand } from "@ledgerhq/live-e2e-shared/ledgerSync/setup";
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
const ADDRESS_CONTACT_NAME = generateContactName();
const NO_ADDRESS_LABEL = "0 address";
const ETHEREUM_ADDRESS_DATASET = CONTACT_ADDRESS_DATASET.filter(
  row => row.networkId === "ethereum",
);

const addressCountLabel = (count: number) => `${count} ${count === 1 ? "address" : "addresses"}`;

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

// No @Stax: its rc builds stop at Ethereum 1.19.3. See CONTACTS_OS_VERSION_BY_MODEL.
const CONTACTS_DEVICE_TAGS = deviceTagsWithoutLNS().filter(tag => tag !== "@Stax");

test.describe("Contacts - with addresses", () => {
  setupSeed();
  test.afterAll(destroyTrustchain);

  const trustchainCommands: LedgerSyncCliCommand[] = [
    ...initializeEmptyTrustchain(),
    LedgerSyncCliHelper.saveTrustchainToUserdata,
  ];

  test.use({
    ...contactsTestOptions(),
    // Address registration goes through the device-intent executor, which only
    // connects when the desktop DMK transport is on.
    featureFlags: {
      ...CONTACTS_FEATURE_FLAGS,
      ldmkTransport: { enabled: true },
    },
    speculosApp: AppInfos.ETHEREUM_CONTACTS,
    cliCommands: [],
    // Playwright reads [value, options] when the second element is an object, so a bare
    // command list is treated as a fixture tuple and the trustchain setup never runs.
    cliCommandsOnApp: [
      trustchainCommands.map(cmd => ({ app: AppInfos.LS, cmd })),
      { scope: "test" },
    ],
  });

  // Rename returns the device to the dashboard and ends this Speculos session.
  // Covered by renameContactIntent unit tests.
  test(
    "Create and delete a contact with an address",
    {
      tag: CONTACTS_DEVICE_TAGS,
      annotation: {
        type: "TMS",
        description: "B2CQA-6239",
      },
    },
    async ({ app }) => {
      test.skip(
        !CONTACTS_OS_VERSION_BY_MODEL[getSpeculosModel()],
        "No contacts Ethereum build for this device",
      );

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.myWallet.openContacts();
      await app.contacts.expectScreenVisible();
      await app.contacts.expectEmptyState();
      await app.contacts.addContact(ADDRESS_CONTACT_NAME);

      const contactId = await app.contacts.getSavedContactId(ADDRESS_CONTACT_NAME);
      await app.contacts.openSavedContact(contactId);
      await app.contacts.detail.expectName(ADDRESS_CONTACT_NAME);
      await app.contacts.detail.expectNoAddresses();

      for (const [index, data] of ETHEREUM_ADDRESS_DATASET.entries()) {
        await app.contacts.detail.openAddAddress();
        await app.modularDialog.selectAssetByTicker(Currency.ETH);
        await app.modularDialog.selectNetwork(Currency.ETH);
        await app.contacts.detail.enterAddress(data);
        await app.speculos.confirmContactAction();
        await app.contacts.detail.expectDeviceIntentFinished();
        await app.contacts.detail.expectAddressSaved(data.savedValue, data.networkId);
        await app.contacts.detail.expectAddressLabel(data.savedValue, data.addressLabel);
        await app.contacts.detail.expectAddressCount(addressCountLabel(index + 1));
      }

      await app.contacts.detail.expectName(ADDRESS_CONTACT_NAME);

      // Deleting an address or the contact does not open a device intent.
      const addressToDelete = ETHEREUM_ADDRESS_DATASET[1];
      await app.contacts.detail.deleteAddress(addressToDelete.savedValue);
      await app.contacts.detail.expectAddressCount(addressCountLabel(1));
      await app.contacts.detail.expectAddressSaved(
        ETHEREUM_ADDRESS_DATASET[0].savedValue,
        ETHEREUM_ADDRESS_DATASET[0].networkId,
      );

      await app.contacts.deleteContact(contactId);
      await app.contacts.expectScreenVisible();
      await app.contacts.expectSavedContactRemoved(contactId);
      await app.contacts.expectEmptyState();
    },
  );
});
