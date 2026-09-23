import { getTickersWithFunds } from "./getTickersWithFunds";

const balance = (value: number) => ({
  gt: (threshold: number) => value > threshold,
});

describe("getTickersWithFunds", () => {
  it("includes funded token accounts when their parent has no funds", () => {
    expect(
      getTickersWithFunds([
        {
          balance: balance(0),
          currency: { ticker: "ETH" },
          subAccounts: [{ balance: balance(1), token: { ticker: "USDC" } }],
        },
      ]),
    ).toEqual(["USDC"]);
  });

  it("includes funded parent and token accounts without duplicates", () => {
    expect(
      getTickersWithFunds([
        {
          balance: balance(1),
          currency: { ticker: "ETH" },
          subAccounts: [
            { balance: balance(1), token: { ticker: "USDC" } },
            { balance: balance(2), token: { ticker: "USDC" } },
            { balance: balance(0), token: { ticker: "USDT" } },
          ],
        },
      ]),
    ).toEqual(["ETH", "USDC"]);
  });
});
