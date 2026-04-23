import { step } from "../../misc/reporters/step";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Dialog } from "../../component/dialog.component";
import { expect } from "@playwright/test";

export class ModularNetworkDialog extends Dialog {
  private networkSelectorListContainer = this.page
    .getByTestId("modular-dialog-screen-NETWORK_SELECTION")
    .first();
  private networkItemByName = (name: string) => this.page.getByTestId(`network-item-name-${name}`);

  @step("Select a network by name")
  async selectNetwork(currency: Currency, networkIndex: number = 0) {
    const networkName = currency.networks[networkIndex] ?? currency.networks[0];
    const networkItem = this.networkItemByName(networkName).first();

    await expect
      .poll(
        async () => {
          if (await networkItem.isVisible()) {
            return true;
          } else {
            // item is not visible, scroll the list to lazy-load more
            await this.networkSelectorListContainer.hover();
            await this.page.mouse.wheel(0, 100);
            return false;
          }
        },
        {
          intervals: [500],
          message: `Could not find '${networkName}' in the network selection dialog`,
        },
      )
      .toBe(true);

    await networkItem.click();
  }

  @step("Check if network dialog is visible")
  async isNetworkDialogVisible() {
    return await this.networkSelectorListContainer.isVisible();
  }
}
