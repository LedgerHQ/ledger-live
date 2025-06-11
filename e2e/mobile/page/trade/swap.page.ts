import { delay, isIos, isSpeculosRemote, openDeeplink } from "../../helpers/commonHelpers";
import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";

export default class SwapPage {
  baseLink = "swap";
  confirmSwapOnDeviceDrawerId = "confirm-swap-on-device";
  swapSuccessTitleId = "swap-success-title";
  deviceActionLoading = "device-action-loading";

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

  @Step("Wait for swap success and continue")
  async waitForSuccessAndContinue() {
    await waitForElementById(this.swapSuccessTitleId);
    await tapById(app.common.proceedButtonId);
  }

  async delayDeviceActionLoadingCheck() {
    //ISSUE: LIVE-19300
    await delay(isSpeculosRemote() && isIos() ? 45_000 : 20_000);
  }
}
