import { getElementById, openDeeplink, waitForElementByText } from "../../helpers";
import { expect } from "detox";

const baseLink = "discover/";

export default class DiscoveryPage {
  getDiscoveryBanner = () => getElementById("discover-banner");
  waitForSelectCrypto = () => waitForElementByText("Select crypto");

  async openViaDeeplink(discoverApps = "") {
    await openDeeplink(baseLink + discoverApps);
  }

  async expectDiscoveryPage() {
    await expect(this.getDiscoveryBanner()).toBeVisible();
  }
}
