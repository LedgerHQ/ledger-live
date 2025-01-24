import { test } from "../../fixtures/common";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";
import { activateLedgerSync } from "@ledgerhq/live-common/e2e/speculos";
import { waitFor, waitForTimeOut } from "tests/utils/waitFor";
import { expect } from "@playwright/test";
import { DistantState as LiveData } from "@ledgerhq/live-wallet/walletsync/index";

const app: AppInfos = AppInfos.LS;

const accounts = [
  {
    id: "mock:1:dogecoin:0.790010769447963:",
    currencyId: "dogecoin",
    index: 1,
    seedIdentifier: "mock",
    derivationMode: "",
    freshAddress: "1uVnrWAzycYqKUXSuNXt3XSjJ8",
  },
  {
    id: "mock:1:bitcoin_gold:0.8027791663782486:",
    currencyId: "bitcoin_gold",
    index: 1,
    seedIdentifier: "mock",
    derivationMode: "",
    freshAddress: "1Y5T8JQqBKUS7cXbxUYCR4wg3YSbV9R",
  },
];

const accountNames: Record<string, string> = {
  "mock:1:dogecoin:0.790010769447963:": "Renamed Dogecoin 2",
  "mock:1:bitcoin_gold:0.8027791663782486:": "Bitcoin Gold 2",
};

const firstAccountId = accounts[0].id;
const secondAccountId = accounts[1].id;
const firstAccountName = accountNames[firstAccountId];
const secondAccountName = accountNames[secondAccountId];

test.describe(`[${app.name}] Sync Accounts`, () => {
  const ledgerKeyRingProtocolArgs = {
    pubKey: "",
    privateKey: "",
  };

  const ledgerSyncPushDataArgs = {
    rootId: "",
    walletSyncEncryptionKey: "",
    applicationPath: "",
    push: true,
    data: JSON.stringify({
      accounts,
      accountNames,
    }),
  };

  const ledgerSyncPullDataArgs = {
    pubKey: "",
    privateKey: "",
    rootId: "",
    walletSyncEncryptionKey: "",
    applicationPath: "",
    push: false,
    pull: true,
    data: "",
  };

  async function initializeLedgerKeyRingProtocol() {
    return CLI.ledgerKeyRingProtocol({ initMemberCredentials: true }).then(output => {
      if (output && typeof output !== "string" && "pubkey" in output) {
        ledgerKeyRingProtocolArgs.pubKey = output.pubkey;
        ledgerKeyRingProtocolArgs.privateKey = output.privatekey;
        ledgerSyncPullDataArgs.pubKey = output.pubkey;
        ledgerSyncPullDataArgs.privateKey = output.privatekey;
      }
      return output;
    });
  }

  async function initializeLedgerSync() {
    const output = CLI.ledgerKeyRingProtocol({
      getKeyRingTree: true,
      ...ledgerKeyRingProtocolArgs,
    }).then(out => {
      if (out && typeof out !== "string" && "rootId" in out) {
        ledgerSyncPushDataArgs.rootId = out.rootId;
        ledgerSyncPushDataArgs.walletSyncEncryptionKey = out.walletSyncEncryptionKey;
        ledgerSyncPushDataArgs.applicationPath = out.applicationPath;
        ledgerSyncPullDataArgs.rootId = out.rootId;
        ledgerSyncPullDataArgs.walletSyncEncryptionKey = out.walletSyncEncryptionKey;
        ledgerSyncPullDataArgs.applicationPath = out.applicationPath;
      }
      return out;
    });
    await activateLedgerSync();
    return output;
  }

  test.use({
    userdata: "ledgerSync",
    speculosApp: app,
    cliCommands: [
      async () => {
        return initializeLedgerKeyRingProtocol();
      },
      async () => {
        return initializeLedgerSync();
      },
      async () => {
        return CLI.ledgerSync({
          ...ledgerKeyRingProtocolArgs,
          ...ledgerSyncPushDataArgs,
        });
      },
    ],
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

      const firstSuccessfulQuery = new Promise(resolve => {
        page.on("response", response => {
          if (
            response
              .url()
              .startsWith("https://trustchain-backend.api.aws.stg.ldg-tech.com/v1/refresh")
          ) {
            if (response.status() === 200) {
              resolve(response);
            }
          }
        });
      });

      await app.layout.syncAccounts();
      await app.layout.waitForAccountsSyncToBeDone();
      // expect(await firstSuccessfulQuery).toBeDefined();
      console.log("firstSuccessfulQuery", firstSuccessfulQuery);
      await app.accounts.expectAccountAbsence(firstAccountName);

      //await waitForTimeOut(10000);

      await app.accounts.expectAccountsCount(1);

      const pulledData = await CLI.ledgerSync({
        ...ledgerKeyRingProtocolArgs,
        ...ledgerSyncPullDataArgs,
      });

      let parsedData;

      parsedData = typeof pulledData === "string" ? JSON.parse(pulledData) : pulledData;

      await app.layout.goToSettings();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.destroyTrustchain();
      await app.ledgerSync.expectBackupDeletion();
      await app.drawer.closeDrawer();

      const deletedAccount = (parsedData.updateEvent.data as LiveData).accounts?.find(
        account => account.id === firstAccountId,
      );

      if (deletedAccount === undefined) {
        console.log("Assertion passed: Account :", firstAccountName, " is not present.");
      } else {
        console.error("Assertion failed: Account is present.");
      }
      expect(deletedAccount, "Account should not be present").toBeUndefined();

      const remainingAccount = (parsedData.updateEvent.data as LiveData).accounts?.find(
        account => account.id === secondAccountId,
      );

      if (remainingAccount === undefined) {
        console.error("Assertion failed: Account is not present.");
      } else {
        console.log("Assertion passed: Account :", secondAccountName, " is present.");
      }
      expect(remainingAccount, "Account should be present").toBeDefined();
    },
  );
});
