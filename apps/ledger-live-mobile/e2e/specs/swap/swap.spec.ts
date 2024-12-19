import { Application } from "../../page";

const app = new Application();

describe("Swap", () => {
  beforeAll(async () => {
    await app.init({ userdata: "1AccountBTC1AccountETHReadOnlyFalse" });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("should load the Swap page from the Transfer menu", async () => {
    await app.swap.openViaDeeplink();
    await app.swap.expectSwapPage();
  });

  it("should be able to select a different source account", async () => {
    await app.swap.openSourceAccountSelector();
    await app.swap.selectAccount("Bitcoin 1 (legacy)");
  });

  it("should show an error for too low an amount", async () => {
    await app.swap.enterSourceAmount("0.00001");
    // unfortunately there's no way to check if a button that is disabled in the JS is actually disabled on the native side (which is what Detox checks)
    // we tap the `Exchange` button to see if the next step fails as a way of checking if the exchange button disabled. If it proceeds then the button was incorrectly available and the next test will fail
    await app.swap.startExchange();
  });

  $TmsLink("B2CQA-545");
  it("should show an error for not enough funds", async () => {
    await app.swap.enterSourceAmount("10");
    await app.swap.startExchange();
  });

  it("should be able to select a different destination account", async () => {
    await app.swap.openDestinationAccountSelector();
    await app.swap.selectAccount("Ethereum");
  });

  it("should have the send max toggle switch removed", async () => {
    await app.swap.expectNoMaxToggle();
    await app.swap.openSourceAccountSelector();
    await app.swap.selectAccount("Bitcoin 1 (legacy)");
    await app.swap.enterSourceAmount("0.1");
    await app.swap.startExchange();
    await app.swap.expectTerms();
  });
});
