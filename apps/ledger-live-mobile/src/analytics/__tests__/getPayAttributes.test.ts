import { getPayAttributes } from "../getPayAttributes";

describe("getPayAttributes", () => {
  const unsigned = {
    payCardAuth: { hasCard: false, status: "signedOut" },
  };

  it("should send only featureFlagPay when the Pay flag is off", () => {
    expect(getPayAttributes(unsigned, false, ["USDC"])).toEqual({ featureFlagPay: false });
  });

  it("should send Pay user properties when the Pay flag is on", () => {
    expect(getPayAttributes(unsigned, true, ["USDC"])).toEqual(
      expect.objectContaining({
        featureFlagPay: true,
        hasStable: true,
        hasCard: false,
        cardLoggedIn: false,
        cardRewardCurrency: null,
      }),
    );
  });
});
