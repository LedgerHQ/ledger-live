import { Step } from "jest-allure2-reporter/api";

export default class CeloManageAssetsPage {
  titleId = "live-app-title";
  celoLockButton = "enabled-celo-lock-button";
  celoUnlockButton = "enabled-celo-unlock-button";
  celoWithdrawButton = "disabled-celo-withdraw-button";
  celoVoteButton = "enabled-celo-vote-button";
  celoActivateVoteButton = /^(enabled|disabled)-celo-activate-vote-button$/;
  celoRevokeButton = /^(enabled|disabled)-celo-revoke-button$/;
  celoVoteStartButton = "enabled-celo-vote-start-button";

  title = () => getElementById(this.titleId);

  @Step("Wait for CELO manage assets")
  async waitForManageAssets() {
    await waitForElementById(this.titleId);
  }

  @Step("Click on Lock for CELO delegation")
  async clickLock() {
    await tapById(this.celoLockButton);
  }

  @Step("Click on Vote for CELO")
  async clickVote() {
    await tapById(this.celoVoteButton);
  }

  @Step("Click start on the CELO vote started screen")
  async clickVoteStart() {
    await tapById(this.celoVoteStartButton);
  }

  @Step("Check manage assets page - CELO")
  async checkManagePage() {
    await this.waitForManageAssets();
    await detoxExpect(getElementById(this.celoLockButton)).toBeVisible();
    await detoxExpect(getElementById(this.celoUnlockButton)).toBeVisible();
    await detoxExpect(getElementById(this.celoWithdrawButton)).toBeVisible();
    await detoxExpect(getElementById(this.celoVoteButton)).toBeVisible();
    await detoxExpect(getElementById(this.celoActivateVoteButton)).toBeVisible();
    await detoxExpect(getElementById(this.celoRevokeButton)).toBeVisible();
  }
}
