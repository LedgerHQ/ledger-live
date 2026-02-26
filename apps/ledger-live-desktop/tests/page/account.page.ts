import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";

export class AccountPage extends AppPage {
  readonly settingsButton = this.page.getByTestId("account-settings-button");
  private settingsDeleteButton = this.page.getByTestId("account-settings-delete-button");
  private settingsConfirmButton = this.page.getByTestId("modal-confirm-button");
  private buyButton = this.page.getByTestId("buy-button");
  private sellButton = this.page.getByTestId("sell-button");
  private stakeButton = this.page.getByTestId("stake-button");
  readonly stakeBanner = this.page.getByTestId("account-stake-banner");
  private stakeBannerButton = this.page.getByTestId("account-stake-banner-button");
  private sendButton = this.page.getByTestId("send-button");
  private receiveButton = this.page.getByTestId("receive-account-action-button");

  async navigateToBuy() {
    await this.buyButton.click();
  }

  async navigateToSell() {
    await this.sellButton.click();
  }

  @step("Click Stake button")
  async startStakingFlowFromMainStakeButton() {
    await this.stakeButton.click();
  }

  @step("Click Stake button on banner")
  async clickBannerCTA() {
    await this.stakeBannerButton.waitFor({ state: "attached" });
    await this.stakeBannerButton.scrollIntoViewIfNeeded();
    await this.stakeBannerButton.click();
  }

  @step("Scroll to operations")
  async scrollToOperations() {
    const operationList = this.page.locator("id=operation-list");
    // Wait for the operation list to be visible (not just attached) before scrolling.
    // React 19's concurrent rendering may temporarily attach/detach elements during re-renders
    // (e.g. after navigating to a token sub-account). "visible" ensures the element is stable.
    await operationList.waitFor({ state: "visible" });
    await operationList.scrollIntoViewIfNeeded();
  }

  @step("Delete account")
  async deleteAccount() {
    await this.settingsButton.click();
    await this.settingsDeleteButton.click();
    await this.settingsConfirmButton.click();
  }

  @step("Click Send button")
  async clickSend() {
    await this.sendButton.click();
  }

  @step("Click Receive button")
  async clickReceive() {
    await this.receiveButton.click();
  }

  @step("Navigate to token account")
  async navigateToToken(tokenTestId: string) {
    const tokenRow = this.page.getByTestId(tokenTestId);
    await tokenRow.waitFor({ state: "attached" });
    await tokenRow.click();
    // The token row belongs to the parent account page. Waiting for it to detach
    // guarantees React 19 has committed the new token sub-account page render,
    // so subsequent interactions target the new DOM — not a stale element mid-transition.
    await tokenRow.waitFor({ state: "detached" });
  }

  async operationRowByTestId(operationTestId: string) {
    const operationRow = this.page.getByTestId(operationTestId);
    // Wait for the operation row to be attached to the DOM before returning it.
    // React 19's concurrent rendering may temporarily detach elements during re-renders
    await operationRow.waitFor({ state: "attached" });
    return operationRow;
  }
}
