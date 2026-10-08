import { toHeldAccount } from "../logic/toHeldAccount";

const usdc = {
  id: "ethereum/erc20/usd__coin",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
};

describe("toHeldAccount", () => {
  it("should read the token of a token account", () => {
    expect(
      toHeldAccount({
        type: "TokenAccount",
        balance: { toNumber: () => 10 },
        token: usdc,
      }),
    ).toEqual({
      type: "TokenAccount",
      balance: 10,
      currency: {
        id: usdc.id,
        name: usdc.name,
        ticker: usdc.ticker,
        units: usdc.units,
      },
    });
  });

  it("should read the currency of an account", () => {
    const eth = {
      id: "ethereum",
      name: "Ethereum",
      ticker: "ETH",
      units: [{ name: "Ether", code: "ETH", magnitude: 18 }],
    };

    expect(
      toHeldAccount({
        type: "Account",
        balance: { toNumber: () => 1 },
        currency: eth,
      }),
    ).toEqual({
      type: "Account",
      balance: 1,
      currency: eth,
    });
  });
});
