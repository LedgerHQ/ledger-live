import { randomInt } from "node:crypto";
import { Step } from "jest-allure2-reporter/api";
import { log } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";

const discoverApps = [
  { name: "MoonPay", url: "https://www.moonpay.com/" },
  { name: "Ramp", url: "https://rampnetwork.com/buy-crypto" },
  { name: "Kiln-Widget", url: "https://ledger-defi.widget.kiln.fi/earn" },
  { name: "Lido", url: "https://lido.fi/" },
  { name: "1inch", url: "https://1inch.com" },
  { name: "Zerion", url: "https://zerion.io/" },
  { name: "Transak", url: "https://transak.com" },
] as const;

export type DiscoverAppName = (typeof discoverApps)[number]["name"];

const randomPoolExcludedApps = new Set<DiscoverAppName>(["1inch", "Kiln-Widget"]);

export default class DiscoverPage {
  discoverApps = discoverApps;
  baseLink = "discover/";
  discoverPageHeader = () => getElementById("discover-banner");
  liveAppTitle = () => getElementById("live-app-title");
  // TODO - remove `or` statement when wallet40 is fully activated
  catalogSearchArrowLeft = () => getElementById(/catalog-back-arrow|catalog-search-arrow-left/);
  catalogSearchBar = () => getElementById("platform-catalog-search-input");
  catalogSearchCancelButton = () => getElementById("catalog-search-cancel");
  catalogAppCard = (appName: DiscoverAppName) =>
    getElementById(new RegExp(`catalog-app-card-${appName.trim().toLowerCase()}.*`));

  @Step("Get live App")
  getRandomLiveApp(): DiscoverAppName {
    const pool = this.discoverApps.filter(a => !randomPoolExcludedApps.has(a.name));
    const app = pool[randomInt(0, pool.length)].name;
    log.info(`Selected Live app: ${app}`);
    return app;
  }

  @Step("Open discover page via deeplink")
  async openViaDeeplink(appName?: DiscoverAppName) {
    await openDeeplink(this.baseLink + (appName ?? ""));
  }

  getAppUrl(name: DiscoverAppName) {
    const app = this.discoverApps.find(app => app.name === name)!;
    return app.url;
  }

  @Step("Expect live app title")
  async expectApp(app: DiscoverAppName) {
    // space is required as it is part of the element text
    await detoxExpect(this.liveAppTitle()).toHaveText(` ${this.getAppUrl(app)}`);
  }

  @Step("Expect discover page")
  async expectDiscoverPage() {
    await detoxExpect(this.discoverPageHeader()).toBeVisible();
  }

  @Step("Type in catalog search bar")
  async typeInCatalogSearchBar(text: string) {
    await typeTextByElement(this.catalogSearchBar(), text);
  }

  @Step("Go back from catalog search")
  async goBackFromCatalogSearch() {
    await tapByElement(this.catalogSearchArrowLeft());
  }

  @Step("Expect catalog app card")
  async expectCatalogAppCard(appName: DiscoverAppName) {
    await detoxExpect(this.catalogAppCard(appName)).toBeVisible();
  }
}
