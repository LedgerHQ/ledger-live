import {
  getElementById,
  getElementByText,
  openDeeplink,
  waitForElementByText,
} from "../../helpers";
import { expect } from "detox";

const baseLink = "discover/";

export default class DiscoverPage {
  discoverBanner = () => getElementById("discover-banner");
  waitForSelectCrypto = () => waitForElementByText("Select crypto");
  discoverPageHeader = () => getElementByText("Discover");

  async openViaDeeplink(discoverApps = "") {
    await openDeeplink(baseLink + discoverApps);
  }

  async expectUrl(url: string) {
    await expect(getElementByText(url)).toBeVisible();
  }

  async expectDiscoverPage() {
    await expect(this.discoverPageHeader()).toBeVisible();
  }
}
