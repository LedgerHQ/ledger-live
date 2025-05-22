import { expect } from "detox";
import { delay, openDeeplink } from "../../helpers/commonHelpers";
import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";

export default class SwapPage {
  baseLink = "swap";
  confirmSwapOnDeviceDrawerId = "confirm-swap-on-device";
  swapSuccessTitleId = "swap-success-title";

  swapFormTab = () => getElementById("swap-form-tab");

  @Step("Open swap via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Expect swap page")
  async expectSwapPage() {
    const tab = this.swapFormTab();
    await expect(tab).toBeVisible();
  }

  @Step("Verify the amounts and accept swap")
  async verifyAmountsAndAcceptSwap(swap: SwapType, amount: string) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 20_000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const isVisible = await IsIdVisible(this.confirmSwapOnDeviceDrawerId, 10_000);

      if (isVisible) {
        await app.speculos.verifyAmountsAndAcceptSwap(swap, amount);
        await delay(RETRY_DELAY_MS);

        const isNoLongerVisible = await waitForElementNotVisible(
          this.confirmSwapOnDeviceDrawerId,
          10_000,
        );

        if (isNoLongerVisible) {
          break;
        }
      } else {
        jestExpect(isVisible).toBeFalsy();
        break;
      }

      if (attempt === MAX_RETRIES) {
        jestExpect(isVisible).toBe(true);
      }
    }
  }

  @Step("Wait for swap success and continue")
  async waitForSuccessAndContinue() {
    await waitForElementById(this.swapSuccessTitleId, 30_000);
    await tapById(app.common.proceedButtonId);
  }
}
