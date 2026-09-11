import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { FF_LWM_WALLET_40_Q2 } from "@e2e/utils/featureFlagUtils";

const testConfig = {
  tmsLinks: ["B2CQA-4350", "B2CQA-4343"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

setTeamOwner(Team.WALLET_XP);
describe("Portfolio without account", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      featureFlags: FF_LWM_WALLET_40_Q2,
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  testConfig.tmsLinks.forEach(link => $TmsLink(link));
  testConfig.tags.forEach(tag => $Tag(tag));

  it("Portfolio zero balance state shows quick actions", async () => {
    await app.portfolio.checkQuickActionTransferButtonVisibility();
    await app.portfolio.checkQuickActionSwapButtonVisibility();
    await app.portfolio.checkQuickActionBuyButtonVisibility();
    await app.portfolio.checkNoBalanceTitleVisibility();
  });
});
