import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import { DerivationModes } from "@ledgerhq/wallet-btc/types";
import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import type { Transaction } from "../../../types";

const calculateFees = jest.fn();
jest.mock("../../../cache", () => ({
  calculateFees: (...args: unknown[]) => calculateFees(...args),
}));

import { resolveZcashFeePerByte, zcashSafeFeePerByte } from "../transparent-fee-rate";
import { ZIP317_MARGINAL_FEE, ZIP317_MINIMUM_FEE } from "../coin-selection";
import { getChainAdapter } from "../../registry";
import { setZcashShieldedEnabled } from "../constants";
// Registers the Zcash adapter as a side effect.
import "../index";

const crypto = cryptoFactory("zcash");
const DERIVATION_MODE = DerivationModes.LEGACY;

const vbytes = (inputCount: number, outputCount: number) =>
  maxTxVBytesCeil(
    inputCount,
    Array(Math.max(0, outputCount - 1)).fill(Buffer.alloc(25)),
    outputCount > 0,
    crypto,
    DERIVATION_MODE,
  );

const zip317 = (inputCount: number, outputCount: number) =>
  ZIP317_MARGINAL_FEE * Math.max(2, Math.max(inputCount, outputCount));

/**
 * Stands in for wallet-btc: charges `rate × vsize` for the layout its selection
 * lands on. `layoutFor` expresses how that selection reacts to the rate, which is
 * the whole reason the resolution has to verify a tightened rate rather than trust
 * the arithmetic.
 */
const chargingLike = (layoutFor: (rate: number) => [number, number]) =>
  jest.fn(({ transaction }: { transaction: Transaction }) => {
    const rate = (transaction.feePerByte as BigNumber).toNumber();
    const [inputCount, outputCount] = layoutFor(rate);
    return Promise.resolve({
      fees: new BigNumber(rate * vbytes(inputCount, outputCount)),
      txInputs: Array(inputCount).fill({}),
      txOutputs: Array(outputCount).fill({}),
    });
  });

const account = { currency: { id: "zcash" } } as unknown as Account;
const transaction = { amount: new BigNumber(100000) } as unknown as Transaction;

const safeRate = zcashSafeFeePerByte(crypto, DERIVATION_MODE);
const resolve = () => resolveZcashFeePerByte(account, transaction, safeRate);
const feeAt = (rate: BigNumber, inputCount: number, outputCount: number) =>
  rate.times(vbytes(inputCount, outputCount)).toNumber();

beforeEach(() => jest.clearAllMocks());

describe("zcashSafeFeePerByte", () => {
  it("covers ZIP-317 for every layout, the smallest transaction being the binding one", () => {
    expect(feeAt(safeRate, 1, 1)).toBeGreaterThanOrEqual(ZIP317_MINIMUM_FEE);
    for (let inputCount = 1; inputCount <= 25; inputCount++) {
      for (const outputCount of [1, 2]) {
        expect(feeAt(safeRate, inputCount, outputCount)).toBeGreaterThanOrEqual(
          zip317(inputCount, outputCount),
        );
      }
    }
  });

  it("is the tightest such rate — one zat less would underpay the smallest transaction", () => {
    expect(feeAt(safeRate.minus(1), 1, 1)).toBeLessThan(ZIP317_MINIMUM_FEE);
  });
});

describe("resolveZcashFeePerByte", () => {
  it("tightens the rate to the ZIP-317 fee for the layout at hand", async () => {
    calculateFees.mockImplementation(chargingLike(() => [1, 2]));

    const rate = await resolve();

    // Within one vByte's worth above ZIP-317 — the rounding of the last division.
    expect(feeAt(rate, 1, 2)).toBeGreaterThanOrEqual(ZIP317_MINIMUM_FEE);
    expect(feeAt(rate, 1, 2)).toBeLessThan(ZIP317_MINIMUM_FEE + vbytes(1, 2));
  });

  it("charges the two-action floor on a two-input send instead of twice its size", async () => {
    calculateFees.mockImplementation(chargingLike(() => [2, 2]));

    const rate = await resolve();

    expect(feeAt(rate, 2, 2)).toBeGreaterThanOrEqual(ZIP317_MINIMUM_FEE);
    expect(feeAt(rate, 2, 2)).toBeLessThan(ZIP317_MINIMUM_FEE + vbytes(2, 2));
    // What the account-wide rate would have charged for the same transaction.
    expect(feeAt(safeRate, 2, 2)).toBeGreaterThan(ZIP317_MINIMUM_FEE * 1.9);
  });

  it("bills the actions past the grace period once inputs outnumber them", async () => {
    calculateFees.mockImplementation(chargingLike(() => [4, 2]));

    const rate = await resolve();

    expect(feeAt(rate, 4, 2)).toBeGreaterThanOrEqual(4 * ZIP317_MARGINAL_FEE);
    expect(feeAt(rate, 4, 2)).toBeLessThan(4 * ZIP317_MARGINAL_FEE + vbytes(4, 2));
  });

  it("keeps the safe rate when tightening it changes the selection into underpaying", async () => {
    // Below the safe rate more UTXOs become economical, so the layout grows and
    // owes more than the tightened rate was computed to cover.
    calculateFees.mockImplementation(
      chargingLike(rate => (rate >= safeRate.toNumber() ? [2, 2] : [5, 2])),
    );

    const rate = await resolve();

    expect(rate.toNumber()).toBe(safeRate.toNumber());
    expect(feeAt(rate, 5, 2)).toBeGreaterThanOrEqual(zip317(5, 2));
  });

  it("keeps the safe rate when the transaction cannot be built", async () => {
    calculateFees.mockRejectedValue(new Error("NotEnoughBalance"));

    await expect(resolve()).resolves.toEqual(safeRate);
  });

  it("keeps the safe rate when the build reports no fee to reason from", async () => {
    calculateFees.mockResolvedValue({
      fees: new BigNumber(0),
      txInputs: [{}],
      txOutputs: [{}, {}],
    });

    await expect(resolve()).resolves.toEqual(safeRate);
  });

  it("never returns a rate that underpays, whatever the layout", async () => {
    for (let inputCount = 1; inputCount <= 20; inputCount++) {
      for (const outputCount of [1, 2]) {
        calculateFees.mockImplementation(chargingLike(() => [inputCount, outputCount]));

        const rate = await resolve();

        expect(feeAt(rate, inputCount, outputCount)).toBeGreaterThanOrEqual(
          zip317(inputCount, outputCount),
        );
      }
    }
  });
});

describe("the Zcash adapter's resolveFeePerByte hook", () => {
  const hook = () => getChainAdapter("zcash").resolveFeePerByte!;
  const prepared = (feePerByte: BigNumber | null) =>
    ({ ...transaction, feePerByte }) as unknown as Transaction;

  afterEach(() => setZcashShieldedEnabled(false));

  it("resolves the ZIP-317 rate on the legacy transparent path", async () => {
    setZcashShieldedEnabled(false);
    calculateFees.mockImplementation(chargingLike(() => [2, 2]));

    const rate = await hook()(account, prepared(safeRate))!;

    expect(rate!.lt(safeRate)).toBe(true);
    expect(feeAt(rate!, 2, 2)).toBeGreaterThanOrEqual(ZIP317_MINIMUM_FEE);
  });

  it("leaves the rate alone when the PCZT flows are in charge of the fee", () => {
    setZcashShieldedEnabled(true);

    expect(hook()(account, prepared(safeRate))).toBeUndefined();
    expect(calculateFees).not.toHaveBeenCalled();
  });

  it("leaves the rate alone when no usable rate was prepared", () => {
    setZcashShieldedEnabled(false);

    expect(hook()(account, prepared(null))).toBeUndefined();
    expect(hook()(account, prepared(new BigNumber(0)))).toBeUndefined();
    expect(calculateFees).not.toHaveBeenCalled();
  });
});
