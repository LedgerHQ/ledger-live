import { BigNumber } from "bignumber.js";
import {
  computeZcashBalance,
  getPrivateBalance,
  getTransparentBalance,
  hasRecentlyShieldedFunds,
} from "./balance";
import type { ShieldedTransaction } from "../../network/types";
import { ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS } from "../../constants";

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

describe("hasRecentlyShieldedFunds", () => {
  const TIP = 1_000_000; // fixed latest scanned block height

  // An outgoing shielded transaction: a net-negative Ironwood delta.
  const outgoingTx = (blockHeight: number) =>
    ({
      blockHeight,
      decryptedData: {
        orchard_outputs: [],
        sapling_outputs: [],
        ironwood_outputs: [{ amount: new BigNumber(5000), memo: "", transfer_type: "outgoing" }],
      },
    }) as unknown as ShieldedTransaction;

  // An incoming shielded transaction: a net-positive Ironwood delta.
  const incomingTx = (blockHeight: number) =>
    ({
      blockHeight,
      decryptedData: {
        orchard_outputs: [],
        sapling_outputs: [],
        ironwood_outputs: [{ amount: new BigNumber(5000), memo: "", transfer_type: "incoming" }],
      },
    }) as unknown as ShieldedTransaction;

  it("returns false when privateInfo is missing or empty", () => {
    expect(hasRecentlyShieldedFunds(undefined)).toBe(false);
    expect(hasRecentlyShieldedFunds(null)).toBe(false);
    expect(hasRecentlyShieldedFunds({ transactions: [], lastProcessedBlock: TIP })).toBe(false);
  });

  it("returns false when the latest scanned block is unknown", () => {
    expect(
      hasRecentlyShieldedFunds({ transactions: [outgoingTx(TIP)], lastProcessedBlock: null }),
    ).toBe(false);
  });

  it(`returns true when an outgoing shielded transaction is within the last ${ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS} blocks`, () => {
    expect(
      hasRecentlyShieldedFunds({
        transactions: [outgoingTx(TIP - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS + 1)],
        lastProcessedBlock: TIP,
      }),
    ).toBe(true);
  });

  it(`returns false when all outgoing shielded transactions have ${ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS}+ confirmations`, () => {
    expect(
      hasRecentlyShieldedFunds({
        transactions: [outgoingTx(TIP - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS)],
        lastProcessedBlock: TIP,
      }),
    ).toBe(false);
  });

  it("ignores recent incoming transactions", () => {
    expect(
      hasRecentlyShieldedFunds({ transactions: [incomingTx(TIP - 1)], lastProcessedBlock: TIP }),
    ).toBe(false);
  });

  it("returns true when at least one of several transactions is a recent outgoing tx", () => {
    expect(
      hasRecentlyShieldedFunds({
        transactions: [outgoingTx(TIP - 20), outgoingTx(TIP - 1)],
        lastProcessedBlock: TIP,
      }),
    ).toBe(true);
  });

  it(`treats an outgoing transaction just under the ${ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS}-block delay as recent`, () => {
    expect(
      hasRecentlyShieldedFunds({
        transactions: [outgoingTx(TIP - ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS + 1)],
        lastProcessedBlock: TIP,
      }),
    ).toBe(true);
  });
});
