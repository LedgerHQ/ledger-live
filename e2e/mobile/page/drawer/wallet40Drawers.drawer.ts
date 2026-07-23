import { by, element, waitFor } from "detox";
import { Step } from "jest-allure2-reporter/api";
import { delay, isAndroid } from "../../helpers/commonHelpers";
import {
  QUICK_VISIBILITY_PROBE_TIMEOUT,
  VISIBILITY_PROBE_TIMEOUT,
} from "../../helpers/elementHelpers";

export default class Wallet40DrawersPage {
  walletV4TourCloseButtonId = "drawer-close-button";
  productTourCloseButtonId = "product-tour-close-button";
  walletV4TourFirstSlideTitle = "A clearer view of your portfolio";
  walletV4TourNextButtonText = "Next";
  walletV4TourCompleteButtonText = "Discover my new portfolio";
  wallet40DrawerMountDelayMs = 1500;
  analyticsConsentDrawerId = "analytics-consent-drawer";
  analyticsConsentRefuseAllButtonId = "analytics-consent-drawer-secondary-button";
  closeButtonLabel = "Close";

  // The Wallet 4.0 onboarding/product tour can mount over the portfolio at startup and block interactions.
  // Dismiss it via whatever affordance is present: close-button id, "Close" label, or stepping through the tour.
  @Step("Close Wallet 4.0 tour if visible")
  async closeWalletV4TourIfVisible(timeout = VISIBILITY_PROBE_TIMEOUT): Promise<boolean> {
    if (await this.isTextVisible(this.walletV4TourFirstSlideTitle, timeout)) {
      if (await IsIdVisible(this.walletV4TourCloseButtonId, QUICK_VISIBILITY_PROBE_TIMEOUT)) {
        await tapById(this.walletV4TourCloseButtonId);
        await waitForElementNotVisible(this.walletV4TourCloseButtonId);
        return true;
      }

      if (await this.tapCloseButtonByLabelIfVisible()) {
        return true;
      }

      await this.tapTextIfVisible(this.walletV4TourNextButtonText);
      await this.tapTextIfVisible(this.walletV4TourNextButtonText);
      await this.tapTextIfVisible(this.walletV4TourCompleteButtonText);
      return true;
    }

    if (await IsIdVisible(this.walletV4TourCloseButtonId, timeout)) {
      await tapById(this.walletV4TourCloseButtonId);
      await waitForElementNotVisible(this.walletV4TourCloseButtonId);
      return true;
    }

    if (await IsIdVisible(this.productTourCloseButtonId, QUICK_VISIBILITY_PROBE_TIMEOUT)) {
      await tapById(this.productTourCloseButtonId);
      await waitForElementNotVisible(this.productTourCloseButtonId);
      return true;
    }

    return await this.tapCloseButtonByLabelIfVisible();
  }

  @Step("Close analytics consent drawer if visible")
  async closeAnalyticsConsentDrawerIfVisible(timeout = VISIBILITY_PROBE_TIMEOUT): Promise<boolean> {
    if (await IsIdVisible(this.analyticsConsentRefuseAllButtonId, timeout)) {
      await tapById(this.analyticsConsentRefuseAllButtonId);
      await waitForElementNotVisible(this.analyticsConsentRefuseAllButtonId);
      return true;
    }

    if (await IsIdVisible(this.analyticsConsentDrawerId, timeout)) {
      await waitForElementById(this.analyticsConsentRefuseAllButtonId, timeout);
      await tapById(this.analyticsConsentRefuseAllButtonId);
      await waitForElementNotVisible(this.analyticsConsentDrawerId);
      return true;
    }
    return false;
  }

  @Step("Close Wallet 4.0 blocking drawers if visible")
  async closeWallet40BlockingDrawersIfVisible(timeout = VISIBILITY_PROBE_TIMEOUT) {
    // Android can expose the topbar before queued Wallet 4.0 drawers finish mounting.
    if (isAndroid()) await delay(this.wallet40DrawerMountDelayMs);

    const drawerTimeout = isAndroid() ? timeout : QUICK_VISIBILITY_PROBE_TIMEOUT;

    await this.closeWalletV4TourIfVisible(QUICK_VISIBILITY_PROBE_TIMEOUT);
    await this.closeAnalyticsConsentDrawerIfVisible(drawerTimeout);
    await this.closeWalletV4TourIfVisible(QUICK_VISIBILITY_PROBE_TIMEOUT);
    await this.closeAnalyticsConsentDrawerIfVisible(QUICK_VISIBILITY_PROBE_TIMEOUT);
  }

  private async isTextVisible(text: string, timeout = VISIBILITY_PROBE_TIMEOUT): Promise<boolean> {
    try {
      await waitFor(element(by.text(text)))
        .toBeVisible()
        .withTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async tapTextIfVisible(text: string): Promise<void> {
    if (await this.isTextVisible(text, VISIBILITY_PROBE_TIMEOUT)) {
      await element(by.text(text)).tap();
      await delay(300);
    }
  }

  private async tapCloseButtonByLabelIfVisible(): Promise<boolean> {
    try {
      const closeButton = element(by.label(this.closeButtonLabel)).atIndex(0);
      await waitFor(closeButton).toBeVisible().withTimeout(QUICK_VISIBILITY_PROBE_TIMEOUT);
      await closeButton.tap();
      await waitFor(closeButton).not.toBeVisible().withTimeout(VISIBILITY_PROBE_TIMEOUT);
      return true;
    } catch {
      return false;
    }
  }
}
