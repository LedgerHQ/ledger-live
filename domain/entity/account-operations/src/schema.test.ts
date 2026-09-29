import { AccountOperationSchema, initialAccountOperationsState } from "./schema";
import { mockAccountOperation } from "./schema.mock";

describe("AccountOperationSchema", () => {
  it("accepts the mock", () => {
    expect(AccountOperationSchema.parse(mockAccountOperation())).toEqual(mockAccountOperation());
  });

  it("honors overrides on the mock", () => {
    expect(mockAccountOperation({ type: "OUT" }).type).toBe("OUT");
  });

  it("accepts an operation on a token account", () => {
    const tokenAccountId = "js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin";
    expect(mockAccountOperation({ accountId: tokenAccountId as never }).accountId).toBe(
      tokenAccountId,
    );
  });

  it("accepts a pending operation with no block height", () => {
    expect(mockAccountOperation({ blockHeight: null }).blockHeight).toBeNull();
  });

  it("rejects a float-encoded or negative amount", () => {
    expect(() =>
      AccountOperationSchema.parse({ ...mockAccountOperation(), value: "1e18" }),
    ).toThrow();
    expect(() => AccountOperationSchema.parse({ ...mockAccountOperation(), fee: "-1" })).toThrow();
  });

  it("rejects a non-ISO date", () => {
    expect(() =>
      AccountOperationSchema.parse({ ...mockAccountOperation(), date: "2026-01-31" }),
    ).toThrow();
  });

  it("rejects an empty id, hash, type or account id", () => {
    for (const field of ["id", "hash", "type", "accountId"] as const) {
      expect(() =>
        AccountOperationSchema.parse({ ...mockAccountOperation(), [field]: "" }),
      ).toThrow();
    }
  });

  it("rejects a negative or fractional block height", () => {
    expect(() =>
      AccountOperationSchema.parse({ ...mockAccountOperation(), blockHeight: -1 }),
    ).toThrow();
    expect(() =>
      AccountOperationSchema.parse({ ...mockAccountOperation(), blockHeight: 1.5 }),
    ).toThrow();
  });

  it("makes hasFailed and parentOperationId optional", () => {
    const { hasFailed, parentOperationId } = mockAccountOperation();
    expect(hasFailed).toBeUndefined();
    expect(parentOperationId).toBeUndefined();
  });
});

describe("initialAccountOperationsState", () => {
  it("starts empty", () => {
    expect(initialAccountOperationsState).toEqual({ byAccount: {}, status: {} });
  });
});
