import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { FF_CONTACTS_ENABLED, FF_PAY_TAB } from "@e2e/utils/featureFlagUtils";

const TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

setTeamOwner(Team.WALLET_XP);
TAGS.forEach(tag => $Tag(tag));

describe.skip("Pay tab", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "wallet40-many-stablecoins",
      featureFlags: {
        ...FF_PAY_TAB,
        ...FF_CONTACTS_ENABLED,
      },
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  it("Pay tab opens with a funded stablecoin balance and the signed-in card", async () => {
    await app.mainNavigation.tapWallet40Tab("paytab");
    await app.payTab.expectFundedBalance();
    await app.payTab.expectDetailsButton();
  });
});
