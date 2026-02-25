import { device } from "detox";
import { getEnv } from "@ledgerhq/live-env";
import { getFlags } from "../../bridge/server";
import { describeIfNotNanoS } from "../../helpers/commonHelpers";

const tmsLinks = ["B2CQA-2292", "B2CQA-2293", "B2CQA-2296"];
const tags = ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

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
  data: '{"accounts":[{"id":"mock:1:dogecoin:0.790010769447963:","currencyId":"dogecoin","index":1,"seedIdentifier":"mock","derivationMode":"","freshAddress":"1uVnrWAzycYqKUXSuNXt3XSjJ8"},{"id":"mock:1:bitcoin_gold:0.8027791663782486:","currencyId":"bitcoin_gold","index":1,"seedIdentifier":"mock","derivationMode":"","freshAddress":"1Y5T8JQqBKUS7cXbxUYCR4wg3YSbV9R"}],"accountNames":{"mock:1:dogecoin:0.790010769447963:":"Dogecoin 2","mock:1:bitcoin_gold:0.8027791663782486:":"Bitcoin Gold 2"}}',
  cloudSyncApiBaseUrl: "",
};

async function initializeLedgerKeyRingProtocol() {
  const environment = JSON.parse(await getFlags()).llmWalletSync.params?.environment;
  ledgerKeyRingProtocolArgs.apiBaseUrl =
    environment == "PROD" ? getEnv("TRUSTCHAIN_API_PROD") : getEnv("TRUSTCHAIN_API_STAGING");
  ledgerSyncPushDataArgs.cloudSyncApiBaseUrl =
    environment == "PROD" ? getEnv("CLOUD_SYNC_API_PROD") : getEnv("CLOUD_SYNC_API_STAGING");

  return CLI.ledgerKeyRingProtocol({
    initMemberCredentials: true,
    apiBaseUrl: ledgerKeyRingProtocolArgs.apiBaseUrl,
  }).then(output => {
    if (output && "pubkey" in output) {
      ledgerKeyRingProtocolArgs.pubKey = output.pubkey;
      ledgerKeyRingProtocolArgs.privateKey = output.privatekey;
    }
    return output;
  });
}

function initializeThenDeleteTrustChain() {
  return [
    async () => initializeLedgerKeyRingProtocol(),
    async () => initializeLedgerSync(),
    async () => deleteLedgerSyncData(),
  ];
}

async function deleteLedgerSyncData() {
  await CLI.ledgerSync({
    deleteData: true,
    ...ledgerKeyRingProtocolArgs,
    ...ledgerSyncPushDataArgs,
  });

  await CLI.ledgerKeyRingProtocol({
    destroyKeyRingTree: true,
    ...ledgerKeyRingProtocolArgs,
    ...ledgerSyncPushDataArgs,
  });
}

async function initializeLedgerSync() {
  const output = CLI.ledgerKeyRingProtocol({
    getKeyRingTree: true,
    ...ledgerKeyRingProtocolArgs,
  }).then(out => {
    if (out && "rootId" in out) {
      ledgerSyncPushDataArgs.rootId = out.rootId;
      ledgerSyncPushDataArgs.walletSyncEncryptionKey = out.walletSyncEncryptionKey;
      ledgerSyncPushDataArgs.applicationPath = out.applicationPath;
    }
    return out;
  });
  await app.ledgerSync.activateLedgerSyncOnSpeculos();
  return output;
}

describeIfNotNanoS(`Ledger Sync Accounts`, () => {
  beforeAll(async () => {
    await app.init({
      speculosApp: AppInfos.LS,
      cliCommands: [
        ...initializeThenDeleteTrustChain(),
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
      //TODO: Remove line when LIVE-24337 is fixed
      featureFlags: {
        llmAccountListUI: { enabled: true },
      },
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  async function goToLedgerSync(disableSync = false) {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.navigateToSettings();
    await app.settings.navigateToGeneralSettings();
    if (disableSync) await device.disableSynchronization(); // TODO: Remove line when LIVE-15405 is fixed
    await app.settingsGeneral.navigateToLedgerSync();
  }

  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  it(`Synchronize one instance then delete the backup`, async () => {
    await app.accounts.openViaDeeplink();
    await app.accounts.expectNoAccount();
    await goToLedgerSync();
    await app.ledgerSync.expectLedgerSyncPageIsDisplayed();
    await app.ledgerSync.tapTurnOnSync();
    await app.ledgerSync.tapUseMyLedgerDevice();
    await app.common.selectKnownDevice();
    await app.ledgerSync.activateLedgerSyncOnSpeculos();
    await app.ledgerSync.expectLedgerSyncSuccessPage();
    await app.ledgerSync.closeActivationSuccessPage();
    await app.accounts.openViaDeeplink();
    await app.accounts.expectAccountsNumber(2, ledgerSyncPushDataArgs.data);
    await goToLedgerSync(true);
    await app.ledgerSync.openDeleteSync();
    await app.ledgerSync.confirmDeleteSync();
    await app.ledgerSync.expectBackupDeletion();
  });
});
