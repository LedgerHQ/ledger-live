import { BigNumber } from "bignumber.js";
import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import type { TransactionInfo } from "@ledgerhq/wallet-btc/index";
import { maxTxVBytesCeil } from "@ledgerhq/wallet-btc/utils";
import { DerivationModes } from "@ledgerhq/wallet-btc/index";
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
    const rate = zcashSafeFeePerByte(crypto, DerivationModes.LEGACY).toNumber();

    expect(rate * smallest).toBeGreaterThanOrEqual(10_000);
    expect((rate - 1) * smallest).toBeLessThan(10_000);
  });
});

describe("requiredFee", () => {
  it.each([
    [1, 1, 10_000],
    [1, 2, 10_000],
    [3, 2, 15_000],
    [2, 5, 25_000],
  ])("charges %i inputs and %i outputs %i zatoshis", (inputs, outputs, fee) => {
    expect(requiredFee(txInfo(inputs, outputs, 0)).toNumber()).toBe(fee);
  });
});

describe("buildAtZip317Rate", () => {
  const safe = new BigNumber(40);

  it("keeps the tighter build when it still pays what its layout owes", async () => {
    const build = jest.fn(async (rate: BigNumber) =>
      rate.eq(safe) ? txInfo(1, 2, 20_000) : txInfo(1, 2, 10_000),
    );

    const { txInfo: kept, feePerByte } = await buildAtZip317Rate(safe, build);

    expect(feePerByte.toNumber()).toBe(20);
    expect(kept.fee).toBe(10_000);
  });

  it("keeps the safe build when the tighter one underpays", async () => {
    const build = jest.fn(async (rate: BigNumber) =>
      rate.eq(safe) ? txInfo(1, 2, 20_000) : txInfo(3, 2, 12_000),
    );

    const { txInfo: kept, feePerByte } = await buildAtZip317Rate(safe, build);

    expect(feePerByte).toBe(safe);
    expect(kept.fee).toBe(20_000);
  });

  it("keeps the safe build when the tighter one cannot be built", async () => {
    const build = jest.fn(async (rate: BigNumber) => {
      if (rate.eq(safe)) return txInfo(1, 2, 20_000);
      throw new Error("NotEnoughBalance");
    });

    expect((await buildAtZip317Rate(safe, build)).txInfo.fee).toBe(20_000);
  });

  it("builds once when the safe rate already charges no more than required", async () => {
    const build = jest.fn(async () => txInfo(1, 2, 10_000));

    await buildAtZip317Rate(safe, build);

    expect(build).toHaveBeenCalledTimes(1);
  });
});
