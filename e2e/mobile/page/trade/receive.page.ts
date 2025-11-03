import { by, element } from "detox";
import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";
import { TokenType } from "@ledgerhq/live-common/lib/e2e/enum/TokenType";

export default class ReceivePage {
  baseLink = "receive";
  noVerifyAddressButton = "button-DontVerify-my-address";
  noVerifyValidateButton = "button-confirm-dont-verify";
  accountAddress = "receive-fresh-address";
  accountFreshAddress = "receive-verifyAddress-freshAdress";
  buttonVerifyAddressId = "button-verify-my-address";
  buttonCreateAccountId = "button-create-account";
  buttonContinueId = "add-accounts-continue-button";
  step2HeaderTitleId = "receive-header-step2-title";
  networkBasedStep2HeaderTitleId = "addAccounts-header-step2-title";
  networkBasedTitleIdMAD = "modular-drawer-Network-title";
  receivePageScrollViewId = "receive-screen-scrollView";
  receiveConnectDeviceHeaderId = "receive-connect-device-header";
  selectCryptoScrollViewId = "select-crypto-scrollView";
  //networkSelectionScrollViewId = "network-selection-scrollView";

  currencyRowId = (t: string) => `big-currency-row-${t}`;
  currencyNameId = (t: string) => `big-currency-name-${t}`;
  //currencyNameIdMAD = (currencyId: string) => `asset-item-${currencyId}`;
  //networkItemIdMAD = (networkId: string) => `network-item-${networkId}`;
  currencyNameIdByRegex = (type: string) => new RegExp(`big-currency-name-.*\\/${type}\\/.*`);
  currencySubtitleId = (t: string) => `big-currency-subtitle-${t}`;
  step1HeaderTitle = () => getElementById("receive-header-step1-title");
  step2HeaderTitle = () => getElementById(this.step2HeaderTitleId);
  titleReceiveConfirmationPageId = (t: string) => `receive-confirmation-title-${t}`;
  accountNameReceiveId = (t: string) => `receive-account-name-${t}`;
  receiveQrCodeContainerId = (t: string) => `receive-qr-code-container-${t}`;
  step2Accounts = () => getElementById("receive-header-step2-accounts");

  @Step("Open receive via deeplink")
  async openViaDeeplink(): Promise<void> {
    await openDeeplink(this.baseLink);
  }

  @Step("Receive via deeplink")
  async receiveViaDeeplink(currencyLong?: string): Promise<void> {
    const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
    await openDeeplink(link);
  }

  @Step("Expect first step")
  async expectFirstStep() {
    await detoxExpect(this.step1HeaderTitle()).toBeVisible();
  }

  @Step("Expect second step networks")
  async expectSecondStepNetworks(networks: string[]): Promise<void> {
    await detoxExpect(getElementById(this.step2HeaderTitleId)).toBeVisible();
    await detoxExpect(getElementById("receive-header-step2-networks")).toBeVisible();
    for (const network of networks) {
      await detoxExpect(getElementById(this.currencyNameId(network))).toBeVisible();
    }
  }

  @Step("Select currency in receive list")
  async selectCurrency(currencyName: string): Promise<void> {
    //not MAD:
    const id = this.currencyNameId(currencyName.toLowerCase());
    // MAD:
    //const id = this.currencyNameIdMAD(currencyNameId);
    if (!(await IsIdVisible(id))) {
      await scrollToId(id, this.selectCryptoScrollViewId);
    }
    await tapById(id);
  }

  @Step("Select currency in receive list")
  async selectCurrencyByType(currencyType: TokenType): Promise<void> {
    const id = this.currencyNameIdByRegex(currencyType.toLowerCase());
    console.log("id: ", id);
    if (!(await IsIdVisible(id))) {
      await scrollToId(id, this.selectCryptoScrollViewId);
    }
    await tapById(id);
  }

  @Step("Select assets")
  async selectAsset(assetText: string): Promise<void> {
    const id = this.currencySubtitleId(assetText);
    await tapById(id);
  }

  @Step("Select network")
  async selectNetwork(networkId: string): Promise<void> {
    //not MAD:
    const id = this.currencyNameId(networkId);
    //Mad:
    //const id = this.networkItemIdMAD(networkId);
    // if (!(await IsIdVisible(id))) {
    //   await scrollToId(id, this.networkSelectionScrollViewId);
    // }
    await tapById(id);
  }

  @Step("Expect second step accounts")
  async expectSecondStepAccounts() {
    await detoxExpect(this.step2HeaderTitle()).toBeVisible();
    await detoxExpect(this.step2Accounts()).toBeVisible();
  }

  @Step("Select network in list if needed")
  async selectNetworkIfAsked(networkId: string): Promise<void> {
    //not MAD:
    const id = this.networkBasedStep2HeaderTitleId;
    //MAD:
    //const id = this.networkBasedTitleIdMAD;
    if (await IsIdVisible(id)) {
      await this.selectNetwork(networkId);
    }
  }

  @Step("Accept to verify address")
  async selectVerifyAddress(): Promise<void> {
    await waitForElementById(this.buttonVerifyAddressId);
    await tapById(this.buttonVerifyAddressId);
  }

  @Step("Get the fresh address displayed")
  async getFreshAddressDisplayed(): Promise<string> {
    await waitForElementById(this.accountFreshAddress);
    return await getTextOfElement(this.accountFreshAddress);
  }

  @Step("Expect number of account in list is displayed")
  async expectNumberOfAccountInListIsDisplayed(
    currencyName: string,
    accountNumber: number,
  ): Promise<void> {
    const plural = accountNumber > 1 ? "s" : "";
    const accountCountText = `${accountNumber} account${plural}`;
    const networkRowID = new RegExp(this.currencyRowId(".*"));
    const accountNameID = this.currencyNameId(currencyName);
    const accountCountID = this.currencySubtitleId(accountCountText);

    await detoxExpect(
      element(
        by
          .id(networkRowID)
          .withDescendant(by.id(accountNameID))
          .withDescendant(by.id(accountCountID)),
      ),
    ).toBeVisible();
  }

  @Step("Create account")
  async createAccount(): Promise<void> {
    await waitForElementById(this.buttonCreateAccountId);
    await tapById(this.buttonCreateAccountId);
  }

  @Step("Continue to create account")
  async continueCreateAccount(): Promise<void> {
    await waitForElementById(this.buttonContinueId);
    await tapById(this.buttonContinueId);
  }

  @Step("Expect account is created")
  async expectAccountIsCreated(accountName: string): Promise<void> {
    await waitForElementById(this.step2HeaderTitleId);
    await detoxExpect(getElementById(this.step2HeaderTitleId)).toBeVisible();
    await detoxExpect(getElementByText(accountName)).toBeVisible();
  }

  @Step("Select dont verify address")
  async selectDontVerifyAddress(): Promise<void> {
    await waitForElementById(this.noVerifyAddressButton);
    await tapById(this.noVerifyAddressButton);
  }

  @Step("Select reconfirm dont verify")
  async selectReconfirmDontVerify(): Promise<void> {
    await waitForElementById(this.noVerifyValidateButton);
    await tapById(this.noVerifyValidateButton);
  }

  @Step("Expect account receive page is displayed")
  async expectReceivePageIsDisplayed(tickerName: string, accountName: string): Promise<void> {
    const titleID = this.titleReceiveConfirmationPageId(tickerName);
    const accountNameID = this.accountNameReceiveId(accountName);
    const qrCodeContainerID = this.receiveQrCodeContainerId(accountName);
    await waitForElementById(this.accountAddress);
    await waitForElementById(titleID);
    await detoxExpect(getElementById(titleID)).toBeVisible();
    await detoxExpect(getElementById(accountNameID)).toBeVisible();
    await detoxExpect(getElementById(qrCodeContainerID)).toBeVisible();
  }

  @Step("Verify address")
  async verifyAddress(address: string): Promise<void> {
    await detoxExpect(getElementById(this.accountAddress)).toHaveText(address);
  }

  @Step("Expect given address is displayed on receive page")
  async expectAddressIsCorrect(address: string): Promise<void> {
    await detoxExpect(getElementById(this.accountAddress)).toHaveText(address);
  }

  @Step("Expect tron new address warning")
  async expectTronNewAddressWarning(): Promise<void> {
    const warnId = "tron-receive-newAddress-warning";
    const descId = `${warnId}-description`;
    const scrollView = this.receivePageScrollViewId;

    await scrollToId(warnId, scrollView);
    await detoxExpect(getElementById(warnId)).toBeVisible();
    await detoxExpect(getElementById(descId)).toHaveText(
      "You first need to send at least 0.1 TRX to this address to activate it.",
    );
  }

  @Step("Refuse to verify address")
  async doNotVerifyAddress(): Promise<void> {
    await this.selectDontVerifyAddress();
    await this.selectReconfirmDontVerify();
  }

  @Step("Expect device connection screen")
  async expectDeviceConnectionScreen(): Promise<void> {
    await waitForElementById(this.receiveConnectDeviceHeaderId);
    await detoxExpect(getElementById(this.receiveConnectDeviceHeaderId)).toHaveText(
      "Connect Device",
    );
  }
}
