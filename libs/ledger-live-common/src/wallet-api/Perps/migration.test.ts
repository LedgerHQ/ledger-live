import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";
import { getHypercoreAccounts } from "./migration";

describe("getHypercoreAccounts", () => {
  it("keeps only the Hyperliquid main accounts", () => {
    const hypercoreAccount = createFixtureAccount("hc", getCryptoCurrencyById("hypercore"));
    const arbitrumAccount = createFixtureAccount("arb", getCryptoCurrencyById("arbitrum"));

    expect(getHypercoreAccounts([arbitrumAccount, hypercoreAccount])).toEqual([hypercoreAccount]);
  });

  it("returns an empty list when the wallet has no Hyperliquid account", () => {
    expect(getHypercoreAccounts([createFixtureAccount("arb")])).toEqual([]);
  });
});
