import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getTokensWithFunds, getTokensWithFundsMap } from "./getTokensWithFunds";

const balance = (hasFunds: boolean) => ({ gt: () => hasFunds });

describe("getTokensWithFunds", () => {
  it("returns an empty array without accounts", () => {
    expect(getTokensWithFunds([])).toEqual([]);
    expect(getTokensWithFunds(undefined)).toEqual([]);
  });

  it("labels the native asset and its funded tokens with the chain name", () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const arbitrum = getCryptoCurrencyById("arbitrum");

    expect(
      getTokensWithFunds([
        {
          type: "Account",
          currency: ethereum,
          balance: balance(true),
          subAccounts: [
            { balance: balance(true), token: { ticker: "USDC", id: "ethereum/erc20/usdc" } },
            { balance: balance(false), token: { ticker: "USDT", id: "ethereum/erc20/usdt" } },
            { balance: balance(true), token: { ticker: "USDC", id: "ethereum/erc20/usdc" } },
          ],
        },
        {
          type: "Account",
          currency: arbitrum,
          balance: balance(true),
        },
      ]),
    ).toEqual(["ETH on Ethereum", "USDC on Ethereum", "ETH on Arbitrum"]);
  });

  it("keeps the currency id alongside the ticker and chain name", () => {
    const ethereum = getCryptoCurrencyById("ethereum");

    expect([
      ...getTokensWithFundsMap([
        {
          type: "Account",
          currency: ethereum,
          balance: balance(true),
          subAccounts: [
            { balance: balance(true), token: { ticker: "USDC", id: "ethereum/erc20/usdc" } },
          ],
        },
      ]).values(),
    ]).toEqual([
      { ticker: "ETH", networkName: "Ethereum", id: ethereum.id },
      { ticker: "USDC", networkName: "Ethereum", id: "ethereum/erc20/usdc" },
    ]);
  });

  it("drops tokens when the parent account has no funds", () => {
    expect(
      getTokensWithFunds([
        {
          currency: { ticker: "ETH", name: "Ethereum", id: "ethereum" },
          balance: balance(false),
          subAccounts: [
            { balance: balance(true), token: { ticker: "USDC", id: "ethereum/erc20/usdc" } },
          ],
        },
      ]),
    ).toEqual([]);
  });
});
