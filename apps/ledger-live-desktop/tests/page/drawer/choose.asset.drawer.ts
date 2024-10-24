import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";

export class ChooseAssetDrawer extends Drawer {
  private searchInput = this.page.getByTestId("select-asset-drawer-search-input");
  private currencyRow = (currencyName: string) =>
    this.page.getByTestId(`currency-row-${currencyName.toLowerCase()}`);

  @step("Choose asset to swap from: $0")
  async chooseFromAsset(currency: string) {
    await this.searchInput.fill(currency);
    await this.currencyRow(currency).first().click();
  }
}
