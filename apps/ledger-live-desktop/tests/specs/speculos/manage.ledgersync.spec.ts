import { test } from "../../fixtures/common";
import { AppInfos } from "tests/enum/AppInfos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import dualAppTest from "tests/fixtures/twoElectronApps";
import { Currency } from "tests/enum/Currency";
import { Account } from "tests/enum/Account";

const app: AppInfos = AppInfos.LS;

test.describe(`[${app.name}] Sync Accounts`, () => {
  test.use({
    userdata: "ledgerSync",
    speculosApp: app,
  });

  test(
    "Synchronize one instance then delete the backup",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2292, B2CQA-2293, B2CQA-2296",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));

      await app.layout.goToSettings();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.expectSyncAccountsButtonExist();

      await app.ledgerSync.syncAccounts();
      await app.speculos.confirmOperationOnDevice("Log in to");
      await app.speculos.confirmOperationOnDevice("Enable");
      await app.ledgerSync.expectSynchronizationSuccess();
      await app.ledgerSync.closeLedgerSync();

      await app.settings.openManageLedgerSync();
      //await app.ledgerSync.expectNbSyncedInstances(1);  //TODO: Reactivate when the issue is fixed - QAA-178
      await app.ledgerSync.destroyTrustchain();
      await app.ledgerSync.expectBackupDeletion();
      await app.drawer.close();
    },
  );
});

dualAppTest.describe(`[${app.name}] Test with Two Electron Apps`, () => {
  dualAppTest.use({
    userdata: "ledgerSync",
    speculosApp: app,
    userdata2: "speculos-tests-app",
    speculosApp2: Currency.BTC.speculosApp,
  });

  dualAppTest("Test case with two Electron apps", async ({ app, app2 }) => {
    // Interact with the first app
    await app.layout.goToSettings();
    await app.settings.openManageLedgerSync();
    await app.ledgerSync.syncAccounts();

    // Interact with the second app
    await app2.layout.goToAccounts();
    await app2.accounts.navigateToAccountByName(Account.sep_ETH_1.accountName);

    // Additional test logic
  });
});
