import { delay, isIos, isSpeculosRemote, openDeeplink } from "../../helpers/commonHelpers";
import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";

export default class SwapPage {
  baseLink = "swap";
  confirmSwapOnDeviceDrawerId = "confirm-swap-on-device";
  swapSuccessTitleId = "swap-success-title";
  deviceActionLoading = "device-action-loading";
  amountReceived = "amountReceived";
  fees = "fees";
  amountSent = "amountSent";
  sourceAccount = "sourceAccount";
  targetAccount = "targetAccount";
  swapProvider = "provider";

  swapFormTab = () => getElementById("swap-form-tab");

  @Step("Open swap via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Expect swap page")
  async expectSwapPage() {
    const tab = this.swapFormTab();
    await detoxExpect(tab).toBeVisible();
  }

  @Step("Verify the amounts and accept swap")
  async verifyAmountsAndAcceptSwap(swap: SwapType, amount: string) {
    await waitForElementById(this.confirmSwapOnDeviceDrawerId);
    await app.speculos.verifyAmountsAndAcceptSwap(swap, amount);
    await this.delayDeviceActionLoadingCheck();
    await waitForElementNotVisible(this.deviceActionLoading);
  }

  @Step("Verify the amounts and reject swap")
  async verifyAmountsAndRejectSwap(swap: SwapType, amount: string) {
    await waitForElementById(this.confirmSwapOnDeviceDrawerId);
    await app.speculos.verifyAmountsAndRejectSwap(swap, amount);
    await this.delayDeviceActionLoadingCheck();
    await waitForElementNotVisible(this.deviceActionLoading);
  }

  @Step("Wait for swap success and continue")
  async waitForSuccessAndContinue() {
    await waitForElementById(this.swapSuccessTitleId);
    await tapById(app.common.proceedButtonId);
  }
  async delayDeviceActionLoadingCheck() {
    //ISSUE: LIVE-19300
    await delay(isSpeculosRemote() && isIos() ? 45_000 : 20_000);
  }

  @Step("Get amount to receive")
  async getAmountToReceive() {
    return (await getTextOfElement(this.amountReceived)).trim();
  }

  @Step("Get fees")
  async getFees() {
    return (await getTextOfElement(this.fees)).trim();
  }

  @Step("Verify amount to receive: $0")
  async verifyAmountToReceive(amount: string) {
    const received = (await getTextOfElement(this.amountReceived)).replace(/\s/g, "");
    const expected = amount.replace(/\s/g, "");
    jestExpect(received).toBe(expected);
  }

  @Step("Verify amount to send: $0 $1")
  async verifyAmountSent(amount: string, currency: string) {
    const received = (await getTextOfElement(this.amountSent)).replace(/\s/g, "");
    const expected = `${amount} ${currency}`.replace(/\s/g, "");
    jestExpect(received).toBe(expected);
  }

  @Step("Verify source currency: $0")
  async verifySourceAccount(sourceCurrency: string) {
    jestExpect((await getTextOfElement(this.sourceAccount)).trim()).toMatch(sourceCurrency);
  }

  @Step("Verify target currency: $0")
  async verifyTargetCurrency(targetCurrency: string) {
    jestExpect((await getTextOfElement(this.targetAccount)).trim()).toMatch(targetCurrency);
  }

  @Step("Verify provider: $0")
  async verifyProvider(provider: string) {
    jestExpect((await getTextOfElement(this.swapProvider)).trim()).toMatch(provider);
  }
}
