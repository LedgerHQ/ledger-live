import { BigNumber } from "bignumber.js";
import { BitcoinInfrastructureError } from "../errors";
import { DEFAULT_FEES, fakeExplorer } from "../test/fakeExplorer";
import { avoidDups, feeRatesFrom, getFeeRates, resolveFeePerByte } from "./fees";

describe("feeRatesFrom", () => {
  it("converts the sat/kB presets to sat/vB, fastest first", () => {
    const rates = feeRatesFrom("bitcoin", DEFAULT_FEES, { relay_fee: "0.00001000" });
    expect(rates.fast.toNumber()).toBe(20);
    expect(rates.medium.toNumber()).toBe(10);
    expect(rates.slow.toNumber()).toBe(5);
    expect(rates.relay.toNumber()).toBe(1);
  });

  it("keeps every preset strictly above the relay floor", () => {
    const rates = feeRatesFrom(
      "bitcoin",
      { "1": 1_000, "3": 1_000, "6": 1_000 },
      { relay_fee: "0.00002000" },
    );
    expect(rates.slow.toNumber()).toBe(3);
    expect(rates.medium.toNumber()).toBe(4);
    expect(rates.fast.toNumber()).toBe(5);
    expect(rates.relay.toNumber()).toBe(2);
  });

  it("has no floor when the node reports no relay fee, except bitcoin's 1 sat/vB", () => {
    expect(feeRatesFrom("litecoin", DEFAULT_FEES, undefined).relay.toNumber()).toBe(0);
    expect(feeRatesFrom("bitcoin", DEFAULT_FEES, undefined).relay.toNumber()).toBe(1);
  });

  it("reads the incremental relay fee", () => {
    const rates = feeRatesFrom("bitcoin", DEFAULT_FEES, { incremental_fee: "0.00003000" });
    expect(rates.incremental?.toNumber()).toBe(3);
  });

  it("throws when the explorer does not serve three presets", () => {
    expect(() => feeRatesFrom("bitcoin", { "1": 10_000 }, undefined)).toThrow(
      BitcoinInfrastructureError,
    );
  });
});

describe("avoidDups", () => {
  it("bumps each level above the next one", () => {
    expect(avoidDups([5, 5, 5].map(n => new BigNumber(n))).map(n => n.toNumber())).toEqual([
      7, 6, 5,
    ]);
  });
});

describe("getFeeRates", () => {
  it("serves later calls from the cache", async () => {
    const explorer = fakeExplorer();
    await getFeeRates("bitcoin", explorer);
    await getFeeRates("bitcoin", explorer);
    expect(explorer.getFees).toHaveBeenCalledTimes(1);
  });

  it("reads the rates again once their lifetime is over", async () => {
    const explorer = { ...fakeExplorer(), feeRatesCacheTtlMs: 1_000 };
    const now = jest.spyOn(Date, "now").mockReturnValue(10_000);
    await getFeeRates("bitcoin", explorer);
    now.mockReturnValue(10_999);
    await getFeeRates("bitcoin", explorer);
    expect(explorer.getFees).toHaveBeenCalledTimes(1);
    now.mockReturnValue(11_000);
    await getFeeRates("bitcoin", explorer);
    expect(explorer.getFees).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });

  it("does not keep a failed read", async () => {
    const explorer = fakeExplorer();
    (explorer.getFees as jest.Mock).mockRejectedValueOnce(new Error("down"));
    await expect(getFeeRates("bitcoin", explorer)).rejects.toThrow("down");
    await expect(getFeeRates("bitcoin", explorer)).resolves.toMatchObject({});
    expect(explorer.getFees).toHaveBeenCalledTimes(2);
  });

  it("does not fail when the network endpoint does", async () => {
    const explorer = fakeExplorer();
    (explorer.getNetwork as jest.Mock).mockRejectedValue(new Error("down"));
    const rates = await getFeeRates("litecoin", explorer);
    expect(rates.relay.toNumber()).toBe(0);
  });
});

describe("resolveFeePerByte", () => {
  const rates = feeRatesFrom("bitcoin", DEFAULT_FEES, undefined);

  it("prefers an explicit rate", () => {
    expect(resolveFeePerByte(rates, { feePerByte: "42", feesStrategy: "fast" }).toNumber()).toBe(
      42,
    );
    expect(resolveFeePerByte(rates, { feePerByte: 7n }).toNumber()).toBe(7);
  });

  it.each([
    ["slow", 5],
    ["medium", 10],
    ["fast", 20],
    [undefined, 10],
    ["custom", 10],
  ])("maps the %s strategy", (feesStrategy, expected) => {
    expect(resolveFeePerByte(rates, { feesStrategy }).toNumber()).toBe(expected);
  });
});
