import { expect, log, waitFor } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";

export default class DiscoverPage {
  discoverApps = [
    // for some reason there is a space before the URL so this is required
    { name: "MoonPay", url: " https://www.moonpay.com/" },
    { name: "Ramp", url: " https://ramp.network/buy" },
    { name: "ParaSwap", url: " https://paraswap.io" },
    { name: "Kiln", url: " https://kiln.fi" },
    { name: "Lido", url: " https://lido.fi/" },
    { name: "1inch", url: " https://1inch.io/" },
    { name: "BTCDirect", url: " https://btcdirect.eu/" },
    { name: "Banxa", url: " https://banxa.com/" },
    { name: "Bitrefill", url: " https://bitrefill.com" },
    { name: "Zerion", url: " https://zerion.io/" },
    { name: "Rainbow", url: " https://rainbow.me" },
    { name: "POAP", url: " https://app.poap.xyz/" },
    { name: "Yearn", url: " https://beta.yearn.finance" },
    { name: "ChangeNOW", url: " https://changenow.io/" },
    { name: "Transak", url: " https://transak.com" },
  ];
  baseLink = "discover/";
  waitForSelectCrypto = () => waitForElementByText("Select crypto");
  discoverPageHeader = () => getElementById("discover-banner");
  liveAppTitle = () => getElementById("live-app-title");

  getRandomLiveApp() {
    const app = this.discoverApps[Math.floor(Math.random() * this.discoverApps.length)].name;
    log.info(`Selected Live app: ${app}`);
    return app;
  }

  getAppUrl(name: string) {
    const app = this.discoverApps.find(app => app.name === name);
    return app ? app.url : "App not found";
  }

  async openViaDeeplink(discoverApps = "") {
    await openDeeplink(this.baseLink + discoverApps);
  }

  async expectApp(app: string) {
    await expect(await this.liveAppTitle()).toHaveText(this.getAppUrl(app));
  }

  async expectDiscoverPage() {
    await expect(await this.discoverPageHeader()).toBeVisible();
  }

  async expect1inchParams() {
    const title = await getWebElementById("__next").getTitle();
    jestExpect(title).toBe("Ledger Platform Apps");

    const url = await getWebElementById("__next").getCurrentUrl();
    jestExpect(url).toContain("app.1inch.io");
    jestExpect(url).toContain("usdt");
    jestExpect(url).toContain("sourceTokenAmount%3D");
    jestExpect(url).toContain("currency%22%3A%22ethereum");
    jestExpect(url).toContain("accountId=d9d1d396-2081-53e1-9c67-f0623e0c4d3a");

    await expect(getWebElementByTag("iframe")).toExist();
  }
}
