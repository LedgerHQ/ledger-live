import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import { accountOperationsSlice } from "@domain/entity-account-operations";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import { createAccountDataRouter, type AccountRef } from "@features/platform-account-data";
import { AccountDataProvider } from "@features/platform-account-data/react";
import { useAccountBalancesToolProps } from "./useAccountBalancesToolProps";
import { useAccountOperationsToolProps } from "./useAccountOperationsToolProps";

const ref = {
  accountId: "js:2:ethereum:0xabc:",
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
} as AccountRef;

const inputs = [{ ref, name: "Ethereum 1", granular: true, units: {} }];

const setup = () => {
  const getBalances = jest.fn(async () => [mockAccountBalance()]);
  const getOperations = jest.fn(async () => ({
    operations: [mockAccountOperation()],
    nextCursor: "next",
    complete: false,
  }));
  const router = createAccountDataRouter([
    { id: "fake", supports: () => true, getBalances, getOperations },
  ]);
  const store = configureStore({
    reducer: {
      accountBalances: accountBalancesSlice.reducer,
      accountOperations: accountOperationsSlice.reducer,
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <AccountDataProvider router={router}>{children}</AccountDataProvider>
    </Provider>
  );
  return { wrapper, getBalances, getOperations };
};

describe("account data tool props", () => {
  it("reads balances through the router and exposes them as rows", async () => {
    const { wrapper, getBalances } = setup();
    const { result } = renderHook(() => useAccountBalancesToolProps(inputs), { wrapper });

    expect(result.current.ready).toBe(true);
    act(() => result.current.onRead(ref.accountId));

    await waitFor(() =>
      expect(result.current.accounts[0]?.balance?.value).toBe("1000000000000000000"),
    );
    expect(getBalances).toHaveBeenCalledTimes(1);
    expect(result.current.accounts[0]?.status.sourceId).toBe("fake");
  });

  it("reads a first page of operations, then the next one", async () => {
    const { wrapper, getOperations } = setup();
    const { result } = renderHook(() => useAccountOperationsToolProps(inputs), { wrapper });

    act(() => result.current.onRefresh(ref.accountId));
    await waitFor(() => expect(result.current.accounts[0]?.hasMore).toBe(true));

    act(() => result.current.onLoadMore(ref.accountId));
    await waitFor(() => expect(getOperations).toHaveBeenCalledTimes(2));
    expect(getOperations).toHaveBeenLastCalledWith(ref, { cursor: "next", limit: 50 }, undefined);
  });
});
