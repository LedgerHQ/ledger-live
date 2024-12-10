import {
  currencyParam,
  getElementById,
  getElementByText,
  getTextOfElement,
  openDeeplink,
  scrollToId,
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
  accountId = (t: string) => `test-id-account-${t}`;
  currencyRowId = (t: string) => `big-currency-row-${t}`;
  currencyNameId = (t: string) => `big-currency-name-${t}`;
  currencySubtitleId = (t: string) => `big-currency-subtitle-${t}`;
  buttonCreateAccountId = "button-create-account";
  buttonCreateAccount = () => getElementById(this.buttonCreateAccountId);
  buttonContinueId = "add-accounts-continue-button";
  buttonContinue = () => getElementById(this.buttonContinueId);
  step1HeaderTitle = () => getElementById("receive-header-step1-title");
  step2HeaderTitleId = "receive-header-step2-title";
  step2HeaderTitle = () => getElementById(this.step2HeaderTitleId);
  titleReceiveConfirmationPageId = (t: string) => `receive-confirmation-title-${t}`;
  accountNameReceiveId = (t: string) => `receive-account-name-${t}`;
  receivePageScrollViewId = "receive-screen-scrollView";

  step2Accounts = () => getElementById("receive-header-step2-accounts");
  step2Networks = () => getElementById("receive-header-step2-networks");

  tronNewAddressWarningId = "tron-receive-newAddress-warning";
  tronNewAddressWarningDescription = () =>
    getElementById(`${this.tronNewAddressWarningId}-description`);
  tronNewAddressWarningText =
    "You first need to send at least 0.1 TRX to this address to activate it.";

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async receiveViaDeeplink(currencyLong?: string) {
    const link = currencyLong ? baseLink + currencyParam + currencyLong : baseLink;
    await openDeeplink(link);
  }

  async expectFirstStep() {
    await expect(this.step1HeaderTitle()).toBeVisible();
  }

  async expectSecondStepNetworks(networks: string[]) {
    await expect(this.step2HeaderTitle()).toBeVisible();
    await expect(this.step2Networks()).toBeVisible();
    for (const network of networks) {
      await expect(getElementById(this.currencyNameId(network))).toBeVisible();
    }
  }

  async expectSecoundStepAccounts() {
    await expect(this.step2HeaderTitle()).toBeVisible();
    await expect(this.step2Accounts()).toBeVisible();
  }

  async selectCurrency(currencyName: string) {
    const id = this.currencyNameId(currencyName.toLowerCase());
    await tapById(id);
  }

  async selectAsset(assetText: string) {
    const id = this.currencySubtitleId(assetText);
    return tapById(id);
  }

  async selectNetwork(networkId: string) {
    const id = this.currencyNameId(networkId);
    return tapById(id);
  }

  async selectAccount(account: string) {
    const CurrencyRowId = this.accountId(account);
    await waitForElementById(CurrencyRowId);
    await tapById(CurrencyRowId);
  }

  @Step("Accept to verify address")
  async selectVerifyAddress() {
    await waitForElementById(this.buttonVerifyAddressId);
    await tapById(this.buttonVerifyAddressId);
  }

  async expectAddressIsVerified(address: string) {
    await waitForElementById(this.accountFreshAddressTitle);
    jestExpect(await getTextOfElement(this.accountFreshAddress)).toEqual(address);
  }

  async expectAddressIsDisplayed(address: string) {
    await waitForElementById(this.accountAddress);
    jestExpect(await getTextOfElement(this.accountAddress)).toEqual(address);
  }

  @Step("Get the fresh address displayed")
  async getFreshAddressDisplayed() {
    await waitForElementById(this.accountFreshAddress);
    return await getTextOfElement(this.accountFreshAddress);
  }

  async expectNumberOfAccountInListIsDisplayed(currencyName: string, accountNumber: number) {
    //set "account" in plural or not in fonction of number account
    const accountCount: string = accountNumber + " account" + (accountNumber > 1 ? "s" : "");
    const networkRowID = new RegExp(this.currencyRowId(".*"));
    const accountnameID = this.currencyNameId(currencyName);
    const accountCountID = this.currencySubtitleId(accountCount);
    // expect accountCountID is visible and is child of networkRowID
    await expect(
      element(
        by
          .id(networkRowID)
          .withDescendant(by.id(accountnameID))
          .withDescendant(by.id(accountCountID)),
      ),
    ).toBeVisible();
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

  @Step("Expect account receive page is displayed")
  async expectReceivePageIsDisplayed(tickerName: string, accountName: string) {
    const receiveTitleTickerId = this.titleReceiveConfirmationPageId(tickerName);
    const accountNameId = this.accountNameReceiveId(accountName);
    await waitForElementById(this.accountAddress);
    await waitForElementById(receiveTitleTickerId);
    await expect(getElementById(receiveTitleTickerId)).toBeVisible();
    await expect(getElementById(accountNameId)).toBeVisible();
  }

  @Step("Expect given address is displayed on receive page")
  async expectAddressIsCorrect(address: string) {
    await expect(getElementById(this.accountAddress)).toHaveText(address);
  }

  @Step("Expect tron new address warning")
  async expectTronNewAddressWarning() {
    await scrollToId(this.tronNewAddressWarningId, this.receivePageScrollViewId);
    await expect(getElementById(this.tronNewAddressWarningId)).toBeVisible();
    await expect(this.tronNewAddressWarningDescription()).toHaveText(
      this.tronNewAddressWarningText,
    );
  }

  @Step("Refuse to verify address")
  async doNotVerifyAddress() {
    await this.selectDontVerifyAddress();
    await this.selectReconfirmDontVerify();
  }
}
