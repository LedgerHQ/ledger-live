import {
  getElementById,
  openDeeplink,
  waitForElementByText,
} from "../../helpers";
import { expect } from "detox";

let baseLink: string = "discover/";

export default class DiscoveryPage {
  getDicoveryBanner = () => getElementById("discover-banner");
  waitForSelectCrypto = () => waitForElementByText("Select crypto");

  async openViaDeeplink(discoverApps: string = "") {
    await openDeeplink(baseLink + discoverApps);
  }

  async expectDiscoveryPage() {
    await expect(this.getDicoveryBanner()).toBeVisible();
  }
}
