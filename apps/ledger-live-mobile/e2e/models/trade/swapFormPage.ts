import { getElementById, openDeeplink } from "../../helpers";

const baseLink = "swap";

export default class SwapFormPage {
  swapFormTab = () => getElementById("swap-form-tab");
  swapHistoryTab = () => getElementById("swap-history-tab");

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  // async expectSwapFormPage() {
  //   await expect(this.swapFormTab());
  // }
}
