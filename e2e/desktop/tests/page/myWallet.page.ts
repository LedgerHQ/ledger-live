import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { expect } from "@playwright/test";

export class MyWalletPage extends AppPage {
  private readonly avatar = this.page.getByTestId("my-wallet-avatar");
  private readonly popoverActionsList = this.page.getByTestId("my-wallet-actions-list");
  private readonly recoverTile = this.page.getByTestId("my-wallet-action-recover");
  private readonly helpTile = this.page.getByTestId("my-wallet-action-help");
  private readonly referralTile = this.page.getByTestId("my-wallet-action-refer");
  private readonly settingsButtonInPopover = this.page.getByTestId("topbar-action-button-settings");
  private readonly modalCloseButton = this.page.getByTestId("modal-close-button");

  @step("Open My Wallet popover from avatar")
  async openMyWalletPopover() {
    await this.avatar.click();
    await expect(this.popoverActionsList).toBeVisible();
  }

  @step("Click Backup (Recover) tile")
  async clickRecoverTile() {
    await this.recoverTile.click();
  }

  @step("Click Referral tile")
  async clickReferralTile() {
    await this.referralTile.click();
  }

  @step("Click Help tile")
  async clickHelpTile() {
    await this.helpTile.click();
  }

  @step("Click Settings from My Wallet popover")
  async clickSettingsFromPopover() {
    await this.settingsButtonInPopover.click();
  }

  @step("Expect Ledger Recover discovery modal to be displayed")
  async expectRecoverDiscoveryModalDisplayed() {
    await expect(this.modalCloseButton).toBeVisible();
  }

  @step("Close Ledger Recover discovery modal")
  async closeRecoverDiscoveryModal() {
    await this.modalCloseButton.click();
    await expect(this.modalCloseButton).toBeHidden();
  }

  @step("Expect Referral live app to be loaded")
  async expectReferralLiveAppLoaded() {
    await expect(this.page).toHaveURL(/\/refer(?:-a-friend)?(?:\/|$|\?)/);
  }

  @step("Expect Help section to be displayed")
  async expectHelpSectionDisplayed() {
    await expect(this.page).toHaveURL(/\/settings\/help(?:\/|$|\?)/);
  }

  @step("Expect Settings page to be displayed")
  async expectSettingsPageDisplayed() {
    await expect(this.page).toHaveURL(/\/settings(?:\/|$|\?)/);
  }
}
