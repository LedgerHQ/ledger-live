import { getElementById, tapByElement } from "../../helpers";
import { ScreenName } from "../../../src/const";

export default class WalletTabNavigatorPage {
  getNftGalleryTab = () =>
    getElementById(`wallet-tab-${ScreenName.WalletNftGallery}`);
  navigateToNftGallery = () => tapByElement(this.getNftGalleryTab());
}
