import { FiatCurrencyTickerSchema } from "@domain/entity-currency-fiat";
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
    [accountUUID]: { week: { revision: 0, series: [eth, usdt] } },
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

describe("selectAccountBalanceHistory with a countervalue", () => {
  const point = { date: "2026-01-01T00:00:00.000Z", balance: "5" };
  const valued = mockAssetBalanceHistory({
    points: [{ ...point, countervalues: { USD: "100", EUR: "90" } }],
  });
  const valuedState = {
    accountBalanceHistories: mockAccountBalanceHistoriesState({
      [accountUUID]: { week: { revision: 0, series: [valued] } },
    }),
  };
  const usd = FiatCurrencyTickerSchema.parse("USD");

  it("should keep only the asked countervalue on each point", () => {
    expect(selectAccountBalanceHistory(valuedState, accountUUID, "week", usd)).toEqual([
      { assetId: "ethereum", points: [{ ...point, countervalues: { USD: "100" } }] },
    ]);
  });

  it("should show no countervalue without one asked, or for one never read", () => {
    const jpy = FiatCurrencyTickerSchema.parse("JPY");
    const plain = [{ assetId: "ethereum", points: [point] }];
    expect(selectAccountBalanceHistory(valuedState, accountUUID, "week")).toEqual(plain);
    expect(selectAccountBalanceHistory(valuedState, accountUUID, "week", jpy)).toEqual(plain);
  });

  it("should return the same series while the state and the arguments stay the same", () => {
    expect(selectAccountBalanceHistory(valuedState, accountUUID, "week", usd)).toBe(
      selectAccountBalanceHistory(valuedState, accountUUID, "week", usd),
    );
  });

  it("should pass the countervalue to the series of one asset", () => {
    expect(
      selectAccountAssetBalanceHistory(valuedState, accountUUID, "week", valued.assetId, usd)
        ?.points[0]?.countervalues,
    ).toEqual({ USD: "100" });
  });
});
