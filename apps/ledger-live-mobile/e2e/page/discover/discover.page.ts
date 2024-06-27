import { getElementById, openDeeplink, waitForElementByText } from "../../helpers";
import { expect } from "detox";

const baseLink = "discover/";

export default class DiscoverPage {
  waitForSelectCrypto = () => waitForElementByText("Select crypto");
  discoverPageHeader = () => getElementById("discover-banner");
  liveAppTitle = () => getElementById("live-app-title");

  async openViaDeeplink(discoverApps = "") {
    await openDeeplink(baseLink + discoverApps);
  }

  async expectUrl(url: string) {
    await expect(this.liveAppTitle()).toHaveText(url);
  }

  async expectDiscoverPage() {
    await expect(this.discoverPageHeader()).toBeVisible();
  }
}
