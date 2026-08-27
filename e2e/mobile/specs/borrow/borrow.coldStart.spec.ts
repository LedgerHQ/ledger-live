import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { FF_BORROW_ENABLED } from "@e2e/utils/featureFlagUtils";

describe("Borrow - Cold start", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "speculos-x-other-account",
      featureFlags: FF_BORROW_ENABLED,
    });
    await app.mainNavigation.openPortfolioViaDeeplink();
  });

  setTeamOwner(Team.EARN);
  $TmsLink("B2CQA-6062");
  ["@LNS", "@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"].forEach(tag => $Tag(tag));

  it("should show the Introducing Crypto Loan modal from the portfolio entry point", async () => {
    await app.portfolio.expectBorrowEntryPointVisible();
    await app.portfolio.clickBorrowEntryPoint();
    await app.borrow.expectBorrowScreenVisible();
    await app.borrow.expectIntroModal();
  });
});
