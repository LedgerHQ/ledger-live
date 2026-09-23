import { toPayGlobalProperties } from "../toPayGlobalProperties";

describe("toPayGlobalProperties", () => {
  it("maps signed-in card state onto the Pay tracking contract when the flag is on", () => {
    expect(
      toPayGlobalProperties({
        featureFlagPay: true,
        hasCard: true,
        isSignedIn: true,
        accountTickers: ["BTC", "USDC"],
        internalWalletBalances: ["1500"],
        cardStatus: { cardAddedToDigitalWallet: true },
        hasCardTransactions: true,
        cardWallets: [
          { priority: 2, currency: "usdt" },
          { priority: 1, currency: "usdc" },
        ],
        cashback: { amount: "1.5", currency: "USD" },
      }),
    ).toEqual({
      featureFlagPay: true,
      hasStable: true,
      hasCard: true,
      cardLoggedIn: true,
      hasFundsOnCard: true,
      has_tx: true,
      cardAddedToOsWallet: true,
      cardDebitOrder: ["USDC", "USDT"],
      cardRewardsAvailable: true,
      cardRewardCurrency: "USD",
    });
  });

  it("sends only featureFlagPay when the flag is off", () => {
    expect(
      toPayGlobalProperties({
        featureFlagPay: false,
        hasCard: true,
        isSignedIn: true,
        accountTickers: ["USDC"],
        internalWalletBalances: ["10"],
        cashback: { amount: "1.5", currency: "USD" },
      }),
    ).toEqual({
      featureFlagPay: false,
    });
  });

  it("maps signed-out empty state onto the Pay tracking contract when the flag is on", () => {
    expect(
      toPayGlobalProperties({
        featureFlagPay: true,
        hasCard: false,
        isSignedIn: false,
        accountTickers: [],
      }),
    ).toEqual({
      featureFlagPay: true,
      hasStable: false,
      hasCard: false,
      cardLoggedIn: false,
      hasFundsOnCard: false,
      has_tx: false,
      cardAddedToOsWallet: false,
      cardDebitOrder: [],
      cardRewardsAvailable: false,
      cardRewardCurrency: null,
    });
  });

  it("reports the rewards without a currency when the provider names none", () => {
    expect(
      toPayGlobalProperties({
        featureFlagPay: true,
        hasCard: true,
        isSignedIn: true,
        accountTickers: [],
        cashback: { amount: "1.5", currency: null },
      }),
    ).toEqual(expect.objectContaining({ cardRewardsAvailable: true, cardRewardCurrency: null }));
  });

  it("reports no rewards while the cashback amount is zero", () => {
    expect(
      toPayGlobalProperties({
        featureFlagPay: true,
        hasCard: true,
        isSignedIn: true,
        accountTickers: [],
        cashback: { amount: "0.00", currency: "BTC" },
      }),
    ).toEqual(expect.objectContaining({ cardRewardsAvailable: false, cardRewardCurrency: "BTC" }));
  });
});
