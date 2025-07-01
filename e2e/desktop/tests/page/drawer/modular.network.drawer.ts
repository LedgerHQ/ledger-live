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
  async selectNetwork(currency?: Currency, networkIndex: number = 0) {
    const isNetworkDrawerVisible = await this.isNetworkDrawerVisible();
    if (isNetworkDrawerVisible && currency) {
      const networks = currency.networks;
      if (networks && networks.length > 0) {
        const selectedNetwork = networks[networkIndex] || networks[0];
        await this.networkItemByName(selectedNetwork).first().click();
      } else {
        await this.networkItemByName(currency.speculosApp.name).first().click();
      }
    } else if (isNetworkDrawerVisible) {
      await this.selectFirstNetwork();
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
}
