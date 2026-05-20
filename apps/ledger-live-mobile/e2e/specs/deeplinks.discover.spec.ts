import { initDeeplinksMockApp } from "./deeplinksFlow.shared";

$TmsLink("B2CQA-1837");
describe("DeepLinks Tests — Discover", () => {
  beforeAll(async () => {
    await initDeeplinksMockApp();
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
});
