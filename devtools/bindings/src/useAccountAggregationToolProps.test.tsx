import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { mockAccountAssetBalance } from "@domain/entity-account-balance/schema.mock";
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import { buildCV } from "@domain/entity-market-countervalues/mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  countervaluesInitialState,
  countervaluesReducer,
} from "@features/platform-market-countervalues";
import { createAccountDataRecorder } from "./accountDataRecorder";

const usd = getFiatCurrencyByTicker("USD");
import { useAccountAggregationToolProps } from "./useAccountAggregationToolProps";

const first = mockAddressAccountDescriptor({
  address: "0x1111111111111111111111111111111111111111",
});
const second = mockAddressAccountDescriptor({
  address: "0x2222222222222222222222222222222222222222",
});
const broken = mockAddressAccountDescriptor({
  address: "0x3333333333333333333333333333333333333333",
});
const bitcoin = mockUtxoAccountDescriptor();

/** Address accounts go to a batch source, the others to a one-by-one source. */
const sources: AccountDataSource[] = [
  {
    id: AccountDataSourceIdSchema.parse("batch"),
    supports: descriptor => descriptor.type === "address",
    readBatch: {
      balance: async targets =>
        targets.map(({ descriptor }) =>
          descriptor === broken
            ? { status: "rejected", reason: new Error("down") }
            : { status: "fulfilled", value: [mockAccountAssetBalance({ balance: "10" })] },
        ),
    },
  },
  {
    id: AccountDataSourceIdSchema.parse("single"),
    supports: descriptor => descriptor.type === "utxo",
    read: {
      balance: async () => [mockAccountAssetBalance({ assetId: "bitcoin", balance: "100000000" })],
    },
  },
];

function setup() {
  const recorder = createAccountDataRecorder();
  const store = configureStore({
    reducer: {
      accountEntries: accountsSlice.reducer,
      accountBalances: accountBalancesSlice.reducer,
      accountData: accountDataSlice.reducer,
      countervalues: countervaluesReducer,
    },
    preloadedState: {
      countervalues: {
        ...countervaluesInitialState,
        rates: buildCV({
          pair: { from: getCryptoCurrencyById("bitcoin"), to: usd },
          latest: 30_000,
        }),
      },
    },
    middleware: getDefault =>
      getDefault({
        thunk: { extraArgument: accountDataExtra(recorder.instrument(sources)) },
      }).concat(recorder.middleware),
  });
  store.dispatch(
    legacyAccountsSynced(
      [first, second, broken, bitcoin].map((descriptor, index) => ({
        accountUUID: computeAccountUUID(descriptor),
        descriptor,
        legacyId: AccountIdSchema.parse(`legacy-${index}`),
      })),
    ),
  );
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useAccountAggregationToolProps(recorder, { counterValueCurrency: usd }), {
    wrapper,
  });
}

describe("useAccountAggregationToolProps", () => {
  it("reads every account in one batch per source and sums the answers", async () => {
    const { result } = setup();
    expect(result.current.accountCount).toBe(4);

    await act(() => result.current.onFetchTotalBalance({ force: true }));

    const [run] = result.current.runs;
    expect(run).toMatchObject({ accounts: 4, force: true, unanswered: 0 });
    expect(run.sources).toEqual([
      {
        sourceId: "batch",
        ok: 2,
        failed: 1,
        calls: [expect.objectContaining({ batch: true, accounts: 3, failed: 1 })],
      },
      {
        sourceId: "single",
        ok: 1,
        failed: 0,
        calls: [expect.objectContaining({ batch: false, accounts: 1 })],
      },
    ]);
    expect(run.totals.map(total => total.assetId)).toEqual(["bitcoin", "ethereum"]);
    expect(JSON.parse(run.payload).totals).toEqual([
      { assetId: "ethereum", balance: "20", accounts: 2 },
      { assetId: "bitcoin", balance: "100000000", accounts: 1 },
    ]);
    expect(run.fiatTotal).toContain("30,000");
    expect(run.unvalued).toBe(1);
    expect(run.totals[0]).toMatchObject({
      assetId: "bitcoin",
      fiat: expect.stringContaining("30,000"),
    });
    expect(JSON.parse(run.payload).fiatTotal).toBe(run.fiatTotal);
    expect(run.perAccount.find(account => account.error)).toMatchObject({
      accountUUID: computeAccountUUID(broken),
      error: "Error: down",
    });
  });

  it("keeps fresh balances when not forced", async () => {
    const { result } = setup();
    await act(() => result.current.onFetchTotalBalance({ force: true }));
    await act(() => result.current.onFetchTotalBalance({ force: false }));

    const [latest] = result.current.runs;
    expect(latest.force).toBe(false);
    expect(latest.sources.find(source => source.sourceId === "single")?.calls).toEqual([]);
    expect(result.current.runs).toHaveLength(2);
  });
});
