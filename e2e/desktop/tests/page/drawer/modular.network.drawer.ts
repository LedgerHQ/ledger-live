import { step } from "../../misc/reporters/step";
import { Component } from "../abstractClasses";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

export class ModularNetworkDrawer extends Component {
  private networkSelectorListContainer = this.page
    .getByTestId("modular-network-selection-container")
    .first();
  private networkItemByName = (name: string) => this.page.getByTestId(`network-item-name-${name}`);
  private firstNetworkItem = this.page.locator("[data-testid^='network-item-name-']").first();

  @step("Select a network by name")
  async selectNetwork(currency?: Currency) {
    const isNetworkDrawerVisible = await this.isNetworkDrawerVisible();
    if (isNetworkDrawerVisible) {
      if (currency?.id) {
        await this.networkItemByName(this.toSentenceCase(currency.id)).first().click();
      } else {
        await this.selectFirstNetwork();
      }
    }
  }

  @step("Select the first available network")
  async selectFirstNetwork() {
    await this.firstNetworkItem.click();
  }

  @step("Check if network drawer is visible")
  async isNetworkDrawerVisible() {
    return await this.networkSelectorListContainer.isVisible();
  }

  toSentenceCase(str: string): string {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  }
}
