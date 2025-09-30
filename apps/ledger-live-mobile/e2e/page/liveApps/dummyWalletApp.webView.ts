import { startLiveApp, stopServer } from "../../models/liveApps";
import DiscoverPage from "../discover/discover.page";

const port = 52619;

export default class DummyWalletApp {
  /**
   * Helper function to type text into an input field and verify it was set correctly
   * @param testId - The test ID of the input element
   * @param value - The value to type and verify
   */
  private async typeAndVerifyInput(testId: string, value: string) {
    await typeTextByWebTestId(testId, value);
    const text = await getWebElementValue(testId);
    jestExpect(text).toBe(value);
  }

  async startApp() {
    const continueTest = await startLiveApp("dummy-wallet-app", port);
    // Check that dummy app in tests/dummy-app-build has been started successfully
    jestExpect(continueTest).toBeTruthy();
  }

  async openApp() {
    await new DiscoverPage().openViaDeeplink("dummy-live-app");
  }

  async expectApp(theme: string = "light") {
    const title = await getWebElementById("image-container").getTitle();
    jestExpect(title).toBe("Dummy Wallet API App");

    const url = await getWebElementById("param-container").getCurrentUrl();
    jestExpect(url).toBe(
      `http://localhost:${port}/?theme=${theme}&lang=en&name=Dummy+Wallet+API+Live+App`,
    );
  }

  async clearStates() {
    await getWebElementByTestId("clear-states").tap();
  }

  async sendRequest() {
    await this.typeAndVerifyInput("currency-ids-input", "ethereum,bitcoin");
    await tapWebElementByTestId("account-request");
  }

  async sendAccountReceive() {
    await this.typeAndVerifyInput("account-id-input", "2d23ca2a-069e-579f-b13d-05bc706c7583");
    await tapWebElementByTestId("account-receive");
  }

  async signTransaction(
    accountId: string,
    currencyIds: string[],
    amount: string,
    recipientAddress: string,
  ) {
    await this.typeAndVerifyInput("account-id-input", accountId);
    await this.typeAndVerifyInput("currency-ids-input", currencyIds.join(","));
    await this.typeAndVerifyInput("amount-input", amount);
    await this.typeAndVerifyInput("recipient-input", recipientAddress);
    await tapWebElementByTestId("transaction-sign");
  }

  async transactionSign() {
    await tapWebElementByTestId("transaction-sign");
  }

  async transactionSignSolana() {
    await tapWebElementByTestId("transaction-sign-solana");
  }

  async transactionSignRawSolana() {
    await tapWebElementByTestId("transaction-sign-raw-solana");
  }

  async setAccountId(accountId: string) {
    await this.typeAndVerifyInput("account-id-input", accountId);
  }

  async setRecipient(recipient: string) {
    await this.typeAndVerifyInput("recipient-input", recipient);
  }

  async setAmount(amount: string) {
    await this.typeAndVerifyInput("amount-input", amount);
  }

  async setData(data: string) {
    await this.typeAndVerifyInput("data-input", data);
  }

  async setMessage(message: string) {
    await this.typeAndVerifyInput("message-input", message);
  }

  async messageSign() {
    await tapWebElementByTestId("message-sign");
  }

  async getResOutput() {
    const res = await getWebElementText("res-output");
    return JSON.parse(res);
  }

  async stopApp() {
    await stopServer();
  }
}
