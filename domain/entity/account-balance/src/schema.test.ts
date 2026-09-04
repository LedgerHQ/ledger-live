import {
  AccountBalanceSchema,
  AccountBalanceRowsSchema,
  initialAccountBalancesState,
} from "./schema";
import { mockAccountBalance, mockTokenAccountBalance } from "./schema.mock";

describe("AccountBalanceSchema", () => {
  it("accepts the main-account mock", () => {
    expect(AccountBalanceSchema.parse(mockAccountBalance())).toEqual(mockAccountBalance());
  });

  it("accepts the token-account mock", () => {
    expect(AccountBalanceSchema.parse(mockTokenAccountBalance())).toEqual(
      mockTokenAccountBalance(),
    );
  });

  it("honors overrides on the mocks", () => {
    const balance = mockAccountBalance({ balance: mockTokenAccountBalance().balance });
    expect(balance.balance).toBe("2500000");
  });

  it("rejects a float-encoded balance in the wrong shape", () => {
    expect(() =>
      AccountBalanceSchema.parse({ ...mockAccountBalance(), balance: "1e18" }),
    ).toThrow();
  });

  it("rejects a non-ISO date", () => {
    expect(() =>
      AccountBalanceSchema.parse({ ...mockAccountBalance(), at: "2026-01-31" }),
    ).toThrow();
  });

  it("rejects an empty account id", () => {
    expect(() => AccountBalanceSchema.parse({ ...mockAccountBalance(), accountId: "" })).toThrow();
  });

  it("makes parentId optional", () => {
    expect(AccountBalanceSchema.parse(mockAccountBalance()).parentId).toBeUndefined();
  });
});

describe("AccountBalanceRowsSchema", () => {
  it("starts empty", () => {
    expect(AccountBalanceRowsSchema.parse(initialAccountBalancesState.rows)).toEqual({});
  });

  it("accepts a populated table", () => {
    const main = mockAccountBalance();
    const token = mockTokenAccountBalance();
    const table = { [main.accountId]: main, [token.accountId]: token };
    expect(AccountBalanceRowsSchema.parse(table)).toEqual(table);
  });

  it("rejects a row that does not match the schema", () => {
    const main = mockAccountBalance();
    expect(() =>
      AccountBalanceRowsSchema.parse({ [main.accountId]: { ...main, balance: "oops" } }),
    ).toThrow();
  });

  it("rejects a blank key, which no lookup could ever hit", () => {
    const main = mockAccountBalance();
    expect(() => AccountBalanceRowsSchema.parse({ "": main })).toThrow();
  });
});
