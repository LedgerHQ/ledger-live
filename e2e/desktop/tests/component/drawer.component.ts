import { Component } from "../page/abstractClasses";
import { step } from "../misc/reporters/step";

export class Drawer extends Component {
  readonly content = this.page.getByTestId("drawer-content");
  readonly drawerOverlay = this.page.locator("[data-testid='drawer-overlay'][style='opacity: 1;']");
  private closeButton = this.page.getByTestId("drawer-close-button").first();

  @step("Wait for drawer to be visible")
  async waitForDrawerToBeVisible() {
    await this.content.waitFor({ state: "visible" });
    await this.closeButton.waitFor({ state: "visible" });
    await this.drawerOverlay.waitFor({ state: "attached" });
  }

  @step("Close drawer")
  async closeDrawer() {
    await this.closeButton.click();
  }
}
