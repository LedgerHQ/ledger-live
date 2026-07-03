import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { FF_LWM_WALLET_40_Q2 } from "utils/featureFlagUtils";

setTeamOwner(Team.WALLET_XP);
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
      featureFlags: FF_LWM_WALLET_40_Q2,
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
    await app.portfolio.goToAccounts(CURRENCY.name);
    await app.common.pressOnSeeAllOperationsButton();
    await app.operation.expectOperationsListVisible();
  });
});
