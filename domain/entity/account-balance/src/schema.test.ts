import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  AccountAssetBalanceSchema,
  AccountBalancesStateSchema,
  initialAccountBalancesState,
} from "./schema";
import { mockAccountAssetBalance } from "./schema.mock";

const row = {
  assetId: "ethereum",
  balance: "10",
  spendableBalance: "10",
};

describe("AccountAssetBalanceSchema", () => {
  it("should accept a native coin balance", () => {
    expect(AccountAssetBalanceSchema.parse(mockAccountAssetBalance())).toEqual(
      mockAccountAssetBalance(),
    );
  });

  it("should accept a zero balance", () => {
    expect(mockAccountAssetBalance({ balance: "0" })).toMatchObject({ balance: "0" });
  });

  it("should accept a zero spendable balance", () => {
    expect(mockAccountAssetBalance({ spendableBalance: "0" })).toMatchObject({
      spendableBalance: "0",
    });
  });

  it("should accept a spendable balance lower than the balance", () => {
    expect(mockAccountAssetBalance({ balance: "10", spendableBalance: "4" })).toMatchObject({
      balance: "10",
      spendableBalance: "4",
    });
  });

  it("should accept a token asset id", () => {
    expect(
      AccountAssetBalanceSchema.parse(
        mockAccountAssetBalance({ assetId: "ethereum/erc20/usd-tether" }),
      ).assetId,
    ).toBe("ethereum/erc20/usd-tether");
  });

  it("should reject an empty asset id", () => {
    expect(AccountAssetBalanceSchema.safeParse({ ...row, assetId: "" }).success).toBe(false);
  });

  it("should reject a negative balance", () => {
    expect(AccountAssetBalanceSchema.safeParse({ ...row, balance: "-1" }).success).toBe(false);
  });

  it("should reject a negative spendable balance", () => {
    expect(AccountAssetBalanceSchema.safeParse({ ...row, spendableBalance: "-1" }).success).toBe(
      false,
    );
  });

  it("should reject a fractional balance", () => {
    expect(AccountAssetBalanceSchema.safeParse({ ...row, balance: "1.5" }).success).toBe(false);
  });

  it("should reject a fractional spendable balance", () => {
    expect(AccountAssetBalanceSchema.safeParse({ ...row, spendableBalance: "1.5" }).success).toBe(
      false,
    );
  });

  it("should reject an empty balance", () => {
    expect(AccountAssetBalanceSchema.safeParse({ ...row, balance: "" }).success).toBe(false);
  });

  it("should reject a row without a spendable balance", () => {
    expect(
      AccountAssetBalanceSchema.safeParse({ assetId: row.assetId, balance: row.balance }).success,
    ).toBe(false);
  });
});

describe("AccountBalancesStateSchema", () => {
  const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());

  it("should accept an empty initial state", () => {
    expect(AccountBalancesStateSchema.parse(initialAccountBalancesState)).toEqual({});
  });

  it("should accept rows keyed by an AccountUUID", () => {
    const stored = { [accountUUID]: [mockAccountAssetBalance()] };
    expect(AccountBalancesStateSchema.parse(stored)).toEqual(stored);
  });

  it("should reject a key that is not an AccountUUID", () => {
    expect(
      AccountBalancesStateSchema.safeParse({ nope: [mockAccountAssetBalance()] }).success,
    ).toBe(false);
  });
});
