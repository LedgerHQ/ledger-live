import { test } from "../../fixtures/common";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";
import { activateLedgerSync } from "@ledgerhq/live-common/e2e/speculos";

const app: AppInfos = AppInfos.LS;

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
    data: '{"accounts":[{"id":"mock:1:dogecoin:0.790010769447963:","currencyId":"dogecoin","index":1,"seedIdentifier":"mock","derivationMode":"","freshAddress":"1uVnrWAzycYqKUXSuNXt3XSjJ8"},{"id":"mock:1:bitcoin_gold:0.8027791663782486:","currencyId":"bitcoin_gold","index":1,"seedIdentifier":"mock","derivationMode":"","freshAddress":"1Y5T8JQqBKUS7cXbxUYCR4wg3YSbV9R"}],"accountNames":{"mock:1:dogecoin:0.790010769447963:":"Renamed Dogecoin 2","mock:1:bitcoin_gold:0.8027791663782486:":"Bitcoin Gold 2"}}',
  };

  async function initializeLedgerKeyRingProtocol() {
    return CLI.ledgerKeyRingProtocol({ initMemberCredentials: true }).then(output => {
      if (output && typeof output !== "string" && "pubkey" in output) {
        ledgerKeyRingProtocolArgs.pubKey = output.pubkey;
        ledgerKeyRingProtocolArgs.privateKey = output.privatekey;
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
      }
      return out;
    });
    await activateLedgerSync();
    return output;
  }

  test.use({
    userdata: "skip-onboarding",
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
