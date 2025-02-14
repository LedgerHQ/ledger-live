import { CLI } from "../../../utils/cliUtils";
import { Application } from "../../../page";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { activateLedgerSync } from "@ledgerhq/live-common/e2e/speculos";
import { device } from "detox";
import { getEnv } from "@ledgerhq/live-env";
import { getFlags } from "../../../bridge/server";

const app = new Application();
const tmsLink = "B2CQA-2292, B2CQA-2293, B2CQA-2296";

let cloudSyncApiBaseUrl = "";
const ledgerKeyRingProtocolArgs = {
  apiBaseUrl: "",
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
  const environment = JSON.parse(await getFlags()).llmWalletSync.params?.environment;
  ledgerKeyRingProtocolArgs.apiBaseUrl =
    environment == "PROD" ? getEnv("TRUSTCHAIN_API_PROD") : getEnv("TRUSTCHAIN_API_STAGING");
  cloudSyncApiBaseUrl =
    environment == "PROD" ? getEnv("CLOUD_SYNC_API_PROD") : getEnv("CLOUD_SYNC_API_STAGING");

  return CLI.ledgerKeyRingProtocol({
    initMemberCredentials: true,
    apiBaseUrl: ledgerKeyRingProtocolArgs.apiBaseUrl,
  }).then(output => {
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

describe(`Ledger Sync Accounts`, () => {
  beforeAll(async () => {
    await app.init({
      speculosApp: AppInfos.LS,
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
            cloudSyncApiBaseUrl: cloudSyncApiBaseUrl,
          });
        },
      ],
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  async function goToLedgerSync() {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.navigateToSettings();
    await app.settings.navigateToGeneralSettings();
    await app.settingsGeneral.navigateToLedgerSync();
  }

  $TmsLink(tmsLink);
  it(`Synchronize one instance then delete the backup`, async () => {
    await app.accounts.openViaDeeplink();
    await app.accounts.expectAccountsNumber(0);
    await goToLedgerSync();
    await app.ledgerSync.expectLedgerSyncPageIsDisplayed();
    await app.ledgerSync.tapTurnOnSync();
    await app.common.selectKnownDevice();
    await activateLedgerSync();
    await app.ledgerSync.expectLedgerSyncSuccessPage();
    await app.ledgerSync.closeActivationSuccessPage();
    await app.accounts.openViaDeeplink();
    await app.accounts.expectAccountsNumber(2);
    await goToLedgerSync();
    await app.ledgerSync.openDeleteSync();
    // TODO: Remove the following line when the issue is fixed
    await device.disableSynchronization();
    await app.ledgerSync.confirmDeleteSync();
    await app.ledgerSync.expectLedgerSyncSuccessPage();
    await app.ledgerSync.closeDeletionSuccessPage();
    await device.enableSynchronization();
  });
});
