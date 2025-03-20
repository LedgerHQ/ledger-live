import { test } from "../../fixtures/common";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";
import { expect, TestInfo } from "@playwright/test";
import { LedgerSyncCliHelper } from "../../utils/ledgerSyncCliUtils";
import { accountNames, accounts } from "tests/testdata/ledgerSyncTestData";

const app: AppInfos = AppInfos.LS;
const accountId = accounts[0].id;
const accountName = accountNames[accountId];

function setupSeed() {
  test.beforeAll(async () => {
    process.env.SEED = "X";
  });
  test.afterAll(async () => {
    process.env.SEED = "X";
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
    userdata: "skip-onboarding",
    speculosApp: app,
    cliCommands: [...initializeThenDeleteTrustchain(), ...initializeTrustchain()],
  });

  test(
    "Synchronize one instance then delete the backup",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2292, B2CQA-2293, B2CQA-2296",
      },
    },
    async ({ app, page }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.layout.goToAccounts();
      await app.accounts.expectAccountsCount(0);

      await app.layout.goToSettings();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.expectSyncAccountsButtonExist();

      await app.ledgerSync.syncAccounts();
      await app.speculos.activateLedgerSync();
      await app.ledgerSync.expectSynchronizationSuccess();
      await app.ledgerSync.closeLedgerSync();

      await app.layout.goToAccounts();
      await app.accounts.expectAccountsCount(2);

      await app.accounts.navigateToAccountByName(accountName);
      await app.account.expectAccountVisibility(accountName);
      await app.account.deleteAccount();
      await app.layout.syncAccounts();

      expect(await LedgerSyncCliHelper.checkSynchronizationSuccess(page, app)).toBeDefined();

      await app.accounts.expectAccountsCount(1);

      const pulledData = await CLI.ledgerSync({
        ...LedgerSyncCliHelper.ledgerKeyRingProtocolArgs,
        ...LedgerSyncCliHelper.ledgerSyncPullDataArgs,
      });

      const parsedData = LedgerSyncCliHelper.parseData(pulledData);

      await app.layout.goToSettings();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.destroyTrustchain();
      await app.ledgerSync.expectBackupDeletion();
      await app.drawer.closeDrawer();

      expect(
        await LedgerSyncCliHelper.checkAccountDeletion(parsedData, accountId),
        "Account should not be present",
      ).toBeUndefined();
    },
  );
});
