import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";
import { currencyParam, openDeeplink } from "@e2e/helpers/commonHelpers";

const TRON_NEW_ADDRESS_WARNING =
  "You first need to send at least 0.1 TRX to this address to activate it.";

export default class ReceivePage {
  private readonly baseLink = "receive";

  private readonly scrollView = byId("receive-screen-scrollView");
  private readonly accountAddress = byId("receive-fresh-address");
  private readonly freshAddress = byId("receive-verifyAddress-freshAdress");
  private readonly continueButton = byId("enabled-add-accounts-continue-button");
  private readonly verifyAddressButton = byId("button-verify-my-address");
  private readonly dontVerifyAddressButton = byId("button-DontVerify-my-address");
  private readonly confirmDontVerifyButton = byId("button-confirm-dont-verify");
  private readonly connectDeviceHeader = byId("receive-connect-device-header");
  private readonly networkWarning = byId("receive-network-warning");
  private readonly tronNewAddressWarning = byId("tron-receive-newAddress-warning");
  private readonly tronNewAddressWarningDescription = byId(
    "tron-receive-newAddress-warning-description",
  );
  private readonly deviceDeprecationTitle = byId("warning-deprecation-title");
  // Button prefixes its testID with enabled- or disabled-.
  private readonly deviceDeprecationContinueButton = byId(
    /^(enabled|disabled)-warning-deprecation-continue$/,
  );
  private readonly accountName = (name: string) => byId(`receive-account-name-${name}`);
  private readonly confirmationTitle = (ticker: string) =>
    byId(`receive-confirmation-title-${ticker}`);
  private readonly qrCodeContainer = (accountName: string) =>
    byId(`receive-qr-code-container-${accountName}`);

  @Step("Open receive via deeplink")
  async openViaDeeplink(): Promise<void> {
    await openDeeplink(this.baseLink);
  }

  @Step("Receive via deeplink {{{0}}}")
  async receiveViaDeeplink(currencyLong?: string): Promise<void> {
    const link = currencyLong ? this.baseLink + currencyParam + currencyLong : this.baseLink;
    await openDeeplink(link);
  }

  @Step("Accept to verify address")
  async selectVerifyAddress(): Promise<void> {
    await this.verifyAddressButton.tap();
  }

  @Step("Expect the device deprecation error screen {{{0}}}")
  async expectDeviceDeprecationError(expectedTitle: string): Promise<void> {
    // The device name is rendered with non-breaking spaces.
    await this.deviceDeprecationTitle.expectText(expectedTitle, { normaliseWhitespace: true });
    await this.deviceDeprecationContinueButton.expectNotExist();
  }

  @Step("Get the fresh address displayed")
  async getFreshAddressDisplayed(): Promise<string> {
    return await this.freshAddress.getText();
  }

  @Step("Continue to create account")
  async continueCreateAccount(): Promise<void> {
    await this.continueButton.tap();
  }

  @Step("Select dont verify address")
  async selectDontVerifyAddress(): Promise<void> {
    await this.dontVerifyAddressButton.tap();
  }

  @Step("Select reconfirm dont verify")
  async selectReconfirmDontVerify(): Promise<void> {
    await this.confirmDontVerifyButton.tap();
  }

  @Step("Expect receive page header {{{0}}} for {{{1}}}")
  private async expectReceivePageHeader(tickerName: string, accountName: string): Promise<void> {
    await this.accountAddress.waitVisible();
    await this.confirmationTitle(tickerName).waitVisible();
    await this.confirmationTitle(tickerName).expectVisible();
    await this.accountName(accountName).expectVisible();
  }

  @Step("Expect account receive page is displayed for {{{1}}} ({{{0}}})")
  async expectReceivePageIsDisplayed(tickerName: string, accountName: string): Promise<void> {
    const qrCodeContainer = this.qrCodeContainer(accountName);

    await this.expectReceivePageHeader(tickerName, accountName);
    await qrCodeContainer.scrollTo(this.scrollView);
    await qrCodeContainer.expectVisible();
  }

  @Step("Expect receive warning page is displayed for {{{1}}} ({{{0}}})")
  async expectReceiveWarningPageIsDisplayed(
    tickerName: string,
    accountName: string,
  ): Promise<void> {
    await this.expectReceivePageHeader(tickerName, accountName);
  }

  @Step("Verify address {{{0}}}")
  async verifyAddress(address: string): Promise<void> {
    await this.accountAddress.expectText(address);
  }

  @Step("Expect given address is displayed on receive page {{{0}}}")
  async expectAddressIsCorrect(address: string): Promise<void> {
    await this.accountAddress.expectText(address);
  }

  @Step("Expect tron new address warning")
  async expectTronNewAddressWarning(): Promise<void> {
    await this.tronNewAddressWarning.scrollTo(this.scrollView);
    await this.tronNewAddressWarning.expectVisible();
    await this.tronNewAddressWarningDescription.expectText(TRON_NEW_ADDRESS_WARNING);
  }

  @Step("Expect receive network warning message for {{{0}}}")
  async expectSendCurrencyTokensWarningMessage(expectedWarningMessage: string): Promise<void> {
    await this.networkWarning.scrollTo(this.scrollView);
    await this.networkWarning.expectVisible();
    await this.networkWarning.expectText(expectedWarningMessage);
  }

  @Step("Refuse to verify address")
  async doNotVerifyAddress(): Promise<void> {
    await this.selectDontVerifyAddress();
    await this.selectReconfirmDontVerify();
  }

  @Step("Expect device connection screen")
  async expectDeviceConnectionScreen(): Promise<void> {
    await this.connectDeviceHeader.waitVisible();
    await this.connectDeviceHeader.expectText("Connect Device");
  }
}
