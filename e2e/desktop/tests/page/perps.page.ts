import { step } from "tests/misc/reporters/step";
import { WebViewAppPage } from "tests/page/webViewApp.page";
import { TIMEOUT } from "@ledgerhq/live-e2e-shared/timeouts";

export class PerpsPage extends WebViewAppPage {
  protected readonly webviewIdentifier = "perps";

  private readonly portfolioEntryPoint = this.page.getByTestId("portfolio-perps-subheader-row");
  private readonly sidebarBalance = "desktop-sidebar-balance";

  @step("Open Perps from the portfolio")
  async openFromPortfolio() {
    await this.portfolioEntryPoint.click();
  }

  @step("Verify the account is selected on the Perps home")
  async expectHome() {
    await this.verifyElementIsVisible(this.sidebarBalance, TIMEOUT.xxlarge);
  }
}
