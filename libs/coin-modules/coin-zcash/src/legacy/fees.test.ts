import { BigNumber } from "bignumber.js";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { TransactionInfo } from "@ledgerhq/wallet-btc/index";
import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import { DerivationModes } from "@ledgerhq/wallet-btc/index";
import { LEGACY_MARGINAL_FEE, ZIP2009_MARGINAL_FEE } from "../logic/coin-selection";
import { buildAtZip317Rate, requiredFee, zcashSafeFeePerByte } from "./fees";

const txInfo = (inputs: number, outputs: number, fee: number): TransactionInfo =>
  ({
    inputs: Array.from({ length: inputs }, () => ({})),
    outputs: Array.from({ length: outputs }, () => ({})),
    associatedDerivations: [],
    fee,
    changeAddress: { account: 1, index: 0, address: "" },
  }) as unknown as TransactionInfo;

describe("zcashSafeFeePerByte", () => {
  it("is the lowest whole rate at which the smallest transaction pays the ZIP-317 floor", () => {
    const crypto = cryptoFactory("zcash");
    const smallest = maxTxVBytesCeil(1, [], true, crypto, DerivationModes.LEGACY);
    const rate = zcashSafeFeePerByte(
      crypto,
      DerivationModes.LEGACY,
      LEGACY_MARGINAL_FEE,
    ).toNumber();

    expect(rate * smallest).toBeGreaterThanOrEqual(10_000);
    expect((rate - 1) * smallest).toBeLessThan(10_000);
  });

  it("is the lowest whole rate paying the two-action floor at the ZIP 2009 marginal fee", () => {
    const crypto = cryptoFactory("zcash");
    const smallest = maxTxVBytesCeil(1, [], true, crypto, DerivationModes.LEGACY);
    const rate = zcashSafeFeePerByte(crypto, DerivationModes.LEGACY, ZIP2009_MARGINAL_FEE);

    expect(rate.toNumber() * smallest).toBeGreaterThanOrEqual(2_000);
    expect((rate.toNumber() - 1) * smallest).toBeLessThan(2_000);
    expect(rate.toNumber()).toBeLessThan(
      zcashSafeFeePerByte(crypto, DerivationModes.LEGACY, LEGACY_MARGINAL_FEE).toNumber(),
    );
  });
});

describe("requiredFee", () => {
  it.each([
    [1, 1, 10_000],
    [1, 2, 10_000],
    [3, 2, 15_000],
    [2, 5, 25_000],
  ])("charges %i inputs and %i outputs %i zatoshis", (inputs, outputs, fee) => {
    expect(requiredFee(txInfo(inputs, outputs, 0), LEGACY_MARGINAL_FEE).toNumber()).toBe(fee);
  });

  it.each([
    [1, 1, 2_000],
    [1, 2, 2_000],
    [3, 2, 3_000],
    [2, 5, 5_000],
  ])(
    "charges %i inputs and %i outputs %i zatoshis at the ZIP 2009 marginal fee",
    (inputs, outputs, fee) => {
      expect(requiredFee(txInfo(inputs, outputs, 0), ZIP2009_MARGINAL_FEE).toNumber()).toBe(fee);
    },
  );
});

describe("buildAtZip317Rate", () => {
  const safe = new BigNumber(40);

  it("keeps the tighter build when it still pays what its layout owes", async () => {
    const build = jest.fn(async (rate: BigNumber) =>
      rate.eq(safe) ? txInfo(1, 2, 20_000) : txInfo(1, 2, 10_000),
    );

    const { txInfo: kept, feePerByte } = await buildAtZip317Rate(safe, LEGACY_MARGINAL_FEE, build);

    expect(feePerByte.toNumber()).toBe(20);
    expect(kept.fee).toBe(10_000);
  });

  it("keeps the safe build when the tighter one underpays", async () => {
    const build = jest.fn(async (rate: BigNumber) =>
      rate.eq(safe) ? txInfo(1, 2, 20_000) : txInfo(3, 2, 12_000),
    );

    const { txInfo: kept, feePerByte } = await buildAtZip317Rate(safe, LEGACY_MARGINAL_FEE, build);

    expect(feePerByte).toBe(safe);
    expect(kept.fee).toBe(20_000);
  });

  it("keeps the safe build when the tighter one cannot be built", async () => {
    const build = jest.fn(async (rate: BigNumber) => {
      if (rate.eq(safe)) return txInfo(1, 2, 20_000);
      throw new Error("NotEnoughBalance");
    });

    expect((await buildAtZip317Rate(safe, LEGACY_MARGINAL_FEE, build)).txInfo.fee).toBe(20_000);
  });

  it("tightens to what the ZIP 2009 marginal fee requires for the layout", async () => {
    // At 1_000 a 1-in/2-out layout owes 2_000: a fifth of the 10_000 it owes at 5_000.
    const build = jest.fn(async (rate: BigNumber) =>
      rate.eq(safe) ? txInfo(1, 2, 20_000) : txInfo(1, 2, 2_000),
    );

    const { txInfo: kept, feePerByte } = await buildAtZip317Rate(safe, ZIP2009_MARGINAL_FEE, build);

    expect(feePerByte.toNumber()).toBe(4);
    expect(kept.fee).toBe(2_000);
  });

  it("keeps the safe build when the tighter one underpays at the ZIP 2009 marginal fee", async () => {
    const build = jest.fn(async (rate: BigNumber) =>
      rate.eq(safe) ? txInfo(1, 2, 20_000) : txInfo(3, 2, 2_500),
    );

    const { feePerByte } = await buildAtZip317Rate(safe, ZIP2009_MARGINAL_FEE, build);

    expect(feePerByte).toBe(safe);
  });

  it("builds once when the safe rate already charges no more than required", async () => {
    const build = jest.fn(async () => txInfo(1, 2, 10_000));

    await buildAtZip317Rate(safe, LEGACY_MARGINAL_FEE, build);

    expect(build).toHaveBeenCalledTimes(1);
  });
});
