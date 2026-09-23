import { cardManagementApi } from "@domain/api-card-management";
import { documentedPayCardTransaction } from "@domain/api-card-management/mock/card-transactions";
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

  it("counts the cached transactions, which the endpoint holds in pages", () => {
    // The endpoint is an infinite query, so its cache entry is `{ pages }`. Handing that straight
    // to the analytics property counts no transactions at all and `has_tx` silently goes false.
    const withOnePage = {
      ...unsigned,
      [cardManagementApi.reducerPath]: {
        queries: {
          "getCardTransactions(undefined)": {
            status: "fulfilled",
            data: { pages: [[documentedPayCardTransaction]], pageParams: [0] },
          },
        },
      },
    };

    expect(getPayAttributes(withOnePage, true, ["USDC"])).toEqual(
      expect.objectContaining({ has_tx: true }),
    );
  });
});
