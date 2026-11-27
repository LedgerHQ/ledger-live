import {
  mockAgentIntentRecord,
  mockAgentIntentSignatureReceipt,
  mockAgentIntentStats,
  mockAgentProfileRecord,
  mockEvmAgentIntentCraft,
  mockEvmSendOperation,
  mockSolanaAgentIntentCraft,
  mockSolanaSendOperation,
  mockSwapOperation,
} from "./schema.mock";

describe("agent intent mocks", () => {
  it("should build schema-valid values", () => {
    expect(() => [
      mockEvmSendOperation(),
      mockSolanaSendOperation(),
      mockSwapOperation(),
      mockAgentIntentRecord(),
      mockAgentIntentStats(),
      mockEvmAgentIntentCraft(),
      mockSolanaAgentIntentCraft(),
      mockAgentIntentSignatureReceipt(),
      mockAgentProfileRecord(),
    ]).not.toThrow();
  });

  it("should apply overrides", () => {
    expect(mockAgentIntentRecord({ status: "signed" }).status).toBe("signed");
    expect(mockEvmSendOperation({ amount: "42" }).amount).toBe("42");
    expect(mockAgentIntentStats({ total: 3 }).total).toBe(3);
    expect(mockEvmAgentIntentCraft({ revision: 2 }).revision).toBe(2);
    expect(mockAgentProfileRecord({ agentPubkey: "03ff" }).agentPubkey).toBe("03ff");
  });

  it("should keep an unknown intent type through a nested mock", () => {
    const record = mockAgentIntentRecord({ intent: { type: "stake" } });

    expect(mockAgentIntentRecord(record).intent).toEqual({
      type: "unknown",
      receivedType: "stake",
    });
  });

  it("should reject an override the schema refuses", () => {
    expect(() => mockAgentIntentRecord({ createdAt: "yesterday" })).toThrow("Invalid ISO datetime");
  });
});
