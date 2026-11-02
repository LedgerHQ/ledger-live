import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAssetBalanceHistory } from "./schema.mock";
import { selectAccountAssetBalanceHistory, selectAccountBalanceHistory } from "./selectors";
import { mockAccountBalanceHistoriesState } from "./slice.mock";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const missingAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ address: "0x0000000000000000000000000000000000000001" }),
);
const eth = mockAssetBalanceHistory();
const usdt = mockAssetBalanceHistory({ assetId: "ethereum/erc20/usd-tether" });
const state = {
  accountBalanceHistories: mockAccountBalanceHistoriesState({
    [accountUUID]: { week: [eth, usdt] },
  }),
};

describe("selectAccountBalanceHistory", () => {
  it("should return every series read for the range", () => {
    expect(selectAccountBalanceHistory(state, accountUUID, "week")).toEqual([eth, usdt]);
  });

  it("should return undefined for a range never read", () => {
    expect(selectAccountBalanceHistory(state, accountUUID, "year")).toBeUndefined();
  });

  it("should return undefined for an account never read", () => {
    expect(selectAccountBalanceHistory(state, missingAccountUUID, "week")).toBeUndefined();
  });
});

describe("selectAccountAssetBalanceHistory", () => {
  it("should return the series of the native coin", () => {
    expect(selectAccountAssetBalanceHistory(state, accountUUID, "week", eth.assetId)).toEqual(eth);
  });

  it("should return the series of a token", () => {
    expect(selectAccountAssetBalanceHistory(state, accountUUID, "week", usdt.assetId)).toEqual(
      usdt,
    );
  });

  it("should return undefined when the account does not hold the asset", () => {
    const bitcoin = mockAssetBalanceHistory({ assetId: "bitcoin" }).assetId;
    expect(selectAccountAssetBalanceHistory(state, accountUUID, "week", bitcoin)).toBeUndefined();
  });

  it("should return undefined for a range never read", () => {
    expect(
      selectAccountAssetBalanceHistory(state, accountUUID, "day", eth.assetId),
    ).toBeUndefined();
  });
});
