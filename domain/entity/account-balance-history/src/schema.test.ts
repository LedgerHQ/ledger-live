import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  AccountBalanceHistoriesStateSchema,
  AccountBalanceHistorySchema,
  AssetBalanceHistorySchema,
  BALANCE_HISTORY_RANGES,
  initialAccountBalanceHistoriesState,
} from "./schema";
import { mockAssetBalanceHistory } from "./schema.mock";

const point = { date: "2026-01-01T00:00:00.000Z", balance: "10" };

describe("AssetBalanceHistorySchema", () => {
  it("should accept a mocked series", () => {
    expect(AssetBalanceHistorySchema.safeParse(mockAssetBalanceHistory()).success).toBe(true);
  });

  it("should accept a token series", () => {
    expect(mockAssetBalanceHistory({ assetId: "ethereum/erc20/usd-tether" }).assetId).toBe(
      "ethereum/erc20/usd-tether",
    );
  });

  it("should accept a series without points", () => {
    expect(mockAssetBalanceHistory({ points: [] }).points).toEqual([]);
  });

  it("should reject an empty asset id", () => {
    expect(AssetBalanceHistorySchema.safeParse({ assetId: "", points: [point] }).success).toBe(
      false,
    );
  });

  it.each(["-1", "1.5", "abc", ""])("should reject the balance %j", balance => {
    expect(
      AssetBalanceHistorySchema.safeParse({ assetId: "ethereum", points: [{ ...point, balance }] })
        .success,
    ).toBe(false);
  });

  it("should reject a date that is not ISO", () => {
    expect(
      AssetBalanceHistorySchema.safeParse({
        assetId: "ethereum",
        points: [{ ...point, date: "yesterday" }],
      }).success,
    ).toBe(false);
  });
});

describe("AccountBalanceHistorySchema", () => {
  it.each(BALANCE_HISTORY_RANGES)("should accept the range %s", range => {
    expect(
      AccountBalanceHistorySchema.safeParse({ range, series: [mockAssetBalanceHistory()] }).success,
    ).toBe(true);
  });

  it("should reject an unknown range", () => {
    expect(AccountBalanceHistorySchema.safeParse({ range: "decade", series: [] }).success).toBe(
      false,
    );
  });
});

describe("AccountBalanceHistoriesStateSchema", () => {
  const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());

  it("should accept an empty initial state", () => {
    expect(AccountBalanceHistoriesStateSchema.parse(initialAccountBalanceHistoriesState)).toEqual(
      {},
    );
  });

  it("should accept series keyed by AccountUUID then range", () => {
    const stored = { [accountUUID]: { week: [mockAssetBalanceHistory()] } };
    expect(AccountBalanceHistoriesStateSchema.parse(stored)).toEqual(stored);
  });

  it("should reject a key that is not an AccountUUID", () => {
    expect(AccountBalanceHistoriesStateSchema.safeParse({ nope: { week: [] } }).success).toBe(
      false,
    );
  });

  it("should reject a key that is not a range", () => {
    expect(
      AccountBalanceHistoriesStateSchema.safeParse({ [accountUUID]: { decade: [] } }).success,
    ).toBe(false);
  });
});
