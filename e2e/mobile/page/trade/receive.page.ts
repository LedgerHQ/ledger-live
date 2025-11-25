import { currencyParam, openDeeplink } from "../../helpers/commonHelpers";
import { TokenType } from "@ledgerhq/live-common/lib/e2e/enum/TokenType";
import { ReceiveFundsOptionsType } from "@ledgerhq/live-common/e2e/enum/ReceiveFundsOptions";
export default class ReceivePage {
  accountAddress = "receive-fresh-address";
  accountFreshAddress = "receive-verifyAddress-freshAdress";
  baseLink = "receive";
  buttonContinueId = "add-accounts-continue-button";
  buttonVerifyAddressId = "button-verify-my-address";
  networkBasedStep2HeaderTitleId = "addAccounts-header-step2-title";
  noVerifyAddressButton = "button-DontVerify-my-address";
  noVerifyValidateButton = "button-confirm-dont-verify";
  receiveConnectDeviceHeaderId = "receive-connect-device-header";
  receivePageScrollViewId = "receive-screen-scrollView";
  selectCryptoScrollViewId = "select-crypto-scrollView";

  accountNameReceiveId = (t: string) => `receive-account-name-${t}`;
  currencyNameId = (t: string) => `big-currency-name-${t}`;
  currencyNameIdByRegex = (type: string) => new RegExp(`big-currency-name-.*\\/${type}\\/.*`);
  receiveFundsOptionId = (receiveFundsOption: ReceiveFundsOptionsType) =>
    `option-button-content-${receiveFundsOption}`;
  receiveQrCodeContainerId = (t: string) => `receive-qr-code-container-${t}`;
  titleReceiveConfirmationPageId = (t: string) => `receive-confirmation-title-${t}`;

  @Step("Open receive via deeplink")
  async openViaDeeplink(): Promise<void> {
    await openDeeplink(this.baseLink);
  }

  @Step("Receive via deeplink")
  async receiveViaDeeplink(currencyLong?: string): Promise<void> {
    const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
    await openDeeplink(link);
  }

  @Step("Select currency in receive list")
  async selectCurrency(currencyName: string): Promise<void> {
    const id = this.currencyNameId(currencyName.toLowerCase());
    if (!(await IsIdVisible(id))) {
      await scrollToId(id, this.selectCryptoScrollViewId);
    }
    await tapById(id);
  }

  @Step("Select currency in receive list")
  async selectCurrencyByType(currencyType: TokenType): Promise<void> {
    const id = this.currencyNameIdByRegex(currencyType.toLowerCase());
    if (!(await IsIdVisible(id))) {
      await scrollToId(id, this.selectCryptoScrollViewId);
    }
    await tapById(id);
  }

  @Step("Select network")
  async selectNetwork(networkId: string): Promise<void> {
    const id = this.currencyNameId(networkId);
    await tapById(id);
  }

  @Step("Select network in list if needed")
  async selectNetworkIfAsked(networkId: string): Promise<void> {
    const id = this.networkBasedStep2HeaderTitleId;
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

  @Step("Continue to create account")
  async continueCreateAccount(): Promise<void> {
    await waitForElementById(this.buttonContinueId);
    await tapById(this.buttonContinueId);
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

  @Step("Select receive funds option")
  async selectReceiveFundsOption(receiveFundsOption: ReceiveFundsOptionsType): Promise<void> {
    await waitForElementById(this.receiveFundsOptionId(receiveFundsOption));
    await tapById(this.receiveFundsOptionId(receiveFundsOption));
  }
}
