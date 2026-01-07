import { step } from "../../misc/reporters/step";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Drawer } from "../../component/drawer.component";

export class ModularNetworkDrawer extends Drawer {
  private networkSelectorListContainer = this.page
    .getByTestId("modular-drawer-screen-NETWORK_SELECTION")
    .first();
  private networkItemByName = (name: string) => this.page.getByTestId(`network-item-name-${name}`);
  private firstNetworkItem = this.page.locator("[data-testid^='network-item-name-']").first();

  @step("Select a network by name")
  async selectNetwork(currency: Currency, networkIndex: number = 0) {
    await this.networkItemByName(currency.networks[networkIndex] ?? currency.networks[0])
      .first()
      .click();
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
