import { getElementById, waitForElementById, tapById } from "../../helpers";
import { expect } from "detox";

export default class ManageAssetsPage {
  titleId = "live-app-title";
  title = () => getElementById(this.titleId);
  celoLockButton = "celo-lock-button";
  celoUnlockButton = "celo-unlock-button";
  celoWithdrawButton = "celo-withdraw-button";
  celoVoteButton = "celo-vote-button";
  celoActivateVoteButton = "celo-activate-vote-button";
  celoRevokeButton = "celo-revoke-button";

  async isOpened() {
    await expect(this.title()).toBeVisible();
  }

  @Step("Wait for manage assets")
  async waitForManageAssets() {
    await waitForElementById(this.titleId);
  }

  @Step("Click on Lock for CELO delegation")
  async clickCeloLock() {
    await tapById(this.celoLockButton);
  }

  @Step("Check celoManagePage")
  async checkCeloManagePage() {
    await this.waitForManageAssets();
    await expect(getElementById(this.celoLockButton)).toBeVisible();
    await expect(getElementById(this.celoUnlockButton)).toBeVisible();
    await expect(getElementById(this.celoWithdrawButton)).not.toBeVisible();
    await expect(getElementById(this.celoVoteButton)).toBeVisible();
    await expect(getElementById(this.celoActivateVoteButton)).not.toBeVisible();
    await expect(getElementById(this.celoRevokeButton)).not.toBeVisible();
  }
}
