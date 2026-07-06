import type {
  AssetInfo,
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";

jest.mock("../network/sdk", () => ({
  getFeeMarketGasParams: jest.fn(),
}));
jest.mock("../network/client", () => ({
  celoEstimateGas: jest.fn(),
}));
jest.mock("../network/registry", () => ({
  getRegistryAddressFor: jest.fn(async () => "0x1111111111111111111111111111111111111111"),
}));

import { celoEstimateGas } from "../network/client";
import { getFeeMarketGasParams } from "../network/sdk";
import { estimateFees } from "./estimateFees";

const mockGasParams = getFeeMarketGasParams as jest.Mock;
const mockEstimateGas = celoEstimateGas as jest.Mock;

const SENDER = "0xAAAa0000000000000000000000000000000000aA";
const RECIPIENT = "0x1234567890123456789012345678901234567890";
const USDC_CONTRACT = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";

const makeIntent = (
  asset: AssetInfo,
  amount = 5n,
): TransactionIntent<MemoNotSupported, BufferTxData> => ({
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount,
  asset,
  data: { type: "buffer", value: Buffer.from([]) },
});

describe("estimateFees", () => {
  beforeEach(() => {
    mockGasParams.mockReset().mockResolvedValue({
      maxFeePerGas: 1000n,
      maxPriorityFeePerGas: 100n,
    });
    mockEstimateGas.mockReset().mockResolvedValue(21000n);
  });

  it("estimates a native CELO send with native gas (eip1559)", async () => {
    const fee = await estimateFees(makeIntent({ type: "native" }));

    expect(mockGasParams).toHaveBeenCalledWith(undefined);
    expect(mockEstimateGas).toHaveBeenCalledWith(
      expect.objectContaining({ from: SENDER, to: RECIPIENT, value: 5n }),
    );
    expect(fee.parameters?.type).toBe("eip1559");
    expect(fee.parameters?.feeCurrency).toBeUndefined();
    // gasLimit = estGas * MAX_FEES_THRESHOLD_MULTIPLIER (4); value = maxFeePerGas * gasLimit
    expect(fee.parameters?.gasLimit).toBe(84000n);
    expect(fee.value).toBe(84000000n);
  });

  it("estimates an ERC-20 token send with native gas (to contract, value 0)", async () => {
    const fee = await estimateFees(makeIntent({ type: "erc20", assetReference: USDC_CONTRACT }));

    expect(mockGasParams).toHaveBeenCalledWith(undefined);
    expect(mockEstimateGas).toHaveBeenCalledWith(
      expect.objectContaining({ from: SENDER, to: USDC_CONTRACT, value: 0n }),
    );
    expect(fee.parameters?.type).toBe("eip1559");
  });

  it("estimates with CIP-64 fee currency, threading the adapter address to gas calls", async () => {
    const fee = await estimateFees(makeIntent({ type: "erc20", assetReference: USDC_CONTRACT }), {
      feeCurrency: USDC_CONTRACT,
    });

    // contract address selection is normalized to the CIP-64 adapter address
    expect(mockGasParams).toHaveBeenCalledWith(USDC_ADAPTER);
    expect(mockEstimateGas).toHaveBeenCalledWith(
      expect.objectContaining({ feeCurrency: USDC_ADAPTER }),
    );
    expect(fee.parameters?.feeCurrency).toBe(USDC_ADAPTER);
    expect(fee.parameters?.type).toBe("cip64");
  });

  const makeRegisterIntent = () =>
    ({
      intentType: "staking",
      type: "celo.register",
      sender: SENDER,
      recipient: "",
      amount: 0n,
      asset: { type: "native" },
      data: { type: "buffer", value: Buffer.from([]) },
    }) as unknown as Parameters<typeof estimateFees>[0];

  it("estimates a staking intent via the staking builder (register → Accounts contract)", async () => {
    const fee = await estimateFees(makeRegisterIntent());

    expect(mockEstimateGas).toHaveBeenCalledWith(
      expect.objectContaining({
        from: SENDER,
        to: "0x1111111111111111111111111111111111111111",
        value: 0n,
      }),
    );
    expect(fee.parameters?.gasLimit).toBe(84000n);
  });

  it("falls back to a fixed gas limit when estimation reverts for a staking intent", async () => {
    mockEstimateGas.mockReset().mockRejectedValue(new Error("execution reverted"));

    const fee = await estimateFees(makeRegisterIntent());

    expect(fee.parameters?.gasLimit).toBe(1_000_000n);
    // value = maxFeePerGas (1000) * fallback gasLimit (1_000_000)
    expect(fee.value).toBe(1_000_000_000n);
  });

  it("rethrows a transient (non-revert) estimation error for a staking intent", async () => {
    // a network/timeout failure must surface, not be masked into a fallback fee
    mockEstimateGas
      .mockReset()
      .mockRejectedValue(new Error("HttpRequestError: connection timeout"));

    await expect(estimateFees(makeRegisterIntent())).rejects.toThrow(/timeout/);
  });

  it("rethrows estimation errors for non-staking intents", async () => {
    mockEstimateGas.mockReset().mockRejectedValue(new Error("boom"));

    await expect(estimateFees(makeIntent({ type: "native" }))).rejects.toThrow("boom");
  });
});
