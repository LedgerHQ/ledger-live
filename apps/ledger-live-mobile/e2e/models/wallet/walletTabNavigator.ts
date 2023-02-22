import { getElementById, tapByElement } from "../../helpers";
import { ScreenName } from "../../../src/const";

export default class WalletTabNavigatorPage {
  nftGalleryTab = () =>
    getElementById(`wallet-tab-${ScreenName.WalletNftGallery}`);

  async navigateToNftGallery() {
    await tapByElement(this.nftGalleryTab());
  }
}
