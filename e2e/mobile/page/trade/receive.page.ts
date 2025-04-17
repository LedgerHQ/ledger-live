import { by, element, expect } from "detox";
import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";

export default class ReceivePage {
  baseLink = "receive";
  noVerifyAddressButton = "button-DontVerify-my-address";
  noVerifyValidateButton = "button-confirm-dont-verify";
  accountAddress = "receive-fresh-address";
  accountFreshAddressTitle = "receive-verifyAddress-title";
  accountFreshAddress = "receive-verifyAddress-freshAdress";
  buttonVerifyAddressId = "button-verify-my-address";
  buttonCreateAccountId = "button-create-account";
  buttonContinueId = "add-accounts-continue-button";
  step1HeaderTitleId = "receive-header-step1-title";
  step2HeaderTitleId = "receive-header-step2-title";
  networkBasedStep2HeaderTitleId = "addAccounts-header-step2-title";
  receivePageScrollViewId = "receive-screen-scrollView";
  step2HeaderTitle = () => getElementById(this.step2HeaderTitleId);
  step2Accounts = () => getElementById("receive-header-step2-accounts");

  accountId(t: string): string {
    return `test-id-account-${t}`;
  }

  currencyRowId(t: string): string {
    return `big-currency-row-${t}`;
  }

  currencyNameId(t: string): string {
    return `big-currency-name-${t}`;
  }

  currencySubtitleId(t: string): string {
    return `big-currency-subtitle-${t}`;
  }

  titleReceiveConfirmationPageId(t: string): string {
    return `receive-confirmation-title-${t}`;
  }

  accountNameReceiveId(t: string): string {
    return `receive-account-name-${t}`;
  }

  async openViaDeeplink(): Promise<void> {
    await openDeeplink(this.baseLink);
  }

  async receiveViaDeeplink(currencyLong?: string): Promise<void> {
    const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
    await openDeeplink(link);
  }

  async expectFirstStep(): Promise<void> {
    await expect(await getElementById(this.step1HeaderTitleId)).toBeVisible();
  }

  async expectSecondStepNetworks(networks: string[]): Promise<void> {
    await expect(await getElementById(this.step2HeaderTitleId)).toBeVisible();
    await expect(await getElementById("receive-header-step2-networks")).toBeVisible();
    for (const network of networks) {
      await expect(await getElementById(this.currencyNameId(network))).toBeVisible();
    }
  }

  async expectSecondStepAccounts(): Promise<void> {
    await expect(await getElementById(this.step2HeaderTitleId)).toBeVisible();
    await expect(await getElementById("receive-header-step2-accounts")).toBeVisible();
  }

  @Step("Select currency in receive list")
  async selectCurrency(currencyName: string): Promise<void> {
    const id = this.currencyNameId(currencyName.toLowerCase());
    await tapById(id);
  }

  async selectAsset(assetText: string): Promise<void> {
    const id = this.currencySubtitleId(assetText);
    await tapById(id);
  }

  async selectNetwork(networkId: string): Promise<void> {
    const id = this.currencyNameId(networkId);
    await tapById(id);
  }

  async expectSecoundStepAccounts() {
    await expect(await this.step2HeaderTitle()).toBeVisible();
    await expect(await this.step2Accounts()).toBeVisible();
  }

  @Step("Select network in list if needed")
  async selectNetworkIfAsked(networkId: string): Promise<void> {
    if (await IsIdVisible(this.networkBasedStep2HeaderTitleId)) {
      await this.selectNetwork(networkId);
    }
  }

  async selectAccount(account: string): Promise<void> {
    const id = this.accountId(account);
    await waitForElementById(id);
    await tapById(id);
  }

  @Step("Accept to verify address")
  async selectVerifyAddress(): Promise<void> {
    await waitForElementById(this.buttonVerifyAddressId);
    await tapById(this.buttonVerifyAddressId);
  }

  async expectAddressIsVerified(address: string): Promise<void> {
    await waitForElementById(this.accountFreshAddressTitle);
    const shown = await getTextOfElement(this.accountFreshAddress);
    jestExpect(shown).toEqual(address);
  }

  async expectAddressIsDisplayed(address: string): Promise<void> {
    await waitForElementById(this.accountAddress);
    const shown = await getTextOfElement(this.accountAddress);
    jestExpect(shown).toEqual(address);
  }

  @Step("Get the fresh address displayed")
  async getFreshAddressDisplayed(): Promise<string> {
    await waitForElementById(this.accountFreshAddress);
    return await getTextOfElement(this.accountFreshAddress);
  }

  async expectNumberOfAccountInListIsDisplayed(
    currencyName: string,
    accountNumber: number,
  ): Promise<void> {
    const plural = accountNumber > 1 ? "s" : "";
    const accountCountText = `${accountNumber} account${plural}`;
    const networkRowID = new RegExp(this.currencyRowId(".*"));
    const accountNameID = this.currencyNameId(currencyName);
    const accountCountID = this.currencySubtitleId(accountCountText);

    await expect(
      element(
        by
          .id(networkRowID)
          .withDescendant(by.id(accountNameID))
          .withDescendant(by.id(accountCountID)),
      ),
    ).toBeVisible();
  }

  async createAccount(): Promise<void> {
    await waitForElementById(this.buttonCreateAccountId);
    await tapById(this.buttonCreateAccountId);
  }

  async continueCreateAccount(): Promise<void> {
    await waitForElementById(this.buttonContinueId);
    await tapById(this.buttonContinueId);
  }

  async expectAccountIsCreated(accountName: string): Promise<void> {
    await waitForElementById(this.step2HeaderTitleId);
    await expect(await getElementById(this.step2HeaderTitleId)).toBeVisible();
    await expect(await getElementByText(accountName)).toBeVisible();
  }

  async selectDontVerifyAddress(): Promise<void> {
    await waitForElementById(this.noVerifyAddressButton);
    await tapById(this.noVerifyAddressButton);
  }

  async selectReconfirmDontVerify(): Promise<void> {
    await waitForElementById(this.noVerifyValidateButton);
    await tapById(this.noVerifyValidateButton);
  }

  @Step("Expect account receive page is displayed")
  async expectReceivePageIsDisplayed(tickerName: string, accountName: string): Promise<void> {
    const titleID = this.titleReceiveConfirmationPageId(tickerName);
    const accountNameID = this.accountNameReceiveId(accountName);
    await waitForElementById(this.accountAddress);
    await waitForElementById(titleID);
    await expect(await getElementById(titleID)).toBeVisible();
    await expect(await getElementById(accountNameID)).toBeVisible();
  }

  @Step("Expect given address is displayed on receive page")
  async expectAddressIsCorrect(address: string): Promise<void> {
    await expect(await getElementById(this.accountAddress)).toHaveText(address);
  }

  @Step("Expect tron new address warning")
  async expectTronNewAddressWarning(): Promise<void> {
    const warnId = "tron-receive-newAddress-warning";
    const descId = `${warnId}-description`;
    const scrollView = this.receivePageScrollViewId;

    await scrollToId(warnId, scrollView);
    await expect(await getElementById(warnId)).toBeVisible();
    await expect(await getElementById(descId)).toHaveText(
      "You first need to send at least 0.1 TRX to this address to activate it.",
    );
  }

  @Step("Refuse to verify address")
  async doNotVerifyAddress(): Promise<void> {
    await this.selectDontVerifyAddress();
    await this.selectReconfirmDontVerify();
  }
}
