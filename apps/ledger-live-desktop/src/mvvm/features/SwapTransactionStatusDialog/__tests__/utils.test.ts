import { getExplorerUrl } from "../utils";

describe("getExplorerUrl", () => {
  it.each(["swapsxyz", "moonpay_trade"])(
    "returns the Swaps.xyz scan URL for %s without requiring an operation hash",
    provider => {
      expect(
        getExplorerUrl({
          provider,
          swapId: "swap-1",
          operationHash: undefined,
          fromCurrency: undefined,
        }),
      ).toBe("https://scan.swaps.xyz/transactions/swap-1");
    },
  );

  it("does not build provider hash URLs when the operation hash is missing", () => {
    expect(
      getExplorerUrl({
        provider: "lifi",
        swapId: "swap-1",
        operationHash: undefined,
        fromCurrency: undefined,
      }),
    ).toBeUndefined();
  });
});
