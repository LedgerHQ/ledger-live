import { BigNumber } from "bignumber.js";
import { computeZcashBalance, getPrivateBalance, getTransparentBalance } from "../balance";

describe("getTransparentBalance", () => {
  it("returns 0 when there are no utxos", () => {
    expect(getTransparentBalance(undefined)).toEqual(new BigNumber(0));
    expect(getTransparentBalance([])).toEqual(new BigNumber(0));
  });

  it("sums the value of all utxos", () => {
    const utxos = [{ value: new BigNumber(1000) }, { value: new BigNumber(2500) }];
    expect(getTransparentBalance(utxos)).toEqual(new BigNumber(3500));
  });
});

describe("getPrivateBalance", () => {
  it("returns 0 when privateInfo is missing", () => {
    expect(getPrivateBalance(undefined)).toEqual(new BigNumber(0));
    expect(getPrivateBalance(null)).toEqual(new BigNumber(0));
  });

  it("sums orchard and sapling balances", () => {
    const privateInfo = {
      orchardBalance: new BigNumber(5000),
      saplingBalance: new BigNumber(2000),
    };
    expect(getPrivateBalance(privateInfo)).toEqual(new BigNumber(7000));
  });
});

describe("computeZcashBalance", () => {
  it("returns the transparent balance when there is no private balance", () => {
    expect(computeZcashBalance(new BigNumber(4200), undefined)).toEqual(new BigNumber(4200));
  });

  it("returns transparent + private", () => {
    const privateInfo = {
      orchardBalance: new BigNumber(5000),
      saplingBalance: new BigNumber(2000),
    };
    expect(computeZcashBalance(new BigNumber(10000), privateInfo)).toEqual(new BigNumber(17000));
  });
});
