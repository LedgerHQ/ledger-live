import { Step } from "jest-allure2-reporter/api";
import { isAndroid } from "@e2e/helpers/commonHelpers";
import { TIMEOUT } from "@e2e/utils/timeouts";

export const ANALYTICS_CONSENT_DRAWER_ID = "analytics-consent-drawer";
export const ANALYTICS_CONSENT_REFUSE_ALL_BUTTON_ID = "analytics-consent-drawer-secondary-button";

export default class Wallet40DrawersPage {
  analyticsConsentDrawerId = ANALYTICS_CONSENT_DRAWER_ID;
  analyticsConsentRefuseAllButtonId = ANALYTICS_CONSENT_REFUSE_ALL_BUTTON_ID;

  @Step("Close analytics consent drawer if visible")
  async closeAnalyticsConsentDrawerIfVisible(timeout = TIMEOUT.xxsmall): Promise<boolean> {
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
  async closeWallet40BlockingDrawersIfVisible(timeout = TIMEOUT.xxsmall) {
    const drawerTimeout = isAndroid() ? timeout : TIMEOUT.xxxsmall;
    await this.closeAnalyticsConsentDrawerIfVisible(drawerTimeout);
  }
}
