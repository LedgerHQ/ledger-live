import { createFixtureConfig, createFixtureContext } from "../../test/fixtures";
import { CONCORDIUM_ENERGY } from "../../constants";
import { ConcordiumInvalidConfigError } from "../../tuning";
import { applyEnergyBuffer, estimateFees, estimateTokenFees } from "./estimateFees";

jest.mock("../../network/proxyClient", () => ({
  getTransactionCost: jest.fn(),
}));

const { getTransactionCost } = jest.requireMock("../../network/proxyClient");

const context = createFixtureContext();

const config = createFixtureConfig();

describe("applyEnergyBuffer", () => {
  it("adds 20 percent", () => {
    expect(applyEnergyBuffer(BigInt(100), 20)).toBe(BigInt(120));
    expect(applyEnergyBuffer(BigInt(1000), 20)).toBe(BigInt(1200));
  });

  // Truncating would hand back the input unchanged for a small enough estimate,
  // which is a buffer in name only.
  it("rounds up rather than truncating", () => {
    expect(applyEnergyBuffer(BigInt(1), 20)).toBe(BigInt(2));
    expect(applyEnergyBuffer(BigInt(501), 20)).toBe(BigInt(602));
  });

  it("leaves zero at zero", () => {
    expect(applyEnergyBuffer(BigInt(0), 20)).toBe(BigInt(0));
  });
});

describe("estimateFees", () => {
  beforeEach(() => jest.clearAllMocks());

  it("prices a simpleTransfer and does not buffer it", async () => {
    getTransactionCost.mockResolvedValue({ cost: "1000", energy: 501 });

    const result = await estimateFees(context, undefined);

    expect(getTransactionCost).toHaveBeenCalledWith(context, {
      type: "simpleTransfer",
      numSignatures: 1,
    });
    expect(result).toEqual({ cost: BigInt(1000), energy: BigInt(501) });
  });

  // The size is the CBOR-encoded length, not the string length: the proxy
  // charges for the bytes that reach the chain.
  it("passes the encoded memo size", async () => {
    getTransactionCost.mockResolvedValue({ cost: "1200", energy: 520 });

    await estimateFees(context, "test");

    expect(getTransactionCost).toHaveBeenCalledWith(context, {
      type: "simpleTransfer",
      numSignatures: 1,
      memoSize: 5,
    });
  });

  it("pins a simple transfer to the documented fixed energy", async () => {
    getTransactionCost.mockResolvedValue({ cost: "1000000", energy: "501" });

    const result = await estimateFees(context, undefined);

    expect(result.energy).toBe(CONCORDIUM_ENERGY.SIMPLE_TRANSFER);
  });

  it("falls back to the fixed energy when the proxy fails", async () => {
    getTransactionCost.mockRejectedValue(new Error("proxy down"));

    await expect(estimateFees(context, undefined)).resolves.toEqual({
      cost: BigInt(config.fees.defaultCost),
      energy: CONCORDIUM_ENERGY.DEFAULT,
    });
  });

  it("falls back to the cost the coin config sets", async () => {
    getTransactionCost.mockRejectedValue(new Error("proxy down"));

    await expect(
      estimateFees(
        createFixtureContext({ fees: { ...config.fees, defaultCost: 2_000_000 } }),
        undefined,
      ),
    ).resolves.toEqual({ cost: BigInt(2_000_000), energy: CONCORDIUM_ENERGY.DEFAULT });
  });

  it("rejects when the proxy fails and the coin config sets an unusable cost", async () => {
    getTransactionCost.mockRejectedValue(new Error("proxy down"));

    await expect(
      estimateFees(createFixtureContext({ fees: { ...config.fees, defaultCost: 0 } }), undefined),
    ).rejects.toThrow(ConcordiumInvalidConfigError);
  });

  it("rejects a coin-config error instead of falling back", async () => {
    const error = new ConcordiumInvalidConfigError("bad timeout");
    getTransactionCost.mockRejectedValueOnce(error);

    await expect(estimateFees(context, undefined)).rejects.toBe(error);
  });

  it("names the field when the coin config has no fees group", async () => {
    getTransactionCost.mockRejectedValueOnce(new Error("proxy down"));
    const { fees: _, ...withoutFees } = config;
    const legacy = { ...context, config: async () => withoutFees as typeof config };

    await expect(estimateFees(legacy, undefined)).rejects.toThrow(
      "concordium: coin config fees.defaultCost must be an integer >= 1, got undefined",
    );
  });

  it("logs the proxy failure before falling back", async () => {
    const error = new Error("proxy down");
    getTransactionCost.mockRejectedValue(error);
    const logger = jest.fn();

    await estimateFees({ ...context, logger }, undefined);

    expect(logger).toHaveBeenCalledWith("concordium", "estimateFees error", { error });
  });

  it("falls back to the memo ceiling when the proxy fails on a memo transfer", async () => {
    getTransactionCost.mockRejectedValue(new Error("proxy down"));

    await expect(estimateFees(context, "hello")).resolves.toEqual({
      cost: BigInt(config.fees.defaultCost),
      energy: CONCORDIUM_ENERGY.TRANSFER_WITH_MEMO_MAX,
    });
  });
});

describe("estimateTokenFees", () => {
  beforeEach(() => jest.clearAllMocks());

  it("prices a tokenUpdate for a single transfer", async () => {
    getTransactionCost.mockResolvedValue({ cost: "3000", energy: 900 });

    await estimateTokenFees(context, { tokenId: "t-USDT", listOperationsSize: 42 });

    expect(getTransactionCost).toHaveBeenCalledWith(context, {
      type: "tokenUpdate",
      numSignatures: 1,
      tokenId: "t-USDT",
      listOperationsSize: 42,
      tokenOperationTypeCount: { transfer: 1 },
    });
  });

  // At energy 1001 and rate 2, buffering each half independently gives a fee of
  // 2403 against a deposit of 2404 — one µCCD short of its own header.
  it("prices the buffered energy rather than buffering the cost", async () => {
    getTransactionCost.mockResolvedValue({ cost: "2002", energy: 1001 });

    const result = await estimateTokenFees(context, {
      tokenId: "t-USDT",
      listOperationsSize: 42,
    });

    expect(result.energy).toBe(BigInt(1202));
    expect(result.cost).toBe(BigInt(2404));
    expect(result.cost).toBeGreaterThan(applyEnergyBuffer(BigInt(2002), 20));
  });

  // Both halves carry the buffer, or the fee shown and the energy signed drift
  // apart and the device contradicts the wallet.
  it("buffers cost and energy alike", async () => {
    getTransactionCost.mockResolvedValue({ cost: "3000", energy: 900 });

    const result = await estimateTokenFees(context, {
      tokenId: "t-USDT",
      listOperationsSize: 42,
    });

    expect(result).toEqual({ cost: BigInt(3600), energy: BigInt(1080) });
  });

  it("applies the buffer the coin config sets", async () => {
    getTransactionCost.mockResolvedValue({ cost: "3000", energy: 900 });
    const params = { tokenId: "t-USDT", listOperationsSize: 42 };

    await expect(
      estimateTokenFees(
        createFixtureContext({ fees: { ...config.fees, pltEnergyBufferPercent: 50 } }),
        params,
      ),
    ).resolves.toEqual({ cost: BigInt(4500), energy: BigInt(1350) });
  });

  it("rejects an unusable buffer the coin config sets", async () => {
    getTransactionCost.mockResolvedValue({ cost: "3000", energy: 900 });
    const params = { tokenId: "t-USDT", listOperationsSize: 42 };

    await expect(
      estimateTokenFees(
        createFixtureContext({ fees: { ...config.fees, pltEnergyBufferPercent: 12.5 } }),
        params,
      ),
    ).rejects.toThrow(ConcordiumInvalidConfigError);
  });

  // There is no constant to substitute: the fee depends on the id's length and
  // the blob's size.
  it("rejects instead of fabricating a fallback", async () => {
    getTransactionCost.mockRejectedValue(new Error("proxy down"));

    await expect(
      estimateTokenFees(context, { tokenId: "t-USDT", listOperationsSize: 42 }),
    ).rejects.toThrow("proxy down");
  });

  it("never asks the proxy to price an operation it cannot price", async () => {
    getTransactionCost.mockResolvedValue({ cost: "3000", energy: 900 });

    await estimateTokenFees(context, { tokenId: "t-USDT", listOperationsSize: 42 });

    const [, params] = getTransactionCost.mock.calls[0];
    expect(Object.keys(params.tokenOperationTypeCount)).toEqual(["transfer"]);
  });
});
