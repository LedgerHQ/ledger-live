import { createFixtureConfig } from "../../test/fixtures";
import { CONCORDIUM_ENERGY } from "../../constants";
import { applyEnergyBuffer, estimateFees, estimateTokenFees } from "./estimateFees";

jest.mock("../../network/proxyClient", () => ({
  getTransactionCost: jest.fn(),
}));

const { getTransactionCost } = jest.requireMock("../../network/proxyClient");

const config = createFixtureConfig();
const CURRENCY_ID = "concordium_testnet";

describe("applyEnergyBuffer", () => {
  it("adds 20 percent", () => {
    expect(applyEnergyBuffer(BigInt(100))).toBe(BigInt(120));
    expect(applyEnergyBuffer(BigInt(1000))).toBe(BigInt(1200));
  });

  // Truncating would hand back the input unchanged for a small enough estimate,
  // which is a buffer in name only.
  it("rounds up rather than truncating", () => {
    expect(applyEnergyBuffer(BigInt(1))).toBe(BigInt(2));
    expect(applyEnergyBuffer(BigInt(501))).toBe(BigInt(602));
  });

  it("leaves zero at zero", () => {
    expect(applyEnergyBuffer(BigInt(0))).toBe(BigInt(0));
  });
});

describe("estimateFees", () => {
  beforeEach(() => jest.clearAllMocks());

  it("prices a simpleTransfer and does not buffer it", async () => {
    getTransactionCost.mockResolvedValue({ cost: "1000", energy: 501 });

    const result = await estimateFees(config, CURRENCY_ID);

    expect(getTransactionCost).toHaveBeenCalledWith(config, CURRENCY_ID, {
      type: "simpleTransfer",
      numSignatures: 1,
    });
    expect(result).toEqual({ cost: BigInt(1000), energy: BigInt(501) });
  });

  // The size is the CBOR-encoded length, not the string length: the proxy
  // charges for the bytes that reach the chain.
  it("passes the encoded memo size", async () => {
    getTransactionCost.mockResolvedValue({ cost: "1200", energy: 520 });

    await estimateFees(config, CURRENCY_ID, "test");

    expect(getTransactionCost).toHaveBeenCalledWith(config, CURRENCY_ID, {
      type: "simpleTransfer",
      numSignatures: 1,
      memoSize: 5,
    });
  });

  it("pins a simple transfer to the documented fixed energy", async () => {
    getTransactionCost.mockResolvedValue({ cost: "1000000", energy: "501" });

    const result = await estimateFees(config, CURRENCY_ID);

    expect(result.energy).toBe(CONCORDIUM_ENERGY.SIMPLE_TRANSFER);
  });

  it("falls back to the fixed energy when the proxy fails", async () => {
    getTransactionCost.mockRejectedValue(new Error("proxy down"));

    await expect(estimateFees(config, CURRENCY_ID)).resolves.toEqual({
      cost: CONCORDIUM_ENERGY.DEFAULT_COST,
      energy: CONCORDIUM_ENERGY.DEFAULT,
    });
  });

  it("falls back to the memo ceiling when the proxy fails on a memo transfer", async () => {
    getTransactionCost.mockRejectedValue(new Error("proxy down"));

    await expect(estimateFees(config, CURRENCY_ID, "hello")).resolves.toEqual({
      cost: CONCORDIUM_ENERGY.DEFAULT_COST,
      energy: CONCORDIUM_ENERGY.TRANSFER_WITH_MEMO_MAX,
    });
  });
});

describe("estimateTokenFees", () => {
  beforeEach(() => jest.clearAllMocks());

  it("prices a tokenUpdate for a single transfer", async () => {
    getTransactionCost.mockResolvedValue({ cost: "3000", energy: 900 });

    await estimateTokenFees(config, CURRENCY_ID, { tokenId: "t-USDT", listOperationsSize: 42 });

    expect(getTransactionCost).toHaveBeenCalledWith(config, CURRENCY_ID, {
      type: "tokenUpdate",
      numSignatures: 1,
      tokenId: "t-USDT",
      listOperationsSize: 42,
      tokenOperationTypeCount: { transfer: 1 },
    });
  });

  // Both halves carry the buffer, or the fee shown and the energy signed drift
  // apart and the device contradicts the wallet.
  it("buffers cost and energy alike", async () => {
    getTransactionCost.mockResolvedValue({ cost: "3000", energy: 900 });

    const result = await estimateTokenFees(config, CURRENCY_ID, {
      tokenId: "t-USDT",
      listOperationsSize: 42,
    });

    expect(result).toEqual({ cost: BigInt(3600), energy: BigInt(1080) });
  });

  // There is no constant to substitute: the fee depends on the id's length and
  // the blob's size.
  it("rejects instead of fabricating a fallback", async () => {
    getTransactionCost.mockRejectedValue(new Error("proxy down"));

    await expect(
      estimateTokenFees(config, CURRENCY_ID, { tokenId: "t-USDT", listOperationsSize: 42 }),
    ).rejects.toThrow("proxy down");
  });

  it("never asks the proxy to price an operation it cannot price", async () => {
    getTransactionCost.mockResolvedValue({ cost: "3000", energy: 900 });

    await estimateTokenFees(config, CURRENCY_ID, { tokenId: "t-USDT", listOperationsSize: 42 });

    const [, , params] = getTransactionCost.mock.calls[0];
    expect(Object.keys(params.tokenOperationTypeCount)).toEqual(["transfer"]);
  });
});
