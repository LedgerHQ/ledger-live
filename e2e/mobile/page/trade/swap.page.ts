import { expect } from "detox";
import { delay, openDeeplink } from "../../helpers/commonHelpers";
import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";

export default class SwapPage {
  baseLink = "swap";
  confirmSwapOnDeviceDrawerId = "confirm-swap-on-device";
  swapSuccessTitleId = "swap-success-title";

  swapFormTab = () => getElementById("swap-form-tab");
  sendMaxToggle = () => getElementById("exchange-send-max-toggle");

  @Step("Open swap via deeplink")
  async openViaDeeplink(): Promise<void> {
    await openDeeplink(this.baseLink);
  }

  @Step("Expect swap page")
  async expectSwapPage(): Promise<void> {
    const tab = await this.swapFormTab();
    await expect(tab).toBeVisible();
  }

  async sendMax(): Promise<void> {
    const toggle = await this.sendMaxToggle();
    await tapByElement(toggle);
  }

  @Step("Verify the amounts and accept swap")
  async verifyAmountsAndAcceptSwap(swap: SwapType, amount: string): Promise<void> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 20_000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const isVisible = await waitForElementById(this.confirmSwapOnDeviceDrawerId, 10_000);

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
  async waitForSuccessAndContinue(): Promise<void> {
    await waitForElementById(this.swapSuccessTitleId, 30_000);
    await tapById(app.common.proceedButtonId);
  }
}
