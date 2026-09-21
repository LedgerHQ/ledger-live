import BigNumber from "bignumber.js";
import {
  createFixtureAccount,
  createFixtureTokenAccount,
  createFixtureTransaction,
} from "../test/fixtures";
import { resolveSendAmount } from "./amount";

const account = () => createFixtureAccount({ spendableBalance: new BigNumber(8000) });
const tokenAccount = () => createFixtureTokenAccount({ spendableBalance: new BigNumber(5000000) });

describe("resolveSendAmount", () => {
  it("takes the stated amount on a native send", () => {
    const resolved = resolveSendAmount({
      account: account(),
      transaction: createFixtureTransaction({ amount: new BigNumber(1200) }),
      tokenAccount: undefined,
      estimatedFees: new BigNumber(500),
    });

    expect(resolved).toEqual(new BigNumber(1200));
  });

  it("takes the stated amount on a token send", () => {
    const resolved = resolveSendAmount({
      account: account(),
      transaction: createFixtureTransaction({ amount: new BigNumber(1200) }),
      tokenAccount: tokenAccount(),
      estimatedFees: new BigNumber(500),
    });

    expect(resolved).toEqual(new BigNumber(1200));
  });

  // The fee is owed in CCD by the parent, so a max token send is the whole
  // sub-account balance — where a max native send has to keep the fee back.
  it("sends the sub-account's whole spendable balance under useAllAmount", () => {
    const resolved = resolveSendAmount({
      account: account(),
      transaction: createFixtureTransaction({ useAllAmount: true, amount: new BigNumber(0) }),
      tokenAccount: tokenAccount(),
      estimatedFees: new BigNumber(500),
    });

    expect(resolved).toEqual(new BigNumber(5000000));
  });

  it("keeps the fee back on a native useAllAmount send", () => {
    const resolved = resolveSendAmount({
      account: account(),
      transaction: createFixtureTransaction({ useAllAmount: true, amount: new BigNumber(0) }),
      tokenAccount: undefined,
      estimatedFees: new BigNumber(500),
    });

    expect(resolved).toEqual(new BigNumber(7500));
  });

  // Never negative: the send flow offers max before the fee is known to exceed
  // the balance, and a negative amount would be signed rather than rejected.
  it("floors a native useAllAmount send at zero when the fee exceeds the balance", () => {
    const resolved = resolveSendAmount({
      account: account(),
      transaction: createFixtureTransaction({ useAllAmount: true, amount: new BigNumber(0) }),
      tokenAccount: undefined,
      estimatedFees: new BigNumber(9000),
    });

    expect(resolved).toEqual(new BigNumber(0));
  });
});
