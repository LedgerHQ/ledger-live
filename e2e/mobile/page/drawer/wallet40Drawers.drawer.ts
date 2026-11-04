import { Step } from "jest-allure2-reporter/api";
import { isAndroid } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

export default class Wallet40DrawersPage {
  private readonly analyticsConsentDrawer = byId("analytics-consent-drawer");
  private readonly analyticsConsentRefuseAllButton = byId(
    "analytics-consent-drawer-secondary-button",
  );

  @Step("Close analytics consent drawer if visible")
  async closeAnalyticsConsentDrawerIfVisible(timeout = TIMEOUT.xxsmall): Promise<boolean> {
    if (await this.analyticsConsentRefuseAllButton.isVisible(timeout)) {
      await this.analyticsConsentRefuseAllButton.tap();
      await this.analyticsConsentRefuseAllButton.waitNotVisible();
      return true;
    }

    if (await this.analyticsConsentDrawer.isVisible(timeout)) {
      await this.analyticsConsentRefuseAllButton.tap(timeout);
      await this.analyticsConsentDrawer.waitNotVisible();
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
