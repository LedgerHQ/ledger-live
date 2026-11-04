import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";

export default class CeloManageAssetsPage {
  private readonly title = byId("live-app-title");
  private readonly celoLockButton = byId("enabled-celo-lock-button");
  private readonly celoUnlockButton = byId("enabled-celo-unlock-button");
  private readonly celoWithdrawButton = byId("disabled-celo-withdraw-button");
  private readonly celoVoteButton = byId("enabled-celo-vote-button");
  private readonly celoActivateVoteButton = byId(/^(enabled|disabled)-celo-activate-vote-button$/);
  private readonly celoRevokeButton = byId(/^(enabled|disabled)-celo-revoke-button$/);

  @Step("Wait for CELO manage assets")
  async waitForManageAssets() {
    await this.title.waitVisible();
  }

  @Step("Click on Lock for CELO delegation")
  async clickLock() {
    await this.celoLockButton.tap();
  }

  @Step("Click on Vote for CELO")
  async clickVote() {
    await this.celoVoteButton.tap();
  }

  @Step("Check manage assets page - CELO")
  async checkManagePage() {
    await this.waitForManageAssets();
    await this.celoLockButton.expectVisible();
    await this.celoUnlockButton.expectVisible();
    await this.celoWithdrawButton.expectVisible();
    await this.celoVoteButton.expectVisible();
    await this.celoActivateVoteButton.expectVisible();
    await this.celoRevokeButton.expectVisible();
  }
}
