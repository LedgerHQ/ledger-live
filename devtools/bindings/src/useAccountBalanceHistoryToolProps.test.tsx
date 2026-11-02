import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra } from "@domain/api-account-data";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { accountBalanceHistoriesSlice } from "@domain/entity-account-balance-history";
import { mockAssetBalanceHistory } from "@domain/entity-account-balance-history/schema.mock";
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import { useAccountBalanceHistoryToolProps } from "./useAccountBalanceHistoryToolProps";

const ethereum = mockAddressAccountDescriptor();
const bitcoin = mockUtxoAccountDescriptor();
const ethereumUUID = computeAccountUUID(ethereum);
const bitcoinUUID = computeAccountUUID(bitcoin);

function setup({ fail = false } = {}) {
  const reads: { accountUUID: string; range?: string }[] = [];
  const store = configureStore({
    reducer: {
      accountEntries: accountsSlice.reducer,
      accountBalanceHistories: accountBalanceHistoriesSlice.reducer,
      accountData: accountDataSlice.reducer,
    },
    middleware: getDefault =>
      getDefault({
        thunk: {
          extraArgument: accountDataExtra([
            {
              id: AccountDataSourceIdSchema.parse("controlled"),
              supports: () => true,
              read: {
                balanceHistory: async ({ accountUUID }, query) => {
                  reads.push({ accountUUID, range: query?.range });
                  if (fail) throw new Error("down");
                  return {
                    range: query?.range ?? "month",
                    series: [
                      mockAssetBalanceHistory({
                        points: [
                          { date: "2026-01-01T00:00:00.000Z", balance: "0" },
                          { date: "2026-01-02T00:00:00.000Z", balance: "1500000000000000000" },
                        ],
                      }),
                    ],
                  };
                },
              },
            },
          ]),
        },
      }),
  });
  store.dispatch(
    legacyAccountsSynced([
      { accountUUID: ethereumUUID, descriptor: ethereum, legacyId: AccountIdSchema.parse("eth") },
      { accountUUID: bitcoinUUID, descriptor: bitcoin, legacyId: AccountIdSchema.parse("btc") },
    ]),
  );
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(() => useAccountBalanceHistoryToolProps(), { wrapper });
  return { result, reads };
}

describe("useAccountBalanceHistoryToolProps", () => {
  it("lists every account, unread, on the default range", () => {
    const { result } = setup();
    expect(result.current.range).toBe("month");
    expect(result.current.ranges).toEqual(["day", "week", "month", "year", "all"]);
    expect(result.current.accounts).toEqual([
      expect.objectContaining({ accountUUID: ethereumUUID, reading: false, series: undefined }),
      expect.objectContaining({ accountUUID: bitcoinUUID, readAt: undefined }),
    ]);
  });

  it("reads one account for the selected range and shows its series", async () => {
    const { result, reads } = setup();
    act(() => result.current.onRangeChange("week"));
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(result.current.accounts[0].series).toBeDefined());
    expect(reads).toEqual([{ accountUUID: ethereumUUID, range: "week" }]);
    expect(result.current.accounts[0]).toEqual(
      expect.objectContaining({
        sourceId: "controlled",
        error: undefined,
        series: [
          {
            assetId: "ethereum",
            pointCount: 2,
            firstDate: "2026-01-01T00:00:00.000Z",
            lastDate: "2026-01-02T00:00:00.000Z",
            firstBalance: expect.stringMatching(/^0\sETH$/),
            lastBalance: expect.stringMatching(/^1\.5\sETH$/),
            values: [0, 1500000000000000000],
          },
        ],
      }),
    );
  });

  it("shows the series of the selected range only", async () => {
    const { result } = setup();
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(result.current.accounts[0].series).toBeDefined());
    act(() => result.current.onRangeChange("year"));
    expect(result.current.accounts[0].series).toBeUndefined();
  });

  it("ignores a range it does not know", () => {
    const { result } = setup();
    act(() => result.current.onRangeChange("decade"));
    expect(result.current.range).toBe("month");
  });

  it("shows the error of a failed read", async () => {
    const { result } = setup({ fail: true });
    act(() => result.current.onRead(ethereumUUID));
    await waitFor(() => expect(result.current.accounts[0].error).toBe("Error: down"));
  });

  it("reads every account on read all", async () => {
    const { result, reads } = setup();
    act(() => result.current.onReadAll());
    await waitFor(() => expect(reads).toHaveLength(2));
    expect(reads.map(r => r.accountUUID).sort()).toEqual([ethereumUUID, bitcoinUUID].sort());
  });
});
