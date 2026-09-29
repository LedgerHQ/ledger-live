import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { AccountRef } from "@domain/entity-account";
import { createAccountDataRouter, type AccountDataSource } from "@domain/api-account-data-source";
import {
  accountBalanceBinding,
  accountBalancesSlice,
  selectAccountBalance,
} from "@domain/entity-account-balance";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import {
  accountOperationsBinding,
  accountOperationsSlice,
} from "@domain/entity-account-operations";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import { useAccountData } from "./useAccountData";

const ref = {
  accountId: mockAccountBalance().accountId,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
} as AccountRef;

const setup = (source: Partial<AccountDataSource>) => {
  const store = configureStore({
    reducer: {
      accountBalances: accountBalancesSlice.reducer,
      accountOperations: accountOperationsSlice.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            accountData: createAccountDataRouter([{ id: "fake", supports: () => true, ...source }]),
          },
        },
      }),
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, wrapper };
};

describe("useAccountData", () => {
  it("reads on mount and refreshes on demand", async () => {
    const balance = jest.fn(async () => [mockAccountBalance()]);
    const { store, wrapper } = setup({ balance });
    const { result } = renderHook(() => useAccountData(accountBalanceBinding, ref), { wrapper });

    await waitFor(() =>
      expect(selectAccountBalance(store.getState(), ref.accountId)?.balance).toBe(
        "1000000000000000000",
      ),
    );
    await act(() => result.current.refresh());
    expect(balance).toHaveBeenCalledTimes(2);
  });

  it("reads again when the ref changes", async () => {
    const balance = jest.fn(async () => []);
    const { wrapper } = setup({ balance });
    const { rerender } = renderHook(
      ({ address }) => useAccountData(accountBalanceBinding, { ...ref, address }),
      { wrapper, initialProps: { address: "0xone" } },
    );
    await waitFor(() => expect(balance).toHaveBeenCalledTimes(1));
    rerender({ address: "0xtwo" });
    await waitFor(() => expect(balance).toHaveBeenCalledTimes(2));
  });

  it("does not read without a ref", () => {
    const balance = jest.fn(async () => []);
    const { wrapper } = setup({ balance });
    renderHook(() => useAccountData(accountBalanceBinding, undefined), { wrapper });
    expect(balance).not.toHaveBeenCalled();
  });

  it("offers loadMore only for data that paginates", async () => {
    const operations = jest.fn(async () => ({
      operations: [mockAccountOperation()],
      complete: false,
      nextCursor: "c1",
    }));
    const { wrapper } = setup({ operations, balance: async () => [] });

    const paged = renderHook(() => useAccountData(accountOperationsBinding, ref), { wrapper });
    const flat = renderHook(() => useAccountData(accountBalanceBinding, ref), { wrapper });
    expect(paged.result.current.loadMore).toBeDefined();
    expect(flat.result.current.loadMore).toBeUndefined();

    await waitFor(() => expect(operations).toHaveBeenCalledTimes(1));
    await act(async () => {
      await paged.result.current.loadMore?.();
    });
    await waitFor(() => expect(operations).toHaveBeenCalledTimes(2));
  });
});
