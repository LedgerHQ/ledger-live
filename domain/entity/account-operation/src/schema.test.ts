import { AccountOperationSchema, OPERATION_TYPES } from "./schema";
import { mockAccountOperation } from "./schema.mock";

describe("AccountOperationSchema", () => {
  it("should accept a mocked operation", () => {
    expect(AccountOperationSchema.safeParse(mockAccountOperation()).success).toBe(true);
  });

  it("should accept every operation type", () => {
    for (const type of OPERATION_TYPES) {
      expect(AccountOperationSchema.safeParse(mockAccountOperation({ type })).success).toBe(true);
    }
  });

  it("should reject an unknown operation type", () => {
    expect(() => mockAccountOperation({ type: "SWAP" })).toThrow();
  });

  it("should accept a pending operation without block height", () => {
    expect(mockAccountOperation({ blockHeight: null }).blockHeight).toBeNull();
  });

  it.each(["-1", "1.5", "abc"])("should reject the amount %s", value => {
    expect(() => mockAccountOperation({ value })).toThrow();
    expect(() => mockAccountOperation({ fee: value })).toThrow();
  });

  it("should reject an empty id, hash or address", () => {
    expect(() => mockAccountOperation({ id: "" })).toThrow();
    expect(() => mockAccountOperation({ hash: "" })).toThrow();
    expect(() => mockAccountOperation({ senders: [""] })).toThrow();
    expect(() => mockAccountOperation({ recipients: [""] })).toThrow();
  });

  it("should reject a date that is not ISO", () => {
    expect(() => mockAccountOperation({ date: "yesterday" })).toThrow();
  });

  it("should keep the parent id of a token operation", () => {
    const operation = mockAccountOperation({ id: "op-1-token", parentId: "op-1" });
    expect(operation.parentId).toBe("op-1");
  });
});
