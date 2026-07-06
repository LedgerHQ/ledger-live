import type {
  AssetInfo,
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";

jest.mock("../network/sdk", () => ({
  getFeeMarketGasParams: jest.fn(async () => ({ maxFeePerGas: 1000n, maxPriorityFeePerGas: 100n })),
}));
jest.mock("../network/client", () => ({
  celoEstimateGas: jest.fn(async () => 21000n),
  getCeloClient: jest.fn(() => ({ getTransactionCount: jest.fn(async () => 0) })),
}));

import { parseTransaction } from "viem/celo";
import { combine } from "./combine";
import { craftTransaction } from "./craftTransaction";
import { estimateFees } from "./estimateFees";

const SENDER = "0xAAAa0000000000000000000000000000000000aA";
const RECIPIENT = "0x1234567890123456789012345678901234567890";
const USDC_CONTRACT = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";
const SIG = { r: `0x${"11".repeat(32)}`, s: `0x${"22".repeat(32)}`, v: 27 };

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

// Verifies the estimate↔craft handshake: the `parameters` produced by estimateFees
// must be directly consumable by craftTransaction, all the way to a signable tx.
describe("api integration: estimate → craft → combine", () => {
  it("native CELO: estimated fees produce a signable eip1559 transaction", async () => {
    const intent = makeIntent({ type: "native" }, { sequence: 0n });

    const fees = await estimateFees(intent);
    const crafted = await craftTransaction(intent, fees);
    const tx = parseTransaction(combine(crafted.transaction, SIG) as `0x${string}`);

    expect(tx.type).toBe("eip1559");
    expect(tx.to?.toLowerCase()).toBe(RECIPIENT.toLowerCase());
    expect(tx.value).toBe(5n);
    expect(tx.maxFeePerGas).toBe(1000n);
    expect(tx.gas).toBe(84000n);
    expect(tx.r).toBe(SIG.r);
  });

  it("token + CIP-64: the fee currency flows from estimate into a signable cip64 transaction", async () => {
    const intent = makeIntent(
      { type: "erc20", assetReference: USDC_CONTRACT },
      { sequence: 0n, amount: 1000n },
    );

    const fees = await estimateFees(intent, { feeCurrency: USDC_CONTRACT });
    expect(fees.parameters?.feeCurrency).toBe(USDC_ADAPTER);

    const crafted = await craftTransaction(intent, fees);
    const tx = parseTransaction(combine(crafted.transaction, SIG) as `0x${string}`);

    expect(tx.type).toBe("cip64");
    expect((tx as { feeCurrency?: string }).feeCurrency?.toLowerCase()).toBe(
      USDC_ADAPTER.toLowerCase(),
    );
    expect(tx.to?.toLowerCase()).toBe(USDC_CONTRACT.toLowerCase());
    expect(tx.data?.startsWith("0xa9059cbb")).toBe(true);
  });
});
