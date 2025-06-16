export default class CeloManageAssetsPage {
  titleId = "live-app-title";
  celoLockButton = "celo-lock-button";
  celoUnlockButton = "celo-unlock-button";
  celoWithdrawButton = "celo-withdraw-button";
  celoVoteButton = "celo-vote-button";
  celoActivateVoteButton = "celo-activate-vote-button";
  celoRevokeButton = "celo-revoke-button";

  title = () => getElementById(this.titleId);

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
    await detoxExpect(getElementById(this.celoLockButton)).toBeVisible();
    await detoxExpect(getElementById(this.celoUnlockButton)).toBeVisible();
    await detoxExpect(getElementById(this.celoWithdrawButton)).not.toBeVisible();
    await detoxExpect(getElementById(this.celoVoteButton)).toBeVisible();
    await detoxExpect(getElementById(this.celoActivateVoteButton)).not.toBeVisible();
    await detoxExpect(getElementById(this.celoRevokeButton)).not.toBeVisible();
  }
}
