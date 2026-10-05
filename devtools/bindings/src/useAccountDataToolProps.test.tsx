import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import { accountOperationsSlice } from "@domain/entity-account-operations";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import { createAccountDataRouter } from "@domain/api-account-data-source";
import { computeAccountId } from "@domain/entity-account-alias";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { useAccountBalancesToolProps } from "./useAccountBalancesToolProps";
import { useAccountOperationsToolProps } from "./useAccountOperationsToolProps";

const descriptor: AccountDescriptor = {
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: "ethereum", env: "main" },
  address: "0xabc",
  path: "m/44h/60h/0h/0/0",
};
const accountId = computeAccountId(descriptor);

const inputs = [{ descriptor, name: "Ethereum 1", granular: true, units: {} }];

const setup = () => {
  const balance = jest.fn(async () => [mockAccountBalance({ accountId })]);
  const operations = jest.fn(async () => ({
    operations: [mockAccountOperation({ accountId })],
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
    act(() => result.current.onRead(accountId));

    await waitFor(() =>
      expect(result.current.accounts[0]?.balance?.value).toBe("1000000000000000000"),
    );
    expect(balance).toHaveBeenCalledTimes(1);
    expect(result.current.accounts[0]?.status.sourceId).toBe("fake");
  });

  it("reads every listed balance in one batch on read all", async () => {
    const { wrapper, balance } = setup();
    const { result } = renderHook(() => useAccountBalancesToolProps(inputs), { wrapper });

    act(() => result.current.onReadAll());

    await waitFor(() => expect(result.current.accounts[0]?.status.sourceId).toBe("fake"));
    expect(balance).toHaveBeenCalledTimes(1);
  });

  it("reads a first page of operations, then the next one", async () => {
    const { wrapper, operations } = setup();
    const { result } = renderHook(() => useAccountOperationsToolProps(inputs), { wrapper });

    act(() => result.current.onRefresh(accountId));
    await waitFor(() => expect(result.current.accounts[0]?.hasMore).toBe(true));

    act(() => result.current.onLoadMore(accountId));
    await waitFor(() => expect(operations).toHaveBeenCalledTimes(2));
    expect(operations).toHaveBeenLastCalledWith(
      { accountId, descriptor },
      { limit: 50, cursor: "next" },
      undefined,
    );
  });
});
