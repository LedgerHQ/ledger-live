import { Step } from "jest-allure2-reporter/api";
import { removeSpeculosAndDeregisterKnownSpeculos } from "@e2e/utils/speculosUtils";
import { Account, getParentAccountName } from "@ledgerhq/live-e2e-shared/enum/Account";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { delay, isIos, openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId, byText } from "@e2e/helpers/elements/native";
import { device, log } from "detox";
import { INTERVAL, TIMEOUT } from "@e2e/utils/timeouts";
import { GENERIC_ERROR_MODAL_ID } from "@e2e/page/error.page";

const SYNC_TOGGLE_MAX_ATTEMPTS = 3;

type AccountItemOptions = {
  /** What follows the "account-item-" prefix, as a regex source. */
  idPattern?: string;
  index?: number;
};

export default class CommonPage {
  /** Prefix of the account row testIDs, shared with the pages that extend this one. */
  protected readonly accountItemId = "account-item-";
  protected readonly cryptoAddressesList = byId("CryptoAddressesList");
  protected readonly closeWithConfirmationButton = byId("button-close-add-account");

  private readonly searchBar = byId("common-search-field");
  private readonly closeButton = byId("NavigationHeaderCloseButton");
  private readonly backButton = byId("navigation-header-back-button");
  private readonly validateSuccessScreen = byId("validate-success-screen");
  private readonly successViewDetailsButton = byId("enabled-success-view-details-button");
  private readonly walletApiWebview = byId("wallet-api-webview");
  private readonly genericErrorModal = byId(GENERIC_ERROR_MODAL_ID);
  private readonly accountItemNameAt = (index = 0) =>
    byId(new RegExp(`${this.accountItemId}.*-name`), index);
  private readonly accountTitle = (name: string) => byText(name);
  private readonly accountRow = (rowId: string) => byId(rowId);
  private readonly accountCard = (account: Account) =>
    byId(
      `test-id-account-${getParentAccountName(account)}${account.tokenType === undefined ? "" : ` (${account.currency.ticker})`}`,
    );
  private readonly accountGraph = (accountId: string) => byId(`account-graph-${accountId}`);
  private readonly assetDetailScrollView = (currencyId: string) =>
    byId(`asset-detail-scroll-view-${currencyId}`);
  private readonly assetDetailAddressItem = (accountId: string) =>
    byId(`asset-detail-address-item-${accountId}`);
  private readonly speculosDevice = (speculosAddress: string) =>
    byId(`device-item-speculos|${speculosAddress}`);
  private readonly anyDevice = (index: number) => byId(/device-item-.*/, index);

  /**
   * An account row, by a pattern on what follows the prefix: every row by default, not their
   * "-name" child.
   */
  protected readonly accountItem = (options: AccountItemOptions = {}) => {
    const { idPattern = ".*(?<!-name)$", index = 0 } = options;
    return byId(new RegExp(`${this.accountItemId}${idPattern}`), index);
  };
  protected readonly accountItemName = (accountId: string) =>
    byId(`${this.accountItemId}${accountId}-name`);

  @Step("Perform search {{{0}}}")
  async performSearch(text: string) {
    await this.searchBar.replaceText(text);
  }

  @Step("Select currency to debit {{{0.accountName}}}")
  async selectAccount(account: Account) {
    await this.accountCard(account).tap();
    await this.accountCard(account).waitNotVisible();
  }

  @Step("Expect search {{{0}}}")
  async expectSearch(text: string) {
    await this.searchBar.expectText(text);
  }

  @Step("Close page")
  async closePage(options?: { onlyIfVisible: boolean }) {
    if (options?.onlyIfVisible && !(await this.closeButton.isVisible())) {
      return;
    }
    await this.closeButton.tap();
  }

  @Step("Go to previous page")
  async goToPreviousPage() {
    await this.backButton.tap();
  }

  @Step("Tap on view details")
  async successViewDetails() {
    await this.validateSuccessScreen.waitVisible(TIMEOUT.xxlarge, this.genericErrorModal);
    await this.successViewDetailsButton.tap();
  }

  @Step("Wait for the wallet API webview")
  async waitForWalletApiWebview(timeout = TIMEOUT.xxlarge) {
    // Exists, not visible: a drawer can cover the webview while the live app loads.
    await this.walletApiWebview.waitExist(timeout);
  }

  @Step("Expect the wallet API webview")
  async expectWalletApiWebview() {
    await this.walletApiWebview.expectVisible();
  }

  @Step("Go to the account {{{0}}}")
  async goToAccount(accountId: string, currencyId: string) {
    if (await this.accountGraph(accountId).isVisible()) {
      return;
    }
    await openDeeplink(`asset/${currencyId}`);
    await this.assetDetailScrollView(currencyId).waitVisible();
    await this.assetDetailAddressItem(accountId).revealForTap(
      this.assetDetailScrollView(currencyId),
    );
    await this.assetDetailAddressItem(accountId).tap();
  }

  @Step("Tap on close with confirmation button")
  async tapCloseWithConfirmationButton() {
    await this.closeWithConfirmationButton.tap();
  }

  @Step("Get the account name at index {{{0}}}")
  async getAccountName(index = 0) {
    if (await this.cryptoAddressesList.isVisible()) {
      await this.accountItemNameAt().scrollTo(this.cryptoAddressesList);
      return await this.accountItemNameAt(index).getText();
    }
    await app.assetDetail.scrollToAddressesHeader();
    return await app.assetDetail.getAddressItemName(index);
  }

  @Step("Expect the account name {{{0}}}")
  async expectAccountName(accountName: string, index = 0) {
    jestExpect(await this.getAccountName(index)).toBe(accountName);
  }

  @Step("Go to the account with the name {{{0}}}")
  async goToAccountByName(name: string) {
    // On iOS the name sits on top of the row's clickable layout, so tap the row itself.
    const rowId = (await this.accountTitle(name).getIdentifier()).replace("-name", "");
    await this.accountRow(rowId).tap();
  }

  @Step("Remove Speculos")
  async removeSpeculos(deviceId?: string) {
    await removeSpeculosAndDeregisterKnownSpeculos(deviceId);
  }

  @Step("Select a known device")
  async selectKnownDevice(index = 0) {
    const speculosAddress = process.env.DEVICE_PROXY_URL;
    const deviceRow = speculosAddress
      ? this.speculosDevice(speculosAddress)
      : this.anyDevice(index);
    await deviceRow.tap();
  }

  /**
   * Retries a Detox sync toggle: a just-abandoned withTimeout action can leave the bridge with a
   * phantom in-flight request that this call collides with.
   */
  private async retryDetoxSync(
    action: () => Promise<void>,
    label: string,
    attempt = 1,
  ): Promise<void> {
    try {
      await action();
    } catch (error) {
      const message = sanitizeError(error).message;
      if (attempt >= SYNC_TOGGLE_MAX_ATTEMPTS) {
        log.error(
          `${label} failed (attempt ${attempt}/${SYNC_TOGGLE_MAX_ATTEMPTS}), giving up: ${message}`,
        );
        return;
      }
      log.warn(
        `${label} failed (attempt ${attempt}/${SYNC_TOGGLE_MAX_ATTEMPTS}), retrying: ${message}`,
      );
      await delay(INTERVAL.medium);
      await this.retryDetoxSync(action, label, attempt + 1);
    }
  }

  async disableSynchronizationForiOS() {
    if (isIos()) await this.disableSynchronization();
  }

  async disableSynchronization() {
    await this.retryDetoxSync(() => device.disableSynchronization(), "disableSynchronization");
  }

  async enableSynchronization() {
    await this.retryDetoxSync(() => device.enableSynchronization(), "enableSynchronization");
  }
}
