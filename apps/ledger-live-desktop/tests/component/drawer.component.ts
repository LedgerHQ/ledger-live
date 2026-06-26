import { Component } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";

export class Drawer extends Component {
  readonly content = this.page.getByTestId("drawer-content");
  readonly modularDialog = this.page.getByRole("dialog");
  private drawerOverlay = this.page.locator("[data-testid='drawer-overlay'][style='opacity: 1;']");
  private continueButton = this.page.getByTestId("drawer-continue-button");
  private closeButton = this.page.getByTestId("drawer-close-button").first();

  readonly selectAssetTitle = this.page.getByText("Select asset").first();
  readonly selectNetworkTitle = this.page.getByText("Select network").first();
  readonly selectAccountTitle = this.page.getByText("Select account").first();
  readonly assetSearchInput = this.page.getByTestId("modular-asset-dialog-search-input");
  readonly backButton = this.page.getByRole("button", {
    name: /^(Back|Go back)$/i,
  });

  private assetRows = this.page.getByTestId(/^asset-item-ticker-/);
  private networkRows = this.page.getByTestId(/^network-item-name-/);
  private accountRows = this.page.getByTestId(/^account-row-/);

  async continue() {
    await this.continueButton.click();
  }

  @step("Wait for drawer to be visible")
  async waitForDrawerToBeVisible() {
    await Promise.race([
      this.content.waitFor({ state: "visible" }),
      this.modularDialog.waitFor({ state: "visible" }),
    ]);

    if (await this.content.isVisible()) {
      await this.closeButton.waitFor({ state: "visible" });
      await this.drawerOverlay.waitFor({ state: "attached" });
    }
  }

  @step("Wait for asset/account selector to be visible")
  async waitForAssetAccountSelectorVisible() {
    await this.modularDialog.waitFor({ state: "visible" });
  }

  @step("Wait for account selection step")
  async waitForAccountSelectionStep() {
    await this.modularDialog.waitFor({ state: "visible" });
    await this.selectFirstNetworkIfPresent();
    await this.selectAccountTitle.waitFor({ state: "visible" });
  }

  async waitForDrawerToDisappear() {
    await Promise.all([
      this.continueButton.waitFor({ state: "detached" }).catch(() => undefined),
      this.closeButton.waitFor({ state: "detached" }).catch(() => undefined),
      this.drawerOverlay.waitFor({ state: "detached" }).catch(() => undefined),
      this.modularDialog.waitFor({ state: "hidden" }).catch(() => undefined),
    ]);
  }

  @step("Close drawer")
  async closeDrawer() {
    if (await this.modularDialog.isVisible()) {
      await this.page.keyboard.press("Escape");
      await this.modularDialog.waitFor({ state: "hidden" });
      return;
    }

    await this.closeButton.click();
  }

  @step("Select asset $0")
  async selectCurrency(currency: string) {
    const assetRow = this.assetRows.filter({ hasText: currency }).first();
    await assetRow.waitFor({ state: "visible" });
    await assetRow.click();
    await this.selectNetworkIfPresent(currency);
  }

  @step("Select network $0")
  async selectNetwork(network: string) {
    const networkRow = this.networkRows.filter({ hasText: network }).first();
    await networkRow.waitFor({ state: "visible" });
    await networkRow.click();
  }

  getAccountButton = (accountName: string) =>
    this.page.getByTestId(`account-row-${accountName}`).first();

  @step("Select account $0")
  async selectAccount(accountName: string, index = 0) {
    await this.accountRows.first().waitFor({ state: "visible" });
    const namedRow = this.getAccountButton(accountName);
    const accountRow = (await namedRow.count()) > 0 ? namedRow : this.accountRows.nth(index);
    await accountRow.click();
  }

  back() {
    return this.backButton.click();
  }

  private async isNetworkStep() {
    return this.selectNetworkTitle.isVisible().catch(() => false);
  }

  private async selectNetworkIfPresent(network: string) {
    if (await this.isNetworkStep()) {
      await this.selectNetwork(network);
    }
  }

  private async selectFirstNetworkIfPresent() {
    if (await this.isNetworkStep()) {
      const firstNetwork = this.networkRows.first();
      await firstNetwork.waitFor({ state: "visible" });
      await firstNetwork.click();
    }
  }
}
