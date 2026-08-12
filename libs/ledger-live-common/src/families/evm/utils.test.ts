import BigNumber from "bignumber.js";
import { getEstimatedFees, getGasLimit } from "./utils";

describe("getGasLimit", () => {
  it("returns gasLimit when customGasLimit is not provided", () => {
    const tx = { gasLimit: new BigNumber(100), customGasLimit: undefined } as any;
    expect(getGasLimit(tx)).toEqual(new BigNumber(100));
  });

  it("returns customGasLimit when provided", () => {
    const tx = { gasLimit: new BigNumber(100), customGasLimit: new BigNumber(200) } as any;
    expect(getGasLimit(tx)).toEqual(new BigNumber(200));
  });
});

describe("getEstimatedFees", () => {
  describe("without customGasLimit", () => {
    it("returns right fee estimation for a legacy tx", () => {
      const tx = { type: 0, gasLimit: new BigNumber(3), gasPrice: new BigNumber(23) } as any;
      expect(getEstimatedFees(tx)).toEqual(new BigNumber(69));
    });

    it("returns right fee estimation for a 1559 tx", () => {
      const tx = { type: 2, gasLimit: new BigNumber(42), maxFeePerGas: new BigNumber(10) } as any;
      expect(getEstimatedFees(tx)).toEqual(new BigNumber(420));
    });
  });

  describe("with customGasLimit", () => {
    it("returns right fee estimation for a legacy tx", () => {
      const tx = {
        type: 0,
        gasLimit: new BigNumber(4),
        customGasLimit: new BigNumber(3),
        gasPrice: new BigNumber(23),
      } as any;
      expect(getEstimatedFees(tx)).toEqual(new BigNumber(69));
    });

    it("returns right fee estimation for a 1559 tx", () => {
      const tx = {
        type: 2,
        gasLimit: new BigNumber(43),
        customGasLimit: new BigNumber(42),
        maxFeePerGas: new BigNumber(10),
      } as any;
      expect(getEstimatedFees(tx)).toEqual(new BigNumber(420));
    });
  });

  it("falls back to zero for a tx without type", () => {
    expect(getEstimatedFees({ gasLimit: new BigNumber(10) } as any)).toEqual(new BigNumber(0));
  });

  it("falls back to zero for a badly formatted legacy tx", () => {
    expect(getEstimatedFees({ gasLimit: new BigNumber(10), type: 0 } as any)).toEqual(
      new BigNumber(0),
    );
  });

  it("falls back to zero for a badly formatted 1559 tx", () => {
    expect(getEstimatedFees({ gasLimit: new BigNumber(10), type: 2 } as any)).toEqual(
      new BigNumber(0),
    );
  });
});
