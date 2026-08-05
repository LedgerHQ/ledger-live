import { BigNumber } from "bignumber.js";
import { computeZcashBalance, getPrivateBalance, getTransparentBalance } from "./balance";

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

  it("returns the ironwood balance, ignoring the deprecated orchard and sapling pools", () => {
    const privateInfo = {
      orchardBalance: new BigNumber(5000),
      saplingBalance: new BigNumber(2000),
      ironwoodBalance: new BigNumber(4000),
    };
    expect(getPrivateBalance(privateInfo)).toEqual(new BigNumber(4000));
  });

  it("returns 0 when only the deprecated pools hold notes", () => {
    const privateInfo = {
      orchardBalance: new BigNumber(5000),
      saplingBalance: new BigNumber(2000),
      ironwoodBalance: new BigNumber(0),
    };
    expect(getPrivateBalance(privateInfo)).toEqual(new BigNumber(0));
  });

  it("treats a missing ironwoodBalance as zero (backward compat)", () => {
    const privateInfo = {
      orchardBalance: new BigNumber(5000),
      saplingBalance: new BigNumber(2000),
      // ironwoodBalance intentionally absent — old persisted shape
    } as Parameters<typeof getPrivateBalance>[0];
    expect(getPrivateBalance(privateInfo)).toEqual(new BigNumber(0));
  });
});

describe("computeZcashBalance", () => {
  it("returns the transparent balance when there is no private balance", () => {
    expect(computeZcashBalance(new BigNumber(4200), undefined)).toEqual(new BigNumber(4200));
  });

  it("adds only the ironwood balance, ignoring the deprecated orchard and sapling pools", () => {
    const privateInfo = {
      orchardBalance: new BigNumber(5000),
      saplingBalance: new BigNumber(2000),
      ironwoodBalance: new BigNumber(3000),
    };
    expect(computeZcashBalance(new BigNumber(10000), privateInfo)).toEqual(new BigNumber(13000));
  });

  it("returns the transparent balance when only the deprecated pools hold notes", () => {
    const privateInfo = {
      orchardBalance: new BigNumber(5000),
      saplingBalance: new BigNumber(2000),
      ironwoodBalance: new BigNumber(0),
    };
    expect(computeZcashBalance(new BigNumber(10000), privateInfo)).toEqual(new BigNumber(10000));
  });
});
