import {
  getElementById,
  openDeeplink,
  tapByText,
  typeTextByElement,
  waitForElementByText,
} from "../../helpers";
import { expect } from "detox";

const baseLink = "discover/";

export default class DiscoveryPage {
  discoverBanner = () => getElementById("discover-banner");
  waitForSelectCrypto = () => waitForElementByText("Select crypto");
  catalogSearchBar = () => getElementById("platform-catalog-search-input");
  dappDisclaimerButton = () => getElementById("dapp-disclaimer-button");
  appCard = (appId: string) => getElementById(`${appId}-app-card`);

  openViaDeeplink(discoverApps = "") {
    return openDeeplink(baseLink + discoverApps);
  }

  expectDiscoveryPage() {
    return expect(this.discoverBanner()).toBeVisible();
  }

  searchForApp(appName: string) {
    return typeTextByElement(this.catalogSearchBar(), appName);
  }

  navigateToLiveApp(appId: string) {
    return tapByText(appId);
  }

  continueToLiveApp() {
    return tapByText("Continue");
  }

  selectCurrencyFromDrawer(currencyName: string) {
    return tapByText(currencyName);
  }

  selectAccountFromDrawer(accountName: string) {
    return tapByText(accountName);
  }
}
