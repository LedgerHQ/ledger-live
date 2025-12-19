import { Step } from "jest-allure2-reporter/api";
import { log } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class DiscoverPage {
  discoverApps = [
    // for some reason there is a space before the URL so this is required
    { name: "MoonPay", url: " https://www.moonpay.com/" },
    { name: "Ramp", url: " https://ramp.network/buy" },
    { name: "ParaSwap", url: " https://paraswap.io" },
    { name: "Kiln", url: " https://kiln.fi" },
    { name: "Lido", url: " https://lido.fi/" },
    { name: "1inch", url: " https://1inch.com/" },
    { name: "BTCDirect", url: " https://btcdirect.eu/" },
    { name: "Banxa", url: " https://banxa.com/" },
    { name: "Bitrefill", url: " https://bitrefill.com" },
    { name: "Zerion", url: " https://zerion.io/" },
    { name: "Yearn", url: " https://beta.yearn.fi" },
    { name: "Transak", url: " https://transak.com" },
  ];
  baseLink = "discover/";
  discoverPageHeader = () => getElementById("discover-banner");
  liveAppTitle = () => getElementById("live-app-title");

  @Step("Get live App")
  getRandomLiveApp() {
    const app = this.discoverApps[Math.floor(Math.random() * this.discoverApps.length)].name;
    log.info(`Selected Live app: ${app}`);
    return app;
  }

  @Step("Open discover page via deeplink")
  async openViaDeeplink(discoverApps = "") {
    await openDeeplink(this.baseLink + discoverApps);
  }

  getAppUrl(name: string) {
    const app = this.discoverApps.find(app => app.name === name);
    return app ? app.url : "App not found";
  }

  @Step("Expect live app title")
  async expectApp(app: string) {
    await detoxExpect(this.liveAppTitle()).toHaveText(this.getAppUrl(app));
  }

  @Step("Expect discover page")
  async expectDiscoverPage() {
    await detoxExpect(this.discoverPageHeader()).toBeVisible();
  }
}
