import {
  CONTACT_ADDRESS_DATASET,
  CONTACTS_ETHEREUM_APP_VERSION,
  CONTACTS_OS_VERSION_BY_MODEL,
  generateContactName,
} from "@ledgerhq/live-e2e-shared/contacts";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { ledgerSyncEnvironment } from "@ledgerhq/live-e2e-shared/ledgerSync/environment";
import { LedgerSyncCliHelper } from "@ledgerhq/live-e2e-shared/ledgerSync/helper";
import {
  destroyTrustchain,
  generateLedgerSyncSeed,
  initializeEmptyTrustchain,
  type LedgerSyncCliCommand,
} from "@ledgerhq/live-e2e-shared/ledgerSync/setup";
import { getSpeculosModel } from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import type { PartialFeatures } from "@shared/feature-flags";
import test from "tests/fixtures/mockServerDevice";
import { deviceTagsWithoutLNS } from "tests/utils/tagsUtils";

const CONTACT_NAME = generateContactName();
const RENAMED_CONTACT_NAME = generateContactName();
const ETHEREUM_ADDRESS = CONTACT_ADDRESS_DATASET.find(
  row => row.networkId === "ethereum" && !row.isEns,
);

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
  ldmkTransport: { enabled: true },
};

// The contacts rc OS is published on manager provider 4. Provider 1 answers 404, and the
// app then stops on Invalid Provider before Ethereum opens.
const CONTACTS_APP_CATALOG_PROVIDER = 4;

const CONTACTS_DEVICE_TAGS = deviceTagsWithoutLNS().filter(tag => tag !== "@Stax");
const contactsOsVersion = CONTACTS_OS_VERSION_BY_MODEL[getSpeculosModel()];

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

function describeRenameOnMockServer(title: string, body: () => void) {
  if (contactsOsVersion && ETHEREUM_ADDRESS) {
    test.describe(title, body);
    return;
  }

  // No contacts firmware is published for this device model.
  test.describe.skip(`${title} — no contacts OS for this device`, body);
}

describeRenameOnMockServer("Contacts - rename with an address (mock server)", () => {
  setupSeed();
  test.afterAll(destroyTrustchain);

  const trustchainCommands: LedgerSyncCliCommand[] = [
    ...initializeEmptyTrustchain(),
    LedgerSyncCliHelper.saveTrustchainToUserdata,
  ];

  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    settings: { hasDismissedContactsFeatureIntroduction: true },
    featureFlags: CONTACTS_FEATURE_FLAGS,
    cliCommands: [],
    cliCommandsOnApp: [
      trustchainCommands.map(cmd => ({ app: AppInfos.LS, cmd })),
      { scope: "test" },
    ],
    catalogProvider: CONTACTS_APP_CATALOG_PROVIDER,
    mockDeviceParams: {
      firmware_version: contactsOsVersion,
      apps: [{ name: AppInfos.ETHEREUM.name, version: CONTACTS_ETHEREUM_APP_VERSION }],
    },
  });

  test(
    "Register an address and rename the contact on the device",
    {
      tag: CONTACTS_DEVICE_TAGS,
    },
    async ({ app, page, mockServer }) => {
      if (!ETHEREUM_ADDRESS) return;

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.myWallet.openContacts();
      await app.contacts.expectScreenVisible();
      await app.contacts.expectEmptyState();
      await app.contacts.addContact(CONTACT_NAME);

      const contactId = await app.contacts.getSavedContactId(CONTACT_NAME);
      await app.contacts.openSavedContact(contactId);
      await app.contacts.detail.expectName(CONTACT_NAME);
      await app.contacts.detail.expectNoAddresses();

      await app.contacts.detail.openAddAddress();
      await app.modularDialog.selectAssetByTicker(Currency.ETH);
      await app.modularDialog.selectNetwork(Currency.ETH);
      await app.contacts.detail.enterAddress(ETHEREUM_ADDRESS);
      await mockServer.confirmDeviceIntent(page);
      await app.contacts.detail.expectDeviceIntentFinished();
      await app.contacts.detail.expectAddressSaved(
        ETHEREUM_ADDRESS.savedValue,
        ETHEREUM_ADDRESS.networkId,
      );

      await mockServer.mockDashboardRename();
      await app.contacts.renameContact(RENAMED_CONTACT_NAME);
      await mockServer.confirmDeviceIntent(page);
      await app.contacts.detail.expectName(RENAMED_CONTACT_NAME);

      await app.contacts.deleteContact(contactId);
      await app.contacts.expectScreenVisible();
      await app.contacts.expectSavedContactRemoved(contactId);
    },
  );
});
