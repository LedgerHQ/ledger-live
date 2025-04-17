import { AppPage } from "tests/page/abstractClasses";

export class SwapPage extends AppPage {
  // Exchange Drawer Components
  readonly swapId = this.page.getByTestId("swap-id");
}
