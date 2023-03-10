import { getElementById, openDeeplink } from "../../helpers";
import { expect } from "detox";

let baseLink: string = "swap";

export default class SwapFormPage {
  swapFormTab = () => getElementById("swap-form-tab");

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async expectSwapFormPage() {
    await expect(this.swapFormTab());
  }
}
