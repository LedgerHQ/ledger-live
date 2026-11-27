import type { z } from "zod";
import {
  AgentIntentCraftSchema,
  AgentIntentRecordSchema,
  AgentIntentSendOperationSchema,
  AgentIntentSignatureReceiptSchema,
  AgentIntentStatsSchema,
  AgentIntentSwapOperationSchema,
  AgentProfileRecordSchema,
} from "./schema";
import type {
  AgentIntentCraft,
  AgentIntentRecord,
  AgentIntentSendOperation,
  AgentIntentSignatureReceipt,
  AgentIntentStats,
  AgentIntentSwapOperation,
  AgentProfileRecord,
} from "./types";

type Overrides<Schema extends z.ZodType> = Partial<z.input<Schema>>;

const MOCK_AGENT_PUBKEY = "02a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";
const MOCK_DATE = "2026-11-26T10:00:00Z";

export function mockEvmSendOperation(
  overrides?: Overrides<typeof AgentIntentSendOperationSchema>,
): AgentIntentSendOperation {
  return AgentIntentSendOperationSchema.parse({
    type: "send",
    network: "ethereum",
    sender: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    recipient: "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF",
    amount: "1000000000000000",
    asset: { type: "native" },
    feeStrategy: "medium",
    ...overrides,
  });
}

export function mockSolanaSendOperation(
  overrides?: Overrides<typeof AgentIntentSendOperationSchema>,
): AgentIntentSendOperation {
  return AgentIntentSendOperationSchema.parse({
    type: "send",
    network: "solana",
    sender: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    amount: "1000000",
    asset: { type: "native" },
    ...overrides,
  });
}

export function mockSwapOperation(
  overrides?: Overrides<typeof AgentIntentSwapOperationSchema>,
): AgentIntentSwapOperation {
  return AgentIntentSwapOperationSchema.parse({
    type: "swap",
    network: "ethereum",
    sender: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    fromAsset: "ethereum",
    toAsset: "ethereum/erc20/usd__coin",
    fromAmount: "0.5",
    toAmount: "1643.31",
    provider: "oneinch",
    ...overrides,
  });
}

export function mockAgentIntentRecord(
  overrides?: Overrides<typeof AgentIntentRecordSchema>,
): AgentIntentRecord {
  return AgentIntentRecordSchema.parse({
    id: "019ac3e2-5b7d-7c41-9a2e-3f6b8d0c1e24",
    agentPubkey: MOCK_AGENT_PUBKEY,
    status: "created",
    intent: mockEvmSendOperation(),
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
    ...overrides,
  });
}

export function mockAgentIntentStats(
  overrides?: Overrides<typeof AgentIntentStatsSchema>,
): AgentIntentStats {
  return AgentIntentStatsSchema.parse({ total: 30, approved: 4, rejected: 20, ...overrides });
}

/** A valid, zero-value EIP-1559 transaction to the zero address: it must never be broadcast. */
export function mockEvmAgentIntentCraft(
  overrides?: Overrides<typeof AgentIntentCraftSchema>,
): AgentIntentCraft {
  return AgentIntentCraftSchema.parse({
    rawTransaction:
      "0x02e70180843b9aca0084773594008252089400000000000000000000000000000000000000008080c0",
    revision: 1,
    details: { gasLimit: "21000", maxFeePerGas: "2000000000", maxPriorityFeePerGas: "1000000000" },
    ...overrides,
  });
}

/** A legacy wire transaction: one empty signature slot, then a 0.01 SOL System Program transfer. */
export function mockSolanaAgentIntentCraft(
  overrides?: Overrides<typeof AgentIntentCraftSchema>,
): AgentIntentCraft {
  return AgentIntentCraftSchema.parse({
    rawTransaction:
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDEREREREREREREREREREREREREREREREREREREREREREiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY/rDlcGWd3XC4mlu87e9LYs3BWLS8FQ8qlHGk2ol+CIBAgIAAQwCAAAAgJaYAAAAAAA=",
    revision: 1,
    details: {
      recentBlockhash: "7jH94iKKrbCLFbggt3qBvkHx7DVcFXey1723JxTrm46d",
      lastValidBlockHeight: 490797854,
      estimatedFee: "5000",
    },
    ...overrides,
  });
}

export function mockAgentIntentSignatureReceipt(
  overrides?: Overrides<typeof AgentIntentSignatureReceiptSchema>,
): AgentIntentSignatureReceipt {
  return AgentIntentSignatureReceiptSchema.parse({
    transactionId: "0x8a3c4f1e2d5b6a7980c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d",
    ...overrides,
  });
}

export function mockAgentProfileRecord(
  overrides?: Overrides<typeof AgentProfileRecordSchema>,
): AgentProfileRecord {
  return AgentProfileRecordSchema.parse({
    agentPubkey: MOCK_AGENT_PUBKEY,
    profile: { name: "Research agent", description: "Pays for API calls.", source: "openclaw" },
    createdAt: MOCK_DATE,
    updatedAt: MOCK_DATE,
    ...overrides,
  });
}
