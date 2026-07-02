import type {
  AssetInfo,
  BufferTxData,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { parseTransaction } from "viem/celo";

jest.mock("../network/client", () => ({
  getCeloClient: jest.fn(() => ({ getTransactionCount: jest.fn(async () => 7) })),
}));
jest.mock("./estimateFees", () => ({ estimateFees: jest.fn() }));
jest.mock("../network/registry", () => ({
  getRegistryAddressFor: jest.fn(async () => "0x1111111111111111111111111111111111111111"),
}));

import { estimateFees } from "./estimateFees";
import { craftTransaction } from "./craftTransaction";

const mockEstimate = estimateFees as jest.Mock;

const SENDER = "0xAAAa0000000000000000000000000000000000aA";
const RECIPIENT = "0x1234567890123456789012345678901234567890";
const USDC_CONTRACT = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";

const baseParams = {
  maxFeePerGas: 1000n,
  maxPriorityFeePerGas: 100n,
  gasLimit: 84000n,
  type: "eip1559" as const,
};

const fees = (parameters: Record<string, unknown> = baseParams): FeeEstimation => ({
  value: 1n,
  parameters,
});

const makeIntent = (
  asset: AssetInfo,
  overrides: Partial<TransactionIntent<MemoNotSupported, BufferTxData>> = {},
): TransactionIntent<MemoNotSupported, BufferTxData> => ({
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: 5n,
  asset,
  data: { type: "buffer", value: Buffer.from([]) },
  ...overrides,
});

describe("craftTransaction", () => {
  beforeEach(() => mockEstimate.mockReset());

  it("crafts a native CELO send (eip1559) using the provided fees and sequence", async () => {
    const crafted = await craftTransaction(
      makeIntent({ type: "native" }, { sequence: 3n }),
      fees(),
    );
    const tx = parseTransaction(crafted.transaction as `0x${string}`);

    expect(mockEstimate).not.toHaveBeenCalled();
    expect(tx.type).toBe("eip1559");
    expect(tx.to?.toLowerCase()).toBe(RECIPIENT.toLowerCase());
    expect(tx.value).toBe(5n);
    expect(tx.nonce).toBe(3);
    expect(tx.chainId).toBe(42220);
    expect(tx.gas).toBe(84000n);
    expect(tx.maxFeePerGas).toBe(1000n);
  });

  it("crafts an ERC-20 token transfer (to contract, value 0, transfer calldata)", async () => {
    const crafted = await craftTransaction(
      makeIntent({ type: "erc20", assetReference: USDC_CONTRACT }, { sequence: 0n, amount: 1000n }),
      fees(),
    );
    const tx = parseTransaction(crafted.transaction as `0x${string}`);

    expect(tx.to?.toLowerCase()).toBe(USDC_CONTRACT.toLowerCase());
    expect(tx.value ?? 0n).toBe(0n);
    expect(tx.data?.startsWith("0xa9059cbb")).toBe(true);
  });

  it("crafts a CIP-64 transaction when a fee currency is set", async () => {
    const crafted = await craftTransaction(
      makeIntent({ type: "erc20", assetReference: USDC_CONTRACT }, { sequence: 1n }),
      fees({ ...baseParams, feeCurrency: USDC_ADAPTER, type: "cip64" }),
    );
    const tx = parseTransaction(crafted.transaction as `0x${string}`);

    expect(tx.type).toBe("cip64");
    expect((tx as { feeCurrency?: string }).feeCurrency?.toLowerCase()).toBe(
      USDC_ADAPTER.toLowerCase(),
    );
  });

  it("self-estimates fees when no customFees are provided", async () => {
    mockEstimate.mockResolvedValue(fees());
    const intent = makeIntent({ type: "native" }, { sequence: 2n });

    const crafted = await craftTransaction(intent);
    const tx = parseTransaction(crafted.transaction as `0x${string}`);

    expect(mockEstimate).toHaveBeenCalledWith(intent, undefined);
    expect(tx.type).toBe("eip1559");
  });

  it("fetches the nonce from the node when the intent has no sequence", async () => {
    const crafted = await craftTransaction(makeIntent({ type: "native" }), fees());
    const tx = parseTransaction(crafted.transaction as `0x${string}`);

    expect(tx.nonce).toBe(7);
  });

  it("routes a staking intent through the staking builder (register → Accounts contract)", async () => {
    const intent = {
      intentType: "staking",
      type: "celo.register",
      sender: SENDER,
      recipient: "",
      amount: 0n,
      asset: { type: "native" },
      data: { type: "buffer", value: Buffer.from([]) },
    } as unknown as Parameters<typeof craftTransaction>[0];

    const crafted = await craftTransaction(intent, fees());
    const tx = parseTransaction(crafted.transaction as `0x${string}`);

    // `to` is the Accounts registry contract, not the (empty) recipient — proves staking routing
    expect(tx.to?.toLowerCase()).toBe("0x1111111111111111111111111111111111111111");
    expect(tx.value ?? 0n).toBe(0n);
    expect(mockEstimate).not.toHaveBeenCalled();
  });
});
