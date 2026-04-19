import { initDeeplinkSuite } from "./initDeeplinkSuite";

$TmsLink("B2CQA-1837");
describe("DeepLinks — discover & market", () => {
  beforeAll(async () => {
    await initDeeplinkSuite();
  });

  it("should open the Discover page", async () => {
    await app.discover.openViaDeeplink();
    await app.discover.expectDiscoverPage();
  });

  it(`should open discovery to random live App`, async () => {
    // Opening only one random liveApp to avoid flakiness
    const randomLiveApp = app.discover.getRandomLiveApp();
    await app.discover.openViaDeeplink(randomLiveApp);
    await app.discover.expectApp(randomLiveApp);
  });

  it("should open Market Detail page for Bitcoin", async () => {
    await app.market.openViaDeeplink("bitcoin");
    await app.market.expectMarketDetailPage();
  });
});
