import {
  CONTACT_ADDRESS_DATASET,
  CONTACTS_ETHEREUM_APP_VERSION,
  CONTACTS_OS_VERSION_BY_MODEL,
  SEEDED_CONTACT_NAMES,
  createSeededContactGroups,
  generateContactName,
} from "@ledgerhq/live-e2e-shared/contacts";
import { deviceUnderTest } from "@ledgerhq/live-e2e-shared/mockServer/devices";
import { withInstallHashes } from "@ledgerhq/live-e2e-shared/mockServer/installedApps";
import {
  disposeMockServerSession,
  provisionMockServerSession,
} from "@ledgerhq/live-e2e-shared/mockServer/session";
import { getSpeculosModel } from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import type { LedgerSyncCliCommand } from "@ledgerhq/live-e2e-shared/ledgerSync/setup";
import { device } from "detox";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { describeIfNotNanoS, launchApp } from "@e2e/helpers/commonHelpers";
import { MockServerDevicePage } from "@e2e/page/mockServerDevice.page";
import { deleteSpeculos } from "@e2e/utils/speculosUtils";
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

// i18n `contacts.addressCount_one` / `contacts.addressCount_other`.
const addressCountLabel = (count: number) => `${count} ${count === 1 ? "address" : "addresses"}`;

const describeIfContactsDeviceSupported = (...args: Parameters<typeof describe>) =>
  CONTACTS_OS_VERSION_BY_MODEL[getSpeculosModel()]
    ? describe(...args)
    : describe.skip("[no contacts Ethereum build for this device] " + args[0], args[1]);

/** Boots the app already a member of a freshly created trustchain, skipping the activation UI. */
async function initApp(
  options: ApplicationOptions & { seedCommands?: LedgerSyncCliCommand[] } = {},
) {
  const { seedCommands, ...appOptions } = options;

  await verifyLedgerSyncEnvironment();
  await app.init({
    ...appOptions,
    userdata: appOptions.userdata ?? CONTACTS_USERDATA,
    speculosApp: appOptions.speculosApp ?? AppInfos.LS,
    featureFlags: { ...CONTACTS_FEATURE_FLAGS, ...appOptions.featureFlags },
    cliCommands: appOptions.cliCommands ?? [
      ...app.ledgerSync.initializeEmptyTrustchain(),
      ...(seedCommands ?? []),
      userdataPath => app.ledgerSync.saveTrustchainToUserdata(userdataPath),
    ],
  });
  await app.mainNavigation.waitForWallet40Ready();
}

async function initAppWithContactDevice() {
  const trustchainCommands = [
    ...app.ledgerSync.initializeEmptyTrustchain(),
    (userdataPath?: string) => app.ledgerSync.saveTrustchainToUserdata(userdataPath),
  ];

  await initApp({
    speculosApp: AppInfos.ETHEREUM_CONTACTS,
    cliCommands: [],
    cliCommandsOnApp: trustchainCommands.map(cmd => ({ app: AppInfos.LS, cmd })),
  });
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

// On-device rename leaves the Ethereum app for the dashboard, which ends a Speculos session.
const CONTACTS_APP_CATALOG_PROVIDER = 4;
const REGISTER_DEVICE_PROMPT_ID = "contacts-register-external-address-continue-on-device";
const RENAME_DEVICE_PROMPT_ID = "contacts-rename-contact-continue-on-device";

export function runRenameContactOnDeviceTest(tmsLinks: string[], tags: string[]) {
  describeIfContactsDeviceSupported("Contacts - rename with an address (mock server)", () => {
    setupLedgerSyncSeed();
    cleanupLedgerSyncAfterAll();

    let mockServer: MockServerDevicePage | undefined;
    let session: { baseUrl: string; token: string } | undefined;

    beforeAll(async () => {
      const ethereumAddress = CONTACT_ADDRESS_DATASET.find(
        row => row.networkId === "ethereum" && !row.isEns,
      );
      const contactsOsVersion = CONTACTS_OS_VERSION_BY_MODEL[getSpeculosModel()];
      if (!contactsOsVersion || !ethereumAddress) {
        throw new Error("contacts rename mock server spec ran without a supported device");
      }

      const deviceConfig = deviceUnderTest();
      const apps = (
        await withInstallHashes(
          deviceConfig.modelId,
          [{ name: AppInfos.ETHEREUM.name, version: CONTACTS_ETHEREUM_APP_VERSION }],
          { firmware: contactsOsVersion, provider: CONTACTS_APP_CATALOG_PROVIDER },
        )
      ).map(appVersion => {
        if (!appVersion.version) throw new Error(`App "${appVersion.name}" has no version`);
        return { name: appVersion.name, version: appVersion.version, hash: appVersion.hash };
      });
      const { modelId, ...config } = {
        ...deviceConfig,
        firmware_version: contactsOsVersion,
        apps,
      };
      session = await provisionMockServerSession([config]);
      mockServer = new MockServerDevicePage(session.baseUrl, session.token);

      const port = await launchApp({
        newInstance: true,
        launchArgs: {
          mockServerToken: session.token,
          mockServerModel: modelId,
          forceProvider: String(CONTACTS_APP_CATALOG_PROVIDER),
          ...(process.env.MOCK_SERVER_TRANSPORT_URL
            ? { mockServerUrl: process.env.MOCK_SERVER_TRANSPORT_URL }
            : {}),
        },
      });
      await device.reverseTcpPort(port);
      await verifyLedgerSyncEnvironment();

      const trustchainCommands = [
        ...app.ledgerSync.initializeEmptyTrustchain(),
        (userdataPath?: string) => app.ledgerSync.saveTrustchainToUserdata(userdataPath),
      ];
      await app.init({
        userdata: CONTACTS_USERDATA,
        featureFlags: CONTACTS_FEATURE_FLAGS,
        cliCommands: [],
        cliCommandsOnApp: trustchainCommands.map(cmd => ({ app: AppInfos.LS, cmd })),
      });
      await deleteSpeculos();
      await app.mainNavigation.waitForWallet40Ready();
    });

    afterAll(async () => {
      if (!session) return;
      try {
        await disposeMockServerSession(session.baseUrl, session.token);
      } catch {
        // The session expires on its own. A failed dispose must not hide the spec result.
      }
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it("Register an address and rename the contact on the device", async () => {
      const ethereumAddress = CONTACT_ADDRESS_DATASET.find(
        row => row.networkId === "ethereum" && !row.isEns,
      );
      if (!ethereumAddress || !mockServer) {
        throw new Error("contacts rename mock server spec ran without a session");
      }

      await app.mainNavigation.openMyWallet();
      await app.myWallet.openContacts();
      await app.contacts.addContact(CONTACT_NAME);
      await app.contacts.expectSavedContactDisplayed(CONTACT_NAME);

      const contactRowId = await app.contacts.getSavedContactRowId(CONTACT_NAME);
      await app.contacts.openSavedContact(contactRowId);
      await app.contacts.detail.expectName(CONTACT_NAME);
      await app.contacts.detail.expectNoAddresses();

      await app.contacts.detail.addAddress(ethereumAddress);
      await mockServer.confirmDeviceIntent(REGISTER_DEVICE_PROMPT_ID);
      await app.contacts.detail.expectAddressSaved(
        ethereumAddress.savedValue,
        ethereumAddress.networkId,
      );

      await mockServer.mockDashboardRename();
      await app.contacts.detail.renameContact(RENAMED_CONTACT_NAME);
      await mockServer.confirmDeviceIntent(RENAME_DEVICE_PROMPT_ID);
      await app.contacts.detail.expectName(RENAMED_CONTACT_NAME);

      await app.common.goToPreviousPage();
      await app.contacts.expectScreenVisible();
      await app.contacts.deleteContact(contactRowId);
      await app.contacts.expectScreenVisible();
      await app.contacts.expectSavedContactRemoved(contactRowId);
      await app.contacts.expectEmptyState();
    });
  });
}

export function runCreateDeleteContactWithAddressesTest(tmsLinks: string[], tags: string[]) {
  describeIfContactsDeviceSupported("Contacts", () => {
    setupLedgerSyncSeed();
    cleanupLedgerSyncAfterAll();

    beforeAll(async () => {
      await initAppWithContactDevice();
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));

    it("Create and delete a contact with addresses", async () => {
      await app.mainNavigation.openMyWallet();
      await app.myWallet.openContacts();
      await app.contacts.addContact(CONTACT_NAME);
      await app.contacts.expectSavedContactDisplayed(CONTACT_NAME);

      const contactRowId = await app.contacts.getSavedContactRowId(CONTACT_NAME);
      await app.contacts.openSavedContact(contactRowId);

      for (const [index, addressData] of CONTACT_ADDRESS_DATASET.entries()) {
        await app.contacts.detail.addAddress(addressData);
        await app.speculos.confirmContactAction();
        await app.contacts.detail.expectAddressSaved(addressData.savedValue, addressData.networkId);
        await app.contacts.detail.expectAddressLabel(
          addressData.savedValue,
          addressData.addressLabel,
        );
        await app.contacts.detail.expectAddressCount(addressCountLabel(index + 1));
      }

      const remainingAddressCount = addressCountLabel(CONTACT_ADDRESS_DATASET.length - 1);
      const [addressToDelete] = CONTACT_ADDRESS_DATASET;
      await app.contacts.detail.deleteAddress(addressToDelete.savedValue);
      await app.contacts.detail.expectAddressCount(remainingAddressCount);

      await app.common.goToPreviousPage();
      await app.contacts.expectScreenVisible();
      await app.contacts.expectSavedContactRowName(contactRowId, CONTACT_NAME);
      await app.contacts.expectSavedContactAddressCount(CONTACT_NAME, remainingAddressCount);

      await app.contacts.deleteContact(contactRowId);
      await app.contacts.expectScreenVisible();
      await app.contacts.expectSavedContactRemoved(contactRowId);
      await app.contacts.expectEmptyState();
    });
  });
}
