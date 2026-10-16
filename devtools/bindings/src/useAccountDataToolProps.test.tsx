import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import { accountDataExtra } from "@domain/api-account-data";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { AccountAssetBalanceSchema, accountBalancesSlice } from "@domain/entity-account-balance";
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { accountOperationsSlice } from "@domain/entity-account-operations";
import { useAccountDataToolProps } from "./useAccountDataToolProps";

const descriptor: AccountDescriptor = {
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: "ethereum", env: "main" },
  address: "0xabc",
  path: "m/44h/60h/0h/0/0",
};
const accountUUID = computeAccountUUID(descriptor);
const LEGACY_ID = "js:2:ethereum:0xabc:";
const balances = [
  AccountAssetBalanceSchema.parse({ assetId: "ethereum", balance: "10", spendableBalance: "7" }),
];

function setup() {
  const store = configureStore({
    reducer: {
      accountEntries: accountsSlice.reducer,
      accountData: accountDataSlice.reducer,
      accountBalances: accountBalancesSlice.reducer,
      accountOperations: accountOperationsSlice.reducer,
    },
    middleware: getDefault =>
      getDefault({
        thunk: {
          extraArgument: accountDataExtra([
            {
              id: AccountDataSourceIdSchema.parse("toy"),
              supports: () => true,
              read: { balance: async () => balances },
            },
          ]),
        },
      }),
  });
  store.dispatch(
    legacyAccountsSynced([{ accountUUID, descriptor, legacyId: AccountIdSchema.parse(LEGACY_ID) }]),
  );
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useAccountDataToolProps(), { wrapper });
}

describe("useAccountDataToolProps", () => {
  it("lists the accounts slice entries, with nothing stored before a read", () => {
    const { result } = setup();
    expect(result.current.accounts).toEqual([
      expect.objectContaining({
        accountUUID,
        legacyId: LEGACY_ID,
        network: "ethereum:main",
        key: "0xabc",
        path: "m/44h/60h/0h/0/0",
        balanceStatus: undefined,
        balances: undefined,
        operations: undefined,
      }),
    ]);
  });

  it("shows the balance rows and the status a read stored, as stored", async () => {
    const { result } = setup();
    act(() => result.current.onReadBalance(accountUUID));
    await waitFor(() => expect(result.current.accounts[0].balances).toEqual(balances));
    expect(result.current.accounts[0].balanceStatus).toEqual(
      expect.objectContaining({ pending: false, sourceId: "toy" }),
    );
  });
});
