import { step } from "../../misc/reporters/step";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Dialog } from "../../component/dialog.component";

export class ModularNetworkDialog extends Dialog {
  private networkSelectorListContainer = this.page
    .getByTestId("modular-dialog-screen-NETWORK_SELECTION")
    .first();
  private networkItemByName = (name: string) => this.page.getByTestId(`network-item-name-${name}`);
  private firstNetworkItem = this.page.locator("[data-testid^='network-item-name-']").first();

  @step("Select a network by name")
  async selectNetwork(currency: Currency, networkIndex: number = 0) {
    const networkItem = this.networkItemByName(
      currency.networks[networkIndex] ?? currency.networks[0],
    ).first();
    await this.scrollUntilVisible(networkItem);
    await networkItem.click();
  }

  @step("Select the first available network")
  async selectFirstNetwork() {
    await this.firstNetworkItem.click();
  }

  @step("Check if network dialog is visible")
  async isNetworkDialogVisible() {
    return await this.networkSelectorListContainer.isVisible();
  }

  private async scrollUntilVisible(element: ReturnType<typeof this.page.locator>) {
    while (!(await element.isVisible())) {
      await this.page.mouse.wheel(0, 150);
    }
  }
}
