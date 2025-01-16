import { test } from "../../fixtures/common";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { commandCLI } from "tests/utils/cliUtils";

const app: AppInfos = AppInfos.LS;
const accountName = "Renamed Dogecoin 2";

test.describe(`[${app.name}] Sync Accounts`, () => {
  const ledgerKeyRingProtocolArgs = {
    getKeyRingTree: true,
    pubKey: undefined,
    privateKey: undefined,
  };
  const ledgerSyncPushDataArgs = {
    pubKey: undefined,
    privateKey: undefined,
    rootId: undefined,
    walletSyncEncryptionKey: undefined,
    applicationPath: undefined,
    push: true,
    data: '{"accounts":[{"id":"mock:1:dogecoin:0.790010769447963:","currencyId":"dogecoin","index":1,"seedIdentifier":"mock","derivationMode":"","freshAddress":"1uVnrWAzycYqKUXSuNXt3XSjJ8"},{"id":"mock:1:bitcoin_gold:0.8027791663782486:","currencyId":"bitcoin_gold","index":1,"seedIdentifier":"mock","derivationMode":"","freshAddress":"1Y5T8JQqBKUS7cXbxUYCR4wg3YSbV9R"}],"accountNames":{"mock:1:dogecoin:0.790010769447963:":"Renamed Dogecoin 2","mock:1:bitcoin_gold:0.8027791663782486:":"Bitcoin Gold 2"}}',
  };

  const ledgerSyncPullDataArgs = {
    pubKey: undefined,
    privateKey: undefined,
    rootId: undefined,
    walletSyncEncryptionKey: undefined,
    applicationPath: undefined,
    push: false,
    pull: true,
    data: "",
  };

  test.use({
    userdata: "skip-onboarding",
    speculosApp: app,
    cliCommands: [
      {
        command: commandCLI.ledgerKeyRingProtocol,
        args: {
          initMemberCredentials: true,
        },
        output: output => {
          ledgerKeyRingProtocolArgs.pubKey = output.pubkey;
          ledgerKeyRingProtocolArgs.privateKey = output.privatekey;

          ledgerSyncPushDataArgs.pubKey = output.pubkey;
          ledgerSyncPushDataArgs.privateKey = output.privatekey;

          ledgerSyncPullDataArgs.pubKey = output.pubkey;
          ledgerSyncPullDataArgs.privateKey = output.privatekey;
        },
      },
      {
        command: commandCLI.ledgerKeyRingProtocol,
        args: ledgerKeyRingProtocolArgs,
        output: output => {
          ledgerSyncPushDataArgs.rootId = output.rootId;
          ledgerSyncPushDataArgs.walletSyncEncryptionKey = output.walletSyncEncryptionKey;
          ledgerSyncPushDataArgs.applicationPath = output.applicationPath;
          ledgerSyncPullDataArgs.rootId = output.rootId;
          ledgerSyncPullDataArgs.walletSyncEncryptionKey = output.walletSyncEncryptionKey;
          ledgerSyncPullDataArgs.applicationPath = output.applicationPath;
        },
      },
      {
        command: commandCLI.ledgerSync,
        args: ledgerSyncPushDataArgs,
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
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));

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
      await app.layout.waitForAccountsSyncToBeDone();
      await app.accounts.expectAccountsCount(1);
      await app.accounts.expectAccountAbsence(accountName);

      try {
        const pullPromise = commandCLI.ledgerSync(ledgerSyncPullDataArgs);
        const pullOutput = await Promise.race([
          pullPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("CLI sync command timed out")), 5000),
          ),
        ]);

        if (!pullOutput) {
          throw new Error("No output received from CLI sync command");
        }

        let parsedData;
        try {
          parsedData = typeof pullOutput === "string" ? JSON.parse(pullOutput) : pullOutput;
        } catch (parseError) {
          throw parseError;
        }

        const accountExists = Object.values(accountName).includes(accountName);
        if (accountExists) {
          throw new Error(`Account "${accountName}" still exists in CLI response`);
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
      }

      await app.layout.goToSettings();
      await app.settings.openManageLedgerSync();
      await app.ledgerSync.destroyTrustchain();
      await app.ledgerSync.expectBackupDeletion();
      await app.drawer.close();
    },
  );
});
