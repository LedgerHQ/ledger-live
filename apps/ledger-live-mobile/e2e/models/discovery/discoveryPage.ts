import { getElementById, openDeeplink, tapByElement, waitForElementByText } from "../../helpers";
import { expect } from "detox";

const baseLink = "discover/";

export default class DiscoveryPage {
  getDicoveryBanner = () => getElementById("discover-banner");
  waitForSelectCrypto = () => waitForElementByText("Select crypto");
  appCard = (appId: string) => getElementById(`${appId}-app-card`);

  async openViaDeeplink(discoverApps = "") {
    await openDeeplink(baseLink + discoverApps);
  }

  async expectDiscoveryPage() {
    await expect(this.getDicoveryBanner()).toBeVisible();
  }

  async navigateToLiveApp(appId: string) {
    await tapByElement(this.appCard(appId));
  }
}
