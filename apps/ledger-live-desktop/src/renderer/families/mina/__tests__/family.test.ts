import family from "../index";
import Delegation from "../Delegation";

describe("mina family registration", () => {
  it("registers the staking members consumed by the account view", () => {
    expect(family.accountHeaderManageActions).toBeDefined();
    expect(family.AccountBalanceSummaryFooter).toBeDefined();
    expect(family.StakeBanner).toBeDefined();
  });

  it("exposes the delegation section as the account body header", () => {
    expect(family.AccountBodyHeader).toBe(Delegation);
  });
});
