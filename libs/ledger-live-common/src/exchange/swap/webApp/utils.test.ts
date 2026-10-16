import { BigNumber } from "bignumber.js";
import { getCustomFeesPerFamily } from "./utils";

describe("getCustomFeesPerFamily", () => {
  it("returns the gas parameters of an evm transaction", () => {
    const maxFeePerGas = new BigNumber(2);
    const maxPriorityFeePerGas = new BigNumber(1);
    const gasPrice = new BigNumber(3);

    expect(
      getCustomFeesPerFamily({
        family: "evm",
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasPrice,
        fees: new BigNumber(9),
      }),
    ).toEqual({ maxFeePerGas, maxPriorityFeePerGas, gasPrice });
  });

  it("returns the fees of other families", () => {
    const fees = new BigNumber(5000);

    expect(getCustomFeesPerFamily({ family: "solana", fees })).toEqual({ fees });
  });

  describe("bitcoin", () => {
    const utxoStrategy = { strategy: 1, excludeUTXOs: [{ hash: "txid", outputIndex: 0 }] };

    it("returns the fee rate of the last estimation, as a BigNumber, and the coin selection", () => {
      expect(
        getCustomFeesPerFamily({
          family: "bitcoin",
          feeParameters: { feePerByte: "7" },
          familySpecificData: { feePerByte: "20", utxoStrategy },
        }),
      ).toEqual({ feePerByte: new BigNumber(7), utxoStrategy });
    });

    it("falls back to the custom fee rate when nothing was estimated", () => {
      expect(
        getCustomFeesPerFamily({
          family: "bitcoin",
          feeParameters: {},
          familySpecificData: { feePerByte: "20" },
        }),
      ).toEqual({ feePerByte: new BigNumber(20), utxoStrategy: undefined });
    });

    it("returns no fee rate when none is known", () => {
      expect(getCustomFeesPerFamily({ family: "bitcoin" })).toEqual({
        feePerByte: undefined,
        utxoStrategy: undefined,
      });
    });

    it("ignores the legacy top-level fields", () => {
      expect(
        getCustomFeesPerFamily({
          family: "bitcoin",
          feePerByte: new BigNumber(99),
          utxoStrategy,
        }),
      ).toEqual({ feePerByte: undefined, utxoStrategy: undefined });
    });
  });
});
