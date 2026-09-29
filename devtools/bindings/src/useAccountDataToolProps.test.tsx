import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import { accountOperationsSlice } from "@domain/entity-account-operations";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import { createAccountDataRouter } from "@domain/api-account-data-source";
import { AccountRefSchema } from "@domain/entity-account";
import { useAccountBalancesToolProps } from "./useAccountBalancesToolProps";
import { useAccountOperationsToolProps } from "./useAccountOperationsToolProps";

const ref = AccountRefSchema.parse({
  accountId: "js:2:ethereum:0xabc:",
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
});

const inputs = [{ ref, name: "Ethereum 1", granular: true, units: {} }];

const setup = () => {
  const balance = jest.fn(async () => [mockAccountBalance()]);
  const operations = jest.fn(async () => ({
    operations: [mockAccountOperation()],
    nextCursor: "next",
    complete: false,
  }));
  const accountData = createAccountDataRouter([
    { id: "fake", supports: () => true, balance, operations },
  ]);
  const store = configureStore({
    reducer: {
      accountBalances: accountBalancesSlice.reducer,
      accountOperations: accountOperationsSlice.reducer,
    },
    middleware: getDefault => getDefault({ thunk: { extraArgument: { accountData } } }),
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { wrapper, balance, operations };
};

describe("account data tool props", () => {
  it("reads balances through the router and exposes them as rows", async () => {
    const { wrapper, balance } = setup();
    const { result } = renderHook(() => useAccountBalancesToolProps(inputs), { wrapper });

    expect(result.current.ready).toBe(true);
    act(() => result.current.onRead(ref.accountId));

    await waitFor(() =>
      expect(result.current.accounts[0]?.balance?.value).toBe("1000000000000000000"),
    );
    expect(balance).toHaveBeenCalledTimes(1);
    expect(result.current.accounts[0]?.status.sourceId).toBe("fake");
  });

  it("reads a first page of operations, then the next one", async () => {
    const { wrapper, operations } = setup();
    const { result } = renderHook(() => useAccountOperationsToolProps(inputs), { wrapper });

    act(() => result.current.onRefresh(ref.accountId));
    await waitFor(() => expect(result.current.accounts[0]?.hasMore).toBe(true));

    act(() => result.current.onLoadMore(ref.accountId));
    await waitFor(() => expect(operations).toHaveBeenCalledTimes(2));
    expect(operations).toHaveBeenLastCalledWith(ref, { limit: 50, cursor: "next" }, undefined);
  });
});
