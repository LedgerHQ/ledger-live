import { expect } from "detox";

export default class CeloManageAssetsPage {
  titleId = "live-app-title";
  title = () => getElementById(this.titleId);
  celoLockButton = "celo-lock-button";
  celoUnlockButton = "celo-unlock-button";
  celoWithdrawButton = "celo-withdraw-button";
  celoVoteButton = "celo-vote-button";
  celoActivateVoteButton = "celo-activate-vote-button";
  celoRevokeButton = "celo-revoke-button";

  @Step("Wait for CELO manage assets")
  async waitForManageAssets() {
    await waitForElementById(this.titleId);
  }

  @Step("Click on Lock for CELO delegation")
  async clickLock() {
    await tapById(this.celoLockButton);
  }

  @Step("Check manage assets page - CELO")
  async checkManagePage() {
    await this.waitForManageAssets();
    await expect(await getElementById(this.celoLockButton)).toBeVisible();
    await expect(await getElementById(this.celoUnlockButton)).toBeVisible();
    await expect(await getElementById(this.celoWithdrawButton)).not.toBeVisible();
    await expect(await getElementById(this.celoVoteButton)).toBeVisible();
    await expect(await getElementById(this.celoActivateVoteButton)).not.toBeVisible();
    await expect(await getElementById(this.celoRevokeButton)).not.toBeVisible();
  }
}
