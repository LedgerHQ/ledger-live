import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";
import { LedgerSyncCliHelper } from "tests/utils/ledgerSyncCliUtils";
import { expectPulledDataToMatchAccountChanges } from "tests/utils/ledgerSyncPulledDataUtils";
import { accountNames, accounts } from "tests/testdata/ledgerSyncTestData";
import { getEnv, setEnv } from "@ledgerhq/live-env";

const app: AppInfos = AppInfos.LS;
const firstAccountId = accounts[0].id;
const firstAccountName = accountNames[firstAccountId];
const secondAccountId = accounts[1].id;
const secondAccountName = accountNames[secondAccountId];
const renamedSecondAccountName = `${secondAccountName}_renamed`;

function setupSeed() {
  const prevSeed = getEnv("SEED");
  test.beforeAll(async () => {
    process.env.SEED = "Temporary_SEED";
  });
  test.afterAll(async () => {
    setEnv("SEED", prevSeed);
  });
}

function initializeThenDeleteTrustchain() {
  return [
    LedgerSyncCliHelper.initializeLedgerKeyRingProtocol,
    LedgerSyncCliHelper.initializeLedgerSync,
    async () => LedgerSyncCliHelper.deleteLedgerSyncData(),
  ];
}

function initializeTrustchain() {
  return [
    LedgerSyncCliHelper.initializeLedgerKeyRingProtocol,
    LedgerSyncCliHelper.initializeLedgerSync,
    async () =>
      CLI.ledgerSync({
        ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
        ...LedgerSyncCliHelper.ledgerSyncPushDataArgs,
      }),
  ];
}
test.describe(`[${app.name}] Sync Accounts`, () => {
  setupSeed();
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: app,
    cliCommands: [...initializeThenDeleteTrustchain(), ...initializeTrustchain()],
    featureFlags: {
      lldWalletSync: {
        enabled: true,
        params: {
          environment: "STAGING",
          watchConfig: {
            pollingInterval: 2_000,
            initialTimeout: 500,
          },
          learnMoreLink: "",
        },
      },
      lldLedgerSyncEntryPoints: { enabled: true },
    },
  });

  test(
    "Sync instances, rename and delete accounts, delete instance then delete the backup",
    {
      tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2303, B2CQA-2302, B2CQA-2300, B2CQA-2297, B2CQA-2296",
      },
    },
    async ({ app, page }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.portfolio.checkAddAccountButtonVisibility();

      await app.mainNavigation.openSettings();
      await app.settings.enableWalletSync();
      await app.ledgerSync.expectSyncAccountsButtonExist();

      await app.ledgerSync.syncAccounts();
      await app.speculos.activateLedgerSync();
      await app.ledgerSync.expectSynchronizationSuccess();
      await app.ledgerSync.closeLedgerSync();

      // Success copy can appear before the watch loop finishes importing every descriptor (retries use backoff).
      await app.accounts.expectReduxAccountsLength(2);
      await app.accounts.expectReduxAccountIds([firstAccountId, secondAccountId]);

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.expectAccountsCount(2, 60_000);
      await app.accounts.expectCryptoAccountRowVisible(firstAccountName);
      await app.accounts.expectCryptoAccountRowVisible(secondAccountName);

      await app.accounts.navigateToAccountByName(firstAccountName);
      await app.account.expectAccountVisibility(firstAccountName);
      await app.account.deleteAccount();
      await app.accounts.expectReduxAccountIds([secondAccountId]);
      await app.accounts.expectAccountAbsence(firstAccountName);

      await app.accounts.navigateToAccountByName(secondAccountName);
      await app.account.expectAccountVisibility(secondAccountName);
      await app.account.renameAccount(renamedSecondAccountName);
      await app.account.expectAccountVisibility(renamedSecondAccountName);

      const cloudSyncResponse = LedgerSyncCliHelper.getCloudSyncResponse(page);
      await app.layout.syncAccountsIfAvailable();
      await LedgerSyncCliHelper.checkSynchronizationSuccess(cloudSyncResponse, app);

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.expectReduxAccountsLength(1);
      await app.accounts.expectReduxAccountIds([secondAccountId]);
      await app.accounts.expectAccountsCount(1, 60_000);
      await app.accounts.expectCryptoAccountRowVisible(renamedSecondAccountName);
      await app.accounts.expectAccountAbsence(firstAccountName);

      const pulledData = await CLI.ledgerSync({
        ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
        ...LedgerSyncCliHelper.ledgerSyncPullDataArgs,
      });

      expectPulledDataToMatchAccountChanges(pulledData, {
        deletedAccountId: firstAccountId,
        remainingAccountId: secondAccountId,
        expectedRemainingAccountName: renamedSecondAccountName,
      });

      await app.mainNavigation.openSettings();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.manageInstances();
      await app.ledgerSync.expectCLIMemberVisible();
      await app.ledgerSync.removeCLIMember();
      await app.speculos.removeMemberFromLedgerSync();
      await app.ledgerSync.expectMemberRemoval();
      await app.ledgerSync.expectCLIMemberRemoved();
      await app.drawer.closeDrawer();

      await app.mainNavigation.openSettings();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.manageInstances();
      await app.ledgerSync.expectCLIMemberRemoved();
      await app.drawer.closeDrawer();
      await app.ledgerSync.expectLedgerSyncManagementVisible();

      await app.ledgerSync.destroyTrustchain();
      await app.ledgerSync.expectBackupDeletion();
      await app.drawer.closeDrawer();
      await app.settings.expectLedgerSyncSettingsEntryPoint();
    },
  );
});
