import { getElementById } from "../../helpers";
import { ScreenName } from "../../../src/const";

export default class WalletTabNavigatorPage {
  getNftGalleryTab = () =>
    getElementById(`wallet_tab_${ScreenName.WalletNftGallery}`);
}
