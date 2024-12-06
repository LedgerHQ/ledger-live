import { test } from "../../fixtures/common";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { commandCLI } from "tests/utils/cliUtils";

const app: AppInfos = AppInfos.LS;

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
        },
      },
      {
        command: commandCLI.ledgerKeyRingProtocol,
        args: ledgerKeyRingProtocolArgs,
        output: output => {
          ledgerSyncPushDataArgs.rootId = output.rootId;
          ledgerSyncPushDataArgs.walletSyncEncryptionKey = output.walletSyncEncryptionKey;
          ledgerSyncPushDataArgs.applicationPath = output.applicationPath;
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

      await app.layout.goToSettings();

      await app.settings.openManageLedgerSync();
      await app.ledgerSync.destroyTrustchain();
      await app.ledgerSync.expectBackupDeletion();
      await app.drawer.close();
    },
  );
});
