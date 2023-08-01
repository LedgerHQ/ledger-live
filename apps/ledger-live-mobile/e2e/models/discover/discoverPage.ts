import { getElementById, openDeeplink, waitForElementByText } from "../../helpers";

const baseLink = "discover/";

export default class DiscoverPage {
  discoverBanner = () => getElementById("discover-banner");
  waitForSelectCrypto = () => waitForElementByText("Select crypto");

  async openViaDeeplink(discoverApps = "") {
    await openDeeplink(baseLink + discoverApps);
  }
}
