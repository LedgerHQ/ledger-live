import { Step } from "jest-allure2-reporter/api";
import { removeSpeculosAndDeregisterKnownSpeculos } from "@e2e/utils/speculosUtils";
import { Account, getParentAccountName } from "@ledgerhq/live-e2e-shared/enum/Account";
import { isIos, openDeeplink } from "@e2e/helpers/commonHelpers";
import { device } from "detox";
import { DEFAULT_TIMEOUT } from "@e2e/helpers/elementHelpers";
import ErrorPage from "@e2e/page/error.page";
import { isAggregatedAssetsEnabled } from "@e2e/utils/featureFlagUtils";

export default class CommonPage {
  assetScreenFlatlistId = "asset-screen-flatlist";
  searchBarId = "common-search-field";
  successViewDetailsButtonId = "enabled-success-view-details-button";
  validateSuccessScreenId = "validate-success-screen";
  proceedButtonId = "proceed-button";
  accountItemId = "account-item-";
  accountItemNameRegExp = new RegExp(`${this.accountItemId}.*-name`);
  deviceItem = (deviceId: string): string => `device-item-${deviceId}`;
  deviceItemRegex = /device-item-.*/;
  walletApiWebview = "wallet-api-webview";
  closeWithConfirmationButtonId = "button-close-add-account";
  closeButtonId = "NavigationHeaderCloseButton";
  errorPage = new ErrorPage();
  seeAllTransactionButton = "portfolio-seeAll-transaction";
  assetDetailScrollViewId = /^asset-detail-scroll-view-.*/;
  assetDetailTransactionsHeaderId = "asset-detail-transactions-header";
  accountGraphId = (accountId: string) => `account-graph-${accountId}`;

  searchBar = () => getElementById(this.searchBarId);
  closeButton = () => getElementById(this.closeButtonId);
  backButton = () => getElementById("navigation-header-back-button");
  seeAllOperationsButtonElement = () => getElementById(this.seeAllTransactionButton);
  assetScreenFlatlistElement = () => getElementById(this.assetScreenFlatlistId);
  accountItemRegExp = (id = ".*(?<!-name)$") => new RegExp(`${this.accountItemId}${id}`);
  accountItem = (id: string) => getElementById(this.accountItemRegExp(id));
  accountItemName = (accountId: string) => getElementById(`${this.accountItemId + accountId}-name`);
  accountId = (account: Account) =>
    `test-id-account-${getParentAccountName(account)}${account.tokenType !== undefined ? ` (${account.currency.ticker})` : ""}`;

  @Step("Perform search {{{0}}}")
  async performSearch(text: string) {
    await waitForElementById(this.searchBarId);
    await typeTextByElement(this.searchBar(), text);
  }

  @Step("Select currency to debit {{{0.accountName}}}")
  async selectAccount(account: Account) {
    const accountId = this.accountId(account);
    await waitForElementById(accountId);
    await tapByIdAndExpectToDisappear(accountId);
  }

  @Step("Expect search {{{0}}}")
  async expectSearch(text: string) {
    await detoxExpect(this.searchBar()).toHaveText(text);
  }

  @Step("Close page")
  async closePage(options?: { onlyIfVisible: boolean }) {
    if (options?.onlyIfVisible && !(await IsIdVisible(this.closeButtonId))) {
      return;
    }
    await tapByElement(this.closeButton());
  }

  @Step("Go to previous page")
  async goToPreviousPage() {
    await tapByElement(this.backButton());
  }

  @Step("Tap on view details")
  async successViewDetails() {
    await waitForElementById(this.validateSuccessScreenId, DEFAULT_TIMEOUT, {
      errorElementId: this.errorPage.genericErrorModalId,
    });
    await waitForElementById(this.successViewDetailsButtonId);
    await tapById(this.successViewDetailsButtonId);
  }

  @Step("Go to the account {{{0}}}")
  async goToAccount(accountId: string, currencyId: string) {
    if (await isAggregatedAssetsEnabled()) {
      if (await IsIdVisible(this.accountGraphId(accountId))) {
        return; // already on the account page (e.g. navigated via CryptoAddressesScreen)
      }
      const scrollViewId = `asset-detail-scroll-view-${currencyId}`;
      await openDeeplink(`asset/${currencyId}`);
      await waitForElementById(scrollViewId);
      const itemId = `asset-detail-address-item-${accountId}`;
      await revealForTap(itemId, { container: scrollViewId });
      await tapByElement(getElementById(itemId));
    } else {
      await scrollToId(this.accountItemRegExp(accountId), this.assetScreenFlatlistId);
      await tapByElement(this.accountItem(accountId));
    }
  }

  @Step("Tap on close with confirmation button")
  async tapCloseWithConfirmationButton() {
    await waitForElementById(this.closeWithConfirmationButtonId);
    await tapById(this.closeWithConfirmationButtonId);
  }

  @Step("Get the account name at index {{{0}}}")
  async getAccountName(index = 0) {
    if (await isAggregatedAssetsEnabled()) {
      if (await IsIdVisible("CryptoAddressesList")) {
        await scrollToId(this.accountItemNameRegExp, "CryptoAddressesList");
        return await getTextOfElement(this.accountItemNameRegExp, index);
      } else {
        await app.assetDetail.scrollToAddressesHeader();
        return await app.assetDetail.getAddressItemName(index);
      }
    } else {
      return await getTextOfElement(this.accountItemNameRegExp, index);
    }
  }

  @Step("Expect the account name {{{0}}}")
  async expectAccountName(accountName: string, index = 0) {
    jestExpect(await this.getAccountName(index)).toBe(accountName);
  }

  @Step("Go to the account with the name {{{0}}}")
  async goToAccountByName(name: string) {
    const accountTitle = getElementByText(name);
    const rowId = (await getIdOfElement(accountTitle)).replace("-name", ""); // Workaround on iOS (name on top of the return arrow clickable layout)
    if (!(await isAggregatedAssetsEnabled())) {
      jestExpect(rowId).toContain(this.accountItemId);
    }
    await tapById(rowId);
  }

  @Step("Remove Speculos")
  async removeSpeculos(deviceId?: string) {
    await removeSpeculosAndDeregisterKnownSpeculos(deviceId);
  }

  @Step("Select a known device")
  async selectKnownDevice(index = 0) {
    const speculosAddress = process.env.DEVICE_PROXY_URL;
    const elementId = speculosAddress
      ? this.deviceItem(`speculos|${speculosAddress}`)
      : this.deviceItemRegex;
    await waitForElementById(elementId);
    await tapById(elementId, speculosAddress ? undefined : index);
  }

  @Step("Tap proceed button")
  async tapProceedButton() {
    await tapById(this.proceedButtonId);
  }

  async disableSynchronizationForiOS() {
    if (isIos()) await device.disableSynchronization();
  }

  async enableSynchronization() {
    await device.enableSynchronization();
  }

  @Step("Press on see all operations button")
  async pressOnSeeAllOperationsButton() {
    await detoxExpect(this.assetScreenFlatlistElement()).toBeVisible();
    await scrollToId(this.seeAllTransactionButton, this.assetScreenFlatlistId);
    await tapByElement(this.seeAllOperationsButtonElement());
  }

  @Step("Press on see all operations button from asset page")
  async pressOnSeeAllOperationsButtonFromAssetPage() {
    if (await isAggregatedAssetsEnabled()) {
      await scrollToId(
        this.assetDetailTransactionsHeaderId,
        this.assetDetailScrollViewId,
        500,
        "down",
      );
      await tapById(this.assetDetailTransactionsHeaderId);
    } else {
      await this.pressOnSeeAllOperationsButton();
    }
  }
}
