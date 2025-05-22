import { Drawer } from "tests/component/drawer.component";

export class OperationDrawer extends Drawer {
  readonly dateValue = this.page.getByTestId("operation-date");
  readonly amountLabel = this.page.getByText("Amount", { exact: true });
  readonly transactionType = this.page.getByTestId("transaction-type");
  readonly accountName = this.page.getByTestId("account-name");
}
