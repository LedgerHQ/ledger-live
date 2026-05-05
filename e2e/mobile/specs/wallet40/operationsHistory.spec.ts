import { WALLET_40_FEATURE_FLAGS } from "../../utils/constants";

$TmsLink("B2CQA-5256");
$TmsLink("B2CQA-5263");
$TmsLink("B2CQA-5266");
const tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];
tags.forEach(tag => $Tag(tag));

const ACCOUNT = Account.ETH_1;
const CURRENCY = ACCOUNT.currency;

describe("Wallet 4.0 - Operations History", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "speculos-x-other-account",
      featureFlags: WALLET_40_FEATURE_FLAGS,
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  it("should open Tx History from the top bar clock icon", async () => {
    await app.mainNavigation.tapTopBarTransactionHistory();
    await app.operation.expectOperationsListVisible();
    await app.operation.expectSectionHeaderVisible();
    await app.operation.expectOperationItemVisible();
  });

  it("should navigate to operation details from a transaction row", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarTransactionHistory();
    await app.operation.expectOperationsListVisible();
    await app.operation.tapFirstOperationItem();
    await app.operationDetails.checkTransactionDetailsVisibility();
  });

  // This test will evolve later once the asset/address page is implemented in W40
  // For the moment, we are using the legacy account page to navigate to the transaction history
  it("should open Tx History from within an asset page", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.portfolio.goToAccountsW40(CURRENCY.name);
    await app.common.pressOnSeeAllOperationsButton();
    await app.operation.expectOperationsListVisible();
  });
});
