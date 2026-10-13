import { buildAdditionals } from "../../signOperation";
import type { Transaction } from "../../types";

describe("buildAdditionals", () => {
  const transaction = {} as Transaction;

  it.each(["zcash", "zcash_testnet"])("marks %s with the zcash additionals", currencyId => {
    expect(buildAdditionals(currencyId, "", transaction)).toEqual(["zcash", "sapling"]);
  });

  it("keeps the currency id as the first additional for other currencies", () => {
    expect(buildAdditionals("bitcoin_testnet", "native_segwit", transaction)).toEqual([
      "bitcoin_testnet",
      "bech32",
    ]);
  });
});
