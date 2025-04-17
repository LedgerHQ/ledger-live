import { expect } from "detox";
import { delay, openDeeplink } from "../../helpers/commonHelpers";
import type { NativeElement } from "detox/detox";
import { SwapType } from "@ledgerhq/live-common/e2e/models/Swap";

export default class SwapPage {
  baseLink = "swap";

  // make all the “locators” async
  async swapFormTab(): Promise<NativeElement> {
    return getElementById("swap-form-tab");
  }

  async swapHistoryTab(): Promise<NativeElement> {
    return getElementById("swap-history-tab");
  }

  async swapSourceSelector(): Promise<NativeElement> {
    return getElementById("swap-source-selector");
  }

  async swapDestinationSelector(): Promise<NativeElement> {
    return getElementById("swap-destination-selector");
  }

  async swapSourceInputTextbox(): Promise<NativeElement> {
    return getElementById("swap-source-amount-textbox");
  }

  async exchangeButton(): Promise<NativeElement> {
    return getElementById("exchange-button");
  }

  async exchangeScrollView(): Promise<NativeElement> {
    return getElementById("exchange-scrollView");
  }

  async chooseProviderButton(): Promise<NativeElement> {
    return getElementById("choose-provider-button");
  }

  async sendMaxToggle(): Promise<NativeElement> {
    return getElementById("exchange-send-max-toggle");
  }

  async termsAcceptButton(): Promise<NativeElement> {
    return getElementById("terms-accept-button");
  }

  async termsCloseButton(): Promise<NativeElement> {
    return getElementById("terms-close-button");
  }

  confirmSwapOnDeviceDrawerId = "confirm-swap-on-device";
  swapSuccessTitleId = "swap-success-title";

  async openViaDeeplink(): Promise<void> {
    await openDeeplink(this.baseLink);
  }

  async expectSwapPage(): Promise<void> {
    const tab = await this.swapFormTab();
    await expect(tab).toBeVisible();
  }

  async navigateToSwapForm(): Promise<void> {
    const tab = await this.swapFormTab();
    await tapByElement(tab);
  }

  async navigateToSwapHistory(): Promise<void> {
    const tab = await this.swapHistoryTab();
    await tapByElement(tab);
  }

  async openSourceAccountSelector(): Promise<void> {
    const sel = await this.swapSourceSelector();
    await tapByElement(sel);
  }

  async openDestinationAccountSelector(): Promise<void> {
    const sel = await this.swapDestinationSelector();
    await tapByElement(sel);
  }

  async selectAccount(accountText: string): Promise<void> {
    await tapByText(accountText);
  }

  async enterSourceAmount(amount: string): Promise<void> {
    const input = await this.swapSourceInputTextbox();
    await clearTextByElement(input);
    await typeTextByElement(input, amount);
  }

  async goToProviderSelection(): Promise<void> {
    const btn = await this.chooseProviderButton();
    await tapByElement(btn);
  }

  async chooseProvider(providerName: string): Promise<void> {
    await tapByText(providerName);
  }

  async sendMax(): Promise<void> {
    const toggle = await this.sendMaxToggle();
    await tapByElement(toggle);
  }

  async startExchange(): Promise<void> {
    const scroll = await this.exchangeScrollView();
    await scroll.scrollTo("bottom");
    const btn = await this.exchangeButton();
    await tapByElement(btn);
  }

  async expectNoMaxToggle(): Promise<void> {
    const toggle = await this.sendMaxToggle();
    await expect(toggle).not.toExist();
  }

  async expectTerms(): Promise<void> {
    const accept = await this.termsAcceptButton();
    const close = await this.termsCloseButton();
    await expect(accept).toBeVisible();
    await expect(close).toBeVisible();
  }

  @Step("Wait for device confirm drawer")
  async waitForDeviceConfirmDrawer(): Promise<boolean> {
    return await waitForElementById(this.confirmSwapOnDeviceDrawerId);
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
