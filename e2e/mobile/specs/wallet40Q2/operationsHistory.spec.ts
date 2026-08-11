import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "helpers/allure/allure-helper";
import { FF_LWM_WALLET_40_Q2 } from "utils/featureFlagUtils";

// TODO: temporary override until we implement a navigate to history on account page for Q2
const FF_OPERATION_HISTORY = {
  lwmWallet40: {
    ...FF_LWM_WALLET_40_Q2.lwmWallet40,
    params: {
      ...FF_LWM_WALLET_40_Q2.lwmWallet40.params,
      aggregatedAssets: false,
    },
  },
};

setTeamOwner(Team.WALLET_XP);
$TmsLink("B2CQA-5256");
$TmsLink("B2CQA-5263");
$TmsLink("B2CQA-5266");
const tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];
tags.forEach(tag => $Tag(tag));

const ACCOUNT = Account.ETH_1;
const CURRENCY = ACCOUNT.currency;

describe("Operations history", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "speculos-x-other-account",
      featureFlags: FF_OPERATION_HISTORY,
    });
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible(10_000);
    await app.mainNavigation.waitForWallet40Ready();
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible();
  });

  it("Open transaction history from the top bar", async () => {
    await app.mainNavigation.tapTopBarTransactionHistory();
    await app.operation.expectOperationsListVisible();
    await app.operation.expectSectionHeaderVisible();
    await app.operation.expectOperationItemVisible();
  });

  it("Navigate to operation details from a transaction row", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarTransactionHistory();
    await app.operation.expectOperationsListVisible();
    await app.operation.tapFirstOperationItem();
    await app.operationDetails.checkTransactionDetailsVisibility();
  });

  it("Open transaction history from an asset page", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.portfolio.goToAccounts(CURRENCY.name);
    await app.common.pressOnSeeAllOperationsButtonFromAssetPage();
    await app.operation.expectOperationsListVisible();
  });
});
