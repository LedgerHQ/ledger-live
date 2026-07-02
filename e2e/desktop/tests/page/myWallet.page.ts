import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";
import { expect } from "@playwright/test";

export class MyWalletPage extends AppPage {
  private readonly avatarTrigger = this.page.getByRole("button", { name: "My Wallet" });
  private readonly popoverActionsList = this.page.getByTestId("my-wallet-actions-list");
  private readonly myWalletPopover = this.page
    .getByRole("dialog")
    .filter({ has: this.popoverActionsList });
  private readonly recoverTile = this.myWalletPopover.getByTestId("my-wallet-action-recover");
  private readonly helpTile = this.myWalletPopover.getByTestId("my-wallet-action-help");
  private readonly referralTile = this.myWalletPopover.getByTestId("my-wallet-action-refer");
  private readonly settingsButtonInPopover = this.myWalletPopover.getByTestId(
    "topbar-action-button-settings",
  );
  private readonly notificationButtonInPopover = this.myWalletPopover.getByTestId(
    "topbar-action-button-notifications",
  );
  private readonly myLedgerItemInPopover = this.myWalletPopover.getByTestId("my-wallet-my-ledger");
  private readonly modalCloseButton = this.page.getByTestId("modal-close-button");

  @step("Open My Wallet popover from avatar")
  async openMyWalletPopover() {
    if (!(await this.popoverActionsList.isVisible())) {
      await this.avatarTrigger.click();
    }
    await expect(this.popoverActionsList).toBeVisible();
  }

  @step("Expect My Wallet popover to be closed")
  async waitForMyWalletPopoverToClose() {
    await expect(this.popoverActionsList).toBeHidden();
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

  @step("Click Notifications from My Wallet popover")
  async clickNotificationsFromPopover() {
    await this.notificationButtonInPopover.click();
  }

  @step("Click My Ledger from My Wallet popover")
  async clickMyLedgerFromPopover() {
    await this.myLedgerItemInPopover.click();
    await this.waitForMyWalletPopoverToClose();
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
