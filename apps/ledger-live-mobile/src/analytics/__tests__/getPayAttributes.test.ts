import { cardManagementApi } from "@domain/api-card-management";
import { mockPayCardCashback } from "@domain/api-card-management/mock/card-cashback";
import { documentedPayCardTransaction } from "@domain/api-card-management/mock/card-transactions";
import { getPayAttributes } from "../getPayAttributes";

describe("getPayAttributes", () => {
  const unsigned = {
    payCardAuth: { hasCard: false, status: "signedOut" },
  };
  const accountsWithUsdc = [
    {
      balance: { gt: () => false },
      currency: { ticker: "ETH" },
      subAccounts: [{ balance: { gt: () => true }, token: { ticker: "USDC" } }],
    },
  ];

  it("should send only featureFlagPay when the Pay flag is off", () => {
    expect(getPayAttributes(unsigned, false, accountsWithUsdc)).toEqual({ featureFlagPay: false });
  });

  it("should send Pay user properties when the Pay flag is on", () => {
    expect(getPayAttributes(unsigned, true, accountsWithUsdc)).toEqual({
      featureFlagPay: true,
      hasStable: true,
      hasCard: false,
      cardLoggedIn: false,
    });
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

    expect(getPayAttributes(withOnePage, true, accountsWithUsdc)).toEqual(
      expect.objectContaining({ has_tx: true }),
    );
  });

  it("reads the cached cashback, which is what the reward banner fetches", () => {
    const withCashback = {
      ...unsigned,
      [cardManagementApi.reducerPath]: {
        queries: {
          "getCardCashback(undefined)": {
            status: "fulfilled",
            data: mockPayCardCashback(),
          },
        },
      },
    };

    expect(getPayAttributes(withCashback, true, accountsWithUsdc)).toEqual(
      expect.objectContaining({ cardRewardsAvailable: true, cardRewardCurrency: "BTC" }),
    );
  });
});
