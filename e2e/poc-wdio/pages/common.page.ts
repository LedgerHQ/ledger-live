import { getByTestId } from "../components/appiumSelector";

export class CommonPage {
  // components
  get proceedButton() {
    return getByTestId("proceed-button");
  }

  // steps
  async tapProceed() {
    await this.proceedButton.tap();
  }
}
