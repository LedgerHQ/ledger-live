import { BigNumber } from "bignumber.js";
import {
  bitcoinPickingStrategy,
  type Transaction as BitcoinTransaction,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { getCustomFeesPerFamily } from "../index";

const utxoStrategy = { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] };

function createBitcoinTransaction(overrides?: Partial<BitcoinTransaction>): BitcoinTransaction {
  return {
    family: "bitcoin",
    amount: new BigNumber(1000),
    recipient: "bc1qrecipient",
    familySpecificData: { utxoStrategy, feePerByte: "5" },
    ...overrides,
  };
}

describe("getCustomFeesPerFamily", () => {
  it("should hand the rate of the last estimation and the coin selection for bitcoin", () => {
    const fees = getCustomFeesPerFamily(
      createBitcoinTransaction({ feeParameters: { feePerByte: "12" } }),
    );

    expect(fees).toEqual({ feePerByte: new BigNumber(12), utxoStrategy });
  });

  it("should hand the custom rate for bitcoin when there is no estimation yet", () => {
    const fees = getCustomFeesPerFamily(createBitcoinTransaction());

    expect(fees).toEqual({ feePerByte: new BigNumber(5), utxoStrategy });
  });

  it("should hand no rate for bitcoin when none is known", () => {
    const fees = getCustomFeesPerFamily(createBitcoinTransaction({ familySpecificData: {} }));

    expect(fees).toEqual({ feePerByte: null, utxoStrategy: undefined });
  });
});
