import { Step } from "jest-allure2-reporter/api";
import { activateLedgerSync } from "@ledgerhq/live-common/e2e/speculos";
import { getEnv } from "@ledgerhq/live-env";
import { getFlags } from "../../bridge/server";
import { device } from "detox";

export default class LedgerSyncPage {
  ledgerKeyRingProtocolArgs = {
    apiBaseUrl: "",
    pubKey: "",
    privateKey: "",
  };

  ledgerSyncPushDataArgs = {
    rootId: "",
    walletSyncEncryptionKey: "",
    applicationPath: "",
    push: true,
    data: '{"accounts":[{"id":"mock:1:dogecoin:0.790010769447963:","currencyId":"dogecoin","index":1,"seedIdentifier":"mock","derivationMode":"","freshAddress":"1uVnrWAzycYqKUXSuNXt3XSjJ8"},{"id":"mock:1:bitcoin_gold:0.8027791663782486:","currencyId":"bitcoin_gold","index":1,"seedIdentifier":"mock","derivationMode":"","freshAddress":"1Y5T8JQqBKUS7cXbxUYCR4wg3YSbV9R"}],"accountNames":{"mock:1:dogecoin:0.790010769447963:":"Dogecoin 2","mock:1:bitcoin_gold:0.8027791663782486:":"Bitcoin Gold 2"}}',
    cloudSyncApiBaseUrl: "",
  };

  successPage = "walletsync-success";
  confirmDeleteSyncId = "delete-trustchain";
  deleteSyncId = "walletSync-manage-backup";
  backupDeletionSuccessTextId = "walletsync-delete-backup-success-title";
  useMyLedgerDeviceButtonId = "walletsync-choose-sync-method-connect-device";

  activationButton = () => getElementById("walletsync-activation-button");
  activationTitle = () => getElementById("walletsync-activation-title");
  activationDescription = () => getElementById("walletsync-activation-description");
  activationSuccessCloseButton = () => getElementById("walletsync-activation-success-close");
  deletionSuccessCloseButton = () => getElementById("walletsync-deletion-success-close");

  @Step("Activate Ledger Sync on Speculos")
  async activateLedgerSyncOnSpeculos() {
    await activateLedgerSync();
  }

  @Step("Expect Ledger Sync activation page is displayed")
  async expectLedgerSyncPageIsDisplayed() {
    await detoxExpect(this.activationTitle()).toBeVisible();
    await detoxExpect(this.activationDescription()).toBeVisible();
  }

  @Step("Tap on the activation button")
  async tapTurnOnSync() {
    await tapByElement(this.activationButton());
  }

  @Step("Tap on the use my ledger device button")
  async tapUseMyLedgerDevice() {
    await tapById(this.useMyLedgerDeviceButtonId);
  }

  @Step("Expect Ledger Sync success page")
  async expectLedgerSyncSuccessPage() {
    await waitForElementById(this.successPage);
  }

  @Step("Close the activation success page")
  async closeActivationSuccessPage() {
    await tapByElement(this.activationSuccessCloseButton());
  }

  @Step("Select delete sync")
  async openDeleteSync() {
    await waitForElementById(this.deleteSyncId);
    await tapById(this.deleteSyncId);
  }

  @Step("Confirm deletion of sync")
  async confirmDeleteSync() {
    await waitForElementById(this.confirmDeleteSyncId);
    await tapById(this.confirmDeleteSyncId);
  }

  @Step("Expect deletion success page")
  async expectBackupDeletion() {
    await waitForElementById(this.backupDeletionSuccessTextId);
    await detoxExpect(getElementById(this.backupDeletionSuccessTextId)).toHaveText(
      "Your Ledger Wallet apps are no longer synced",
    );
  }

  @Step("Initialize Ledger Key Ring Protocol")
  async initializeLedgerKeyRingProtocol() {
    const environment = JSON.parse(await getFlags()).llmWalletSync.params?.environment;
    this.ledgerKeyRingProtocolArgs.apiBaseUrl =
      environment == "PROD" ? getEnv("TRUSTCHAIN_API_PROD") : getEnv("TRUSTCHAIN_API_STAGING");
    this.ledgerSyncPushDataArgs.cloudSyncApiBaseUrl =
      environment == "PROD" ? getEnv("CLOUD_SYNC_API_PROD") : getEnv("CLOUD_SYNC_API_STAGING");

    return CLI.ledgerKeyRingProtocol({
      initMemberCredentials: true,
      apiBaseUrl: this.ledgerKeyRingProtocolArgs.apiBaseUrl,
    }).then(output => {
      if (output && "pubkey" in output) {
        this.ledgerKeyRingProtocolArgs.pubKey = output.pubkey;
        this.ledgerKeyRingProtocolArgs.privateKey = output.privatekey;
      }
      return output;
    });
  }

  @Step("Initialize then delete trust chain")
  initializeThenDeleteTrustChain() {
    return [
      async () => this.initializeLedgerKeyRingProtocol(),
      async () => this.initializeLedgerSync(),
      async () => this.deleteLedgerSyncData(),
    ];
  }

  @Step("Delete Ledger Sync data")
  async deleteLedgerSyncData() {
    await CLI.ledgerSync({
      deleteData: true,
      ...this.ledgerKeyRingProtocolArgs,
      ...this.ledgerSyncPushDataArgs,
    });

    await CLI.ledgerKeyRingProtocol({
      destroyKeyRingTree: true,
      ...this.ledgerKeyRingProtocolArgs,
      ...this.ledgerSyncPushDataArgs,
    });
  }

  @Step("Initialize Ledger Sync")
  async initializeLedgerSync() {
    const output = CLI.ledgerKeyRingProtocol({
      getKeyRingTree: true,
      ...this.ledgerKeyRingProtocolArgs,
    }).then(out => {
      if (out && "rootId" in out) {
        this.ledgerSyncPushDataArgs.rootId = out.rootId;
        this.ledgerSyncPushDataArgs.walletSyncEncryptionKey = out.walletSyncEncryptionKey;
        this.ledgerSyncPushDataArgs.applicationPath = out.applicationPath;
      }
      return out;
    });
    await this.activateLedgerSyncOnSpeculos();
    return output;
  }

  @Step("Go to Ledger Sync settings")
  async goToLedgerSync(disableSync = false) {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.navigateToSettings();
    await app.settings.navigateToGeneralSettings();
    if (disableSync) await device.disableSynchronization(); // TODO: Remove line when LIVE-15405 is fixed
    await app.settingsGeneral.navigateToLedgerSync();
  }
}
