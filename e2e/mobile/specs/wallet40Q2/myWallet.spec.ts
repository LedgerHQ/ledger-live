import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "helpers/allure/allure-helper";
import { FF_LWM_WALLET_40_Q2 } from "utils/featureFlagUtils";

const testConfig = {
  tmsLinks: ["B2CQA-5405", "B2CQA-5426", "B2CQA-5427"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 Q2- MyWallet", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "speculos-x-other-account",
      featureFlags: FF_LWM_WALLET_40_Q2,
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  beforeEach(async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
  });

  testConfig.tmsLinks.forEach(link => $TmsLink(link));
  testConfig.tags.forEach(tag => $Tag(tag));

  it("should open My Wallet from Portfolio and from Earn", async () => {
    await app.mainNavigation.expectPortfolioPageVisible();
    await app.myWallet.openFromTopBar();
    await app.myWallet.tapHeaderBack();

    await app.mainNavigation.expectPortfolioPageVisible();

    await app.mainNavigation.tapWallet40Tab("earn");
    await app.mainNavigation.expectEarnPageVisible();
    await app.myWallet.openFromTopBar();
  });

  it("should access Help from My Wallet", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.myWallet.openFromTopBar();
    await app.myWallet.tapHelp();
    await app.myWallet.expectHelpScreenVisible();
  });

  it("should access Settings from My Wallet", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.myWallet.openFromTopBar();
    await app.myWallet.tapHeaderSettings();
    await app.myWallet.expectSettingsScreenVisible();
  });
});
