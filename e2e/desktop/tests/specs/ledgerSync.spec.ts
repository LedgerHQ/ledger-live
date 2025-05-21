import { test } from "../fixtures/common";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { addTmsLink } from "../utils/allureUtils";
import { getDescription } from "../utils/customJsonReporter";
import { CLI } from "../utils/cliUtils";
import { expect } from "@playwright/test";
import { LedgerSyncCliHelper } from "../utils/ledgerSyncCliUtils";
import { accountNames, accounts } from "../testdata/ledgerSyncTestData";
import { getEnv, setEnv } from "@ledgerhq/live-env";

const app: AppInfos = AppInfos.LS;
const firstAccountId = accounts[0].id;
const firstAccountName = accountNames[firstAccountId];
const secondAccountId = accounts[1].id;
const secondAccountName = accountNames[secondAccountId];

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

      await app.accounts.navigateToAccountByName(firstAccountName);
      await app.account.expectAccountVisibility(firstAccountName);
      await app.account.deleteAccount();
      await app.accounts.navigateToAccountByName(secondAccountName);
      await app.account.expectAccountVisibility(secondAccountName);
      await app.account.renameAccount(secondAccountName + "_renamed");
      await app.layout.syncAccounts();

      expect(await LedgerSyncCliHelper.checkSynchronizationSuccess(page, app)).toBeDefined();

      await app.layout.goToAccounts();
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
        await LedgerSyncCliHelper.checkAccountDeletion(parsedData, firstAccountId),
        "Account should not be present",
      ).toBeUndefined();
      expect(
        LedgerSyncCliHelper.isAccountRenamedCorrectly(
          parsedData,
          secondAccountId,
          secondAccountName + "_renamed",
        ),
        "Account should be renamed correctly",
      ).toBeDefined();
    },
  );
});
