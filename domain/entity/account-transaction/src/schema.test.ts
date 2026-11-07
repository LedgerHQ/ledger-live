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

  it("should keep a source payload only when it is plain JSON", () => {
    expect(PreparedTransactionSchema.safeParse(mockPreparedTransaction()).success).toBe(true);
    const binary = { ...mockPreparedTransaction(), payload: { raw: new Uint8Array([1]) } };
    expect(PreparedTransactionSchema.safeParse(binary).success).toBe(false);
  });
});
