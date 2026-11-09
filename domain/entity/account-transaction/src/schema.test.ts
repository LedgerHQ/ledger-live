import { mockPreparedTransaction, mockSendRequest } from "./schema.mock";
import { PreparedTransactionSchema, SendRequestSchema } from "./schema";

describe("account transaction schemas", () => {
  it("should accept a send request in the asset's smallest unit only", () => {
    expect(SendRequestSchema.safeParse(mockSendRequest()).success).toBe(true);
    expect(SendRequestSchema.safeParse({ ...mockSendRequest(), amount: "1.5" }).success).toBe(
      false,
    );
    expect(SendRequestSchema.safeParse({ ...mockSendRequest(), recipient: "" }).success).toBe(
      false,
    );
  });

  it("should carry what every send flow asks for: typed memo, custom fees, sponsored fee asset, network options", () => {
    const full = mockSendRequest({
      recipientDomain: "vitalik.eth",
      feeStrategy: "custom",
      customFees: { maxFeePerGas: "30000000000", maxPriorityFeePerGas: "1000000000" },
      feeAssetId: "ethereum/erc20/usd__coin",
      memo: { value: "42", type: "MEMO_ID" },
      familyOptions: { utxoStrategy: { strategy: 0, excludeUTXOs: [] }, rbf: true },
    });
    expect(SendRequestSchema.safeParse(full).success).toBe(true);
    expect(SendRequestSchema.safeParse({ ...full, customFees: { gasPrice: 1 } }).success).toBe(
      false,
    );
    expect(SendRequestSchema.safeParse({ ...full, feeStrategy: "" }).success).toBe(false);
  });

  it("should keep a source payload only when it is plain JSON", () => {
    expect(PreparedTransactionSchema.safeParse(mockPreparedTransaction()).success).toBe(true);
    const binary = { ...mockPreparedTransaction(), payload: { raw: new Uint8Array([1]) } };
    expect(PreparedTransactionSchema.safeParse(binary).success).toBe(false);
  });
});
