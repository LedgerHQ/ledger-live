import { step } from "tests/misc/reporters/step";
import { Drawer } from "tests/component/drawer.component";

export class ChooseAccountDrawer extends Drawer {
  private accountRow = (accountName: string) =>
    this.page.getByTestId(`account-row-${accountName.toLowerCase()}`);

  @step("Select account: $0")
  async selectAccount(accountName: string) {
    await this.accountRow(accountName).click();
  }
}
