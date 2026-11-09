import {
  FeeEstimateSchema,
  PreparedTransactionSchema,
  SendRequestSchema,
  type FeeEstimate,
  type PreparedTransaction,
  type SendRequest,
} from "./schema";

export function mockSendRequest(overrides: Partial<Record<string, unknown>> = {}): SendRequest {
  return SendRequestSchema.parse({
    assetId: "ethereum",
    recipient: "0x0000000000000000000000000000000000000002",
    amount: "1000",
    ...overrides,
  });
}

export function mockPreparedTransaction(
  overrides: Partial<Record<string, unknown>> = {},
): PreparedTransaction {
  return PreparedTransactionSchema.parse({
    request: mockSendRequest(),
    amount: "1000",
    fees: "21",
    feeAssetId: "ethereum",
    totalSpent: "1021",
    errors: [],
    warnings: [],
    payload: { nonce: 1 },
    ...overrides,
  });
}

export function mockFeeEstimate(overrides: Partial<Record<string, unknown>> = {}): FeeEstimate {
  return FeeEstimateSchema.parse({
    strategy: "medium",
    fees: "21",
    feeAssetId: "ethereum",
    ...overrides,
  });
}
