import { buildAdditionals } from "../../signOperation";
import type { Transaction } from "../../types";

describe("buildAdditionals", () => {
  const transaction = {} as Transaction;

  it("keeps the currency id as the first additional for other currencies", () => {
    expect(buildAdditionals("bitcoin_testnet", "native_segwit", transaction)).toEqual([
      "bitcoin_testnet",
      "bech32",
    ]);
  });
});
