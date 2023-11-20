import {
  currencyParam,
  getElementById,
  getElementByText,
  getTextOfElement,
  openDeeplink,
  tapByElement,
  tapById,
  waitForElementById,
} from "../../helpers";
import { by, element, expect } from "detox";
import jestExpect from "expect";

const baseLink = "receive";

export default class ReceivePage {
  noVerifyAddressButton = "button-DontVerify-my-address";
  noVerifyValidateButton = "button-confirm-dont-verify";
  accountAddress = "receive-fresh-address";
  accountFreshAddressTitle = "receive-verifyAddress-title";
  accountFreshAddress = "receive-verifyAddress-freshAdress";
  buttonVerifyAddressId = "button-verify-my-address";
  currencyRowSearchPageId = "test-id-account-";
  currencyRowInNetworkListId = "big-currency-row-";
  subtitleRowInNetworkListId = "subtitle-row-";
  buttonCloseQrReceivePage = () => getElementById("NavigationHeaderCloseButton");
  buttonCreateAccountId = "button-create-account";
  buttonCreateAccount = () => getElementById(this.buttonCreateAccountId);
  buttonContinueId = "add-accounts-continue-button";
  buttonContinue = () => getElementById(this.buttonContinueId);
  step1HeaderTitle = () => getElementById("receive-header-step1-title");
  step2HeaderTitleId = "receive-header-step2-title";
  step2HeaderTitle = () => getElementById(this.step2HeaderTitleId);
  titleReceiveConfirmationPageId = "receive-confirmation-title-";
  accountNameReceiveId = "receive-account-name-";

  step2Accounts = () => getElementById("receive-header-step2-accounts");
  step2Networks = () => getElementById("receive-header-step2-networks");

  openViaDeeplink() {
    return openDeeplink(baseLink);
  }

  async receiveViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;

    await openDeeplink(link);
  }

  async selectCurrency(currencyId: string) {
    const id = this.currencyRowInNetworkListId + currencyId;
    await waitForElementById(id);
    await tapById(id);
  }

  async selectAsset(assetId: string) {
    const id = this.subtitleRowInNetworkListId + assetId;
    await waitForElementById(id);
    return tapById(id);
  }

  async selectAccount(account: string) {
    const CurrencyRowId = this.currencyRowSearchPageId + account;
    await waitForElementById(CurrencyRowId);
    await tapById(CurrencyRowId);
  }

  async selectVerifyAddress() {
    await waitForElementById(this.buttonVerifyAddressId);
    await tapById(this.buttonVerifyAddressId);
  }

  async expectAddressIsVerified(address: string) {
    await waitForElementById(this.accountFreshAddressTitle);
    jestExpect(await getTextOfElement(this.accountFreshAddress)).toEqual(address);
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

  closeQrCodeReceivePage() {
    return tapByElement(this.buttonCloseQrReceivePage());
  }

  async createAccount() {
    await waitForElementById(this.buttonCreateAccountId);
    return tapById(this.buttonCreateAccountId);
  }

  async continueCreateAccount() {
    await waitForElementById(this.buttonContinueId);
    return tapById(this.buttonContinueId);
  }

  async expectAccountIsCreated(accountName: string) {
    await waitForElementById(this.step2HeaderTitleId);
    await expect(this.step2HeaderTitle()).toBeVisible();
    await expect(getElementByText(accountName)).toBeVisible();
  }

  async selectDontVerifyAddress() {
    await waitForElementById(this.noVerifyAddressButton);
    return tapById(this.noVerifyAddressButton);
  }

  async selectReconfirmDontVerify() {
    await waitForElementById(this.noVerifyValidateButton);
    return tapById(this.noVerifyValidateButton);
  }

  async expectReceivePageIsDisplayed(tickerName: string, accountName: string) {
    const receiveTitleTickerId = this.titleReceiveConfirmationPageId + tickerName;
    const accountNameId = this.accountNameReceiveId + accountName;
    await waitForElementById(receiveTitleTickerId);
    await expect(getElementById(receiveTitleTickerId)).toBeVisible();
    await expect(getElementById(accountNameId)).toBeVisible();
  }
}
