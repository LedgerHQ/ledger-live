const testConfig = {
  tmsLinks: ["B2CQA-2869", "B2CQA-2870"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

describe("Wallet Page", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "speculos-tests-app",
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  testConfig.tmsLinks.forEach(link => $TmsLink(link));
  testConfig.tags.forEach(tag => $Tag(tag));
  it("Portfolio Assets Tab - LLM", async () => {
    await app.portfolio.checkAssetAllocationSection();
  });
});
