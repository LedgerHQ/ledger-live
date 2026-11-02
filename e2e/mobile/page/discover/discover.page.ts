import { randomInt } from "node:crypto";
import { Step } from "jest-allure2-reporter/api";
import { log } from "detox";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";

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
  private readonly baseLink = "discover/";
  private readonly discoverPageHeader = byId("discover-banner");
  private readonly liveAppTitle = byId("live-app-title");
  private readonly catalogSearchBar = byId("platform-catalog-search-input");
  private readonly catalogSearchCancelButton = byId("catalog-search-cancel");
  private readonly catalogAppCard = (appName: DiscoverAppName) =>
    byId(new RegExp(`catalog-app-card-${appName.trim().toLowerCase()}.*`));

  @Step("Get live App")
  getRandomLiveApp(): DiscoverAppName {
    const pool = discoverApps.filter(a => !randomPoolExcludedApps.has(a.name));
    const app = pool[randomInt(0, pool.length)].name;
    log.info(`Selected Live app: ${app}`);
    return app;
  }

  @Step("Open discover page via deeplink {{{0}}}")
  async openViaDeeplink(appName?: DiscoverAppName) {
    await openDeeplink(this.baseLink + (appName ?? ""));
  }

  private getAppUrl(name: DiscoverAppName) {
    const app = discoverApps.find(a => a.name === name)!;
    return app.url;
  }

  @Step("Expect live app title {{{0}}}")
  async expectApp(app: DiscoverAppName) {
    // space is required as it is part of the element text
    await this.liveAppTitle.expectText(` ${this.getAppUrl(app)}`);
  }

  @Step("Expect discover page")
  async expectDiscoverPage() {
    await this.discoverPageHeader.expectVisible();
  }

  @Step("Type in catalog search bar {{{0}}}")
  async typeInCatalogSearchBar(text: string) {
    await this.catalogSearchBar.replaceText(text);
  }

  @Step("Tap catalog search cancel button")
  async tapCatalogSearchCancel() {
    await this.catalogSearchCancelButton.tap();
  }

  @Step("Expect catalog app card {{{0}}}")
  async expectCatalogAppCard(appName: DiscoverAppName) {
    await this.catalogAppCard(appName).expectVisible();
  }
}
