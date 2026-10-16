import { configureStore } from "@reduxjs/toolkit";
import {
  AccountDataSourceIdSchema,
  accountDataReceived,
  accountDataRequested,
  accountDataSlice,
} from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { AccountAssetBalanceSchema, type AccountAssetBalance } from "./schema";
import {
  accountBalancesRemoved,
  accountBalancesSlice,
  selectAccountAssetBalance,
  selectAccountBalances,
} from "./slice";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());

const row = (assetId: string, balance: string): AccountAssetBalance =>
  AccountAssetBalanceSchema.parse({ assetId, balance, spendableBalance: balance });

function makeStore() {
  return configureStore({
    reducer: {
      accountData: accountDataSlice.reducer,
      accountBalances: accountBalancesSlice.reducer,
    },
  });
}

function receive(
  store: ReturnType<typeof makeStore>,
  data: AccountAssetBalance[],
  requestId = "r",
) {
  store.dispatch(
    accountDataRequested({ kind: "balance", accountUUID, requestId, queryKey: "", append: false }),
  );
  store.dispatch(
    accountDataReceived({
      kind: "balance",
      accountUUID,
      requestId,
      data,
      sourceId: AccountDataSourceIdSchema.parse("s"),
      append: false,
      readAt: 0,
    }),
  );
}

describe("accountBalancesSlice", () => {
  it("stores the rows a balance read answered, replacing the previous ones", () => {
    const store = makeStore();
    receive(store, [row("ethereum", "10"), row("ethereum/erc20/usdt", "5")]);
    receive(store, [row("ethereum", "12")], "r2");
    expect(selectAccountBalances(store.getState(), accountUUID)).toEqual([row("ethereum", "12")]);
  });

  it("finds one asset's row", () => {
    const store = makeStore();
    receive(store, [row("ethereum", "10"), row("ethereum/erc20/usdt", "5")]);
    expect(
      selectAccountAssetBalance(
        store.getState(),
        accountUUID,
        row("ethereum/erc20/usdt", "5").assetId,
      )?.balance,
    ).toBe("5");
  });

  it("forgets removed accounts", () => {
    const store = makeStore();
    receive(store, [row("ethereum", "10")]);
    store.dispatch(accountBalancesRemoved([accountUUID]));
    expect(selectAccountBalances(store.getState(), accountUUID)).toBeUndefined();
  });

  it("rejects a negative or fractional amount", () => {
    expect(() => row("ethereum", "-1")).toThrow();
    expect(() => row("ethereum", "1.5")).toThrow();
  });
});
