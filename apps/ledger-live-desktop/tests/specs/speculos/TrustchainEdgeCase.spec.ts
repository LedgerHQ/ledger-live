import { test } from "../../fixtures/common";
import { AppInfos } from "tests/enum/AppInfos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import dualAppTest from "tests/fixtures/twoElectronApps";
import { Currency } from "tests/enum/Currency";
import { Account } from "tests/enum/Account";
import { waitForTimeOut } from "tests/utils/waitFor";
import { expect } from "@playwright/test";

const app: AppInfos = AppInfos.LS;

test.describe.parallel(`[${app.name}] Sync Accounts`, () => {
  test.use({
    userdata: "ledgerSync",
    speculosApp: app,
  });

  // First test
  test(
    "Synchronize 1st instance",
    {
      annotation: {
        type: "TMS",
        description: "https://ledgerhq.atlassian.net/browse/LIVE-13830",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));

      await app.layout.goToSettings();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.syncAccounts();
      await app.speculos.confirmOperationOnDevice("Log in to");
      await app.speculos.confirmOperationOnDevice("Enable");
      await app.ledgerSync.expectSynchronizationSuccess();
      await app.ledgerSync.closeLedgerSync();

    },
  );

  // Second test
  test.use({
    userdata: "ledgerSync",
    speculosApp: app,
  });

  test(
    "Sync 2nd instance",
    {
      annotation: {
        type: "TMS",
        description: "https://ledgerhq.atlassian.net/browse/LIVE-13830",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));

      await app.layout.goToSettings();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.syncAccounts();
      await app.speculos.confirmOperationOnDevice("Log in to");
      await app.speculos.confirmOperationOnDevice("Enable");
      await app.ledgerSync.expectSynchronizationSuccess();
      await app.ledgerSync.closeLedgerSync();

    },
  );
});
