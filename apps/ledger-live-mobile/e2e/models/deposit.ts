import { expect, element, by } from "detox";
import {
  getElementById,
  tapById,
  getElementByText,
  waitForElementById,
  typeTextByElement,
  tapByText,
  tapByElement,
  waitForElementByText,
} from "../helpers";

export default class depositPage {
  searchBar = () => getElementById("common-search-field");
  buttonVerifyAddressId = "button-verify-my-address";
  buttonVerifyAddress = () => getElementById(this.buttonVerifyAddressId);
  buttonDontVerifyAddressId = "button-DontVerify-my-address";
  buttonDontVerifyAddress = () => getElementById(this.buttonDontVerifyAddressId);
  currencyRowSearchPageId = "test-id-account-";
  currencyRowInNetworkListId = "big-currency-row-";
  subtitleRowInNetworkListId = "subtitle-row-";
  buttonCloseQrDepositPage = () => getElementById("NavigationHeaderCloseButton");
  buttonCreateAccountId = "button-create-account";
  buttonCreateAccount = () => getElementById(this.buttonCreateAccountId);
  buttonContinueId = "add-accounts-continue-button";
  buttonContinue = () => getElementById(this.buttonContinueId);
  depositStep2TitleId = "receive-header-step2-title";
  depositStep2Title = () => getElementById(this.depositStep2TitleId);
  buttonConfirmDontVerifyAddressId = "button-confirm-dont-verify";
  buttonConfirmDontVerifyAddress = () => getElementById(this.buttonConfirmDontVerifyAddressId);
  titleDepositConfirmationPageId = "deposit-confirmation-title-";
  accountNameDepositId = "deposit-account-name-";
  searchFieldId = "common-search-field";

  async searchAsset(asset: string) {
    await waitForElementById(this.searchFieldId);
    return typeTextByElement(this.searchBar(), asset);
  }

  async selectAsset(asset: string) {
    await waitForElementByText(asset);
    return tapByText(asset);
  }

  async selectAccount(account: string) {
    const CurrencyRowId = this.currencyRowSearchPageId + account;
    await waitForElementById(CurrencyRowId);
    return tapById(CurrencyRowId);
  }

  async selectVerifyAddress() {
    await waitForElementById(this.buttonVerifyAddressId);
    return tapByElement(this.buttonVerifyAddress());
  }

  async expectAddressIsVerified(address: string) {
    await waitForElementByText(address);
    await expect(getElementByText(address)).toBeVisible();
    await expect(getElementByText("Verify address")).toBeVisible();
  }

  async expectNumberOfAccountInListIsDisplayed(currencyName: string, accountNumber: number) {
    //set "account" in plural or not in fonction of number account
    const pluralization: string = accountNumber > 1 ? "accounts" : "account";
    const currencyRowNameID = this.currencyRowInNetworkListId + currencyName;
    const accountCountRowID = this.subtitleRowInNetworkListId + accountNumber + " " + pluralization;
    await waitForElementById(currencyRowNameID);
    await waitForElementById(accountCountRowID);
    // expect accountCountRowId is visible and is child of currencyRowNameID
    await expect(
      element(by.id(currencyRowNameID).withDescendant(by.id(accountCountRowID))),
    ).toBeVisible();
  }

  closeQrCodeDepositPage() {
    return tapByElement(this.buttonCloseQrDepositPage());
  }

  async createAccount() {
    await waitForElementById(this.buttonCreateAccountId);
    return tapByElement(this.buttonCreateAccount());
  }

  async continueCreateAccount() {
    await waitForElementById(this.buttonContinueId);
    return tapByElement(this.buttonContinue());
  }

  async expectAccountIsCreated(accountName: string) {
    await waitForElementById(this.depositStep2TitleId);
    await expect(this.depositStep2Title()).toBeVisible();
    await expect(getElementByText(accountName)).toBeVisible();
  }

  async selectDontVerifyAddress() {
    await waitForElementById(this.buttonDontVerifyAddressId);
    return tapByElement(this.buttonDontVerifyAddress());
  }

  async selectReconfirmDontVerify() {
    await waitForElementById(this.buttonConfirmDontVerifyAddressId);
    return tapByElement(this.buttonConfirmDontVerifyAddress());
  }

  async expectDepositPageIsDisplayed(tickerName: string, accountName: string) {
    const depositTitleTickerId = this.titleDepositConfirmationPageId + tickerName;
    const accountNameId = this.accountNameDepositId + accountName;
    await waitForElementById(depositTitleTickerId);
    await expect(getElementById(depositTitleTickerId)).toBeVisible();
    await expect(getElementById(accountNameId)).toBeVisible();
  }
}
