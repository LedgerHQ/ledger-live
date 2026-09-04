import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { AccountIdSchema } from "@shared/schema-primitives";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import {
  mockAccountBalance,
  mockTokenAccountBalance,
} from "@domain/entity-account-balance/schema.mock";
import {
  registerAccountBalanceSources,
  type AccountBalanceSource,
  type AccountRef,
} from "@features/platform-account-data";
import {
  useAccountBalancesToolProps,
  type AccountBalancesInput,
} from "./useAccountBalancesToolProps";

const accountId = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const main = mockAccountBalance();
const token = mockTokenAccountBalance();

const ref: AccountRef = {
  accountId,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
};

const input: AccountBalancesInput = {
  ref,
  name: "My Ethereum",
  granular: true,
  units: {
    ethereum: { code: "ETH", magnitude: 18 },
    "ethereum/erc20/usd__coin": { code: "USDC", magnitude: 6 },
  },
};

const buildStore = () =>
  configureStore({ reducer: { accountBalances: accountBalancesSlice.reducer } });

const withStore = (store: ReturnType<typeof buildStore>) =>
  function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>;
  };

const countingSource = (): AccountBalanceSource & { calls: () => number } => {
  let calls = 0;
  return {
    id: "granular",
    priority: 10,
    supports: () => true,
    getBalances: async () => {
      calls++;
      return [main, token];
    },
    calls: () => calls,
  };
};

describe("useAccountBalancesToolProps", () => {
  afterEach(() => registerAccountBalanceSources([]));

  it("reports an account the layer has never read", () => {
    const store = buildStore();
    const { result } = renderHook(() => useAccountBalancesToolProps([input]), {
      wrapper: withStore(store),
    });

    expect(result.current.accounts).toHaveLength(1);
    const [row] = result.current.accounts;
    expect(row).toMatchObject({
      accountId,
      name: "My Ethereum",
      currencyId: "ethereum",
      address: "0xabc",
      granular: true,
    });
    expect(row.balance).toBeUndefined();
    expect(row.tokens).toEqual([]);
    expect(row.status).toEqual({ pending: false });
  });

  it("projects the stored rows with the host's display units", () => {
    const store = buildStore();
    store.dispatch(
      accountBalancesSlice.actions.accountBalanceReceived({
        accountId,
        balances: [main, token],
        sourceId: "granular",
      }),
    );

    const { result } = renderHook(() => useAccountBalancesToolProps([input]), {
      wrapper: withStore(store),
    });

    const [row] = result.current.accounts;
    expect(row.balance).toEqual({
      assetId: "ethereum",
      unit: { code: "ETH", magnitude: 18 },
      value: main.balance,
      spendable: main.spendableBalance,
      at: main.at,
    });
    expect(row.tokens).toEqual([
      {
        assetId: "ethereum/erc20/usd__coin",
        unit: { code: "USDC", magnitude: 6 },
        value: token.balance,
        spendable: token.spendableBalance,
        at: token.at,
      },
    ]);
    expect(row.status).toEqual({ pending: false, sourceId: "granular" });
  });

  it("leaves the unit undefined when the host could not resolve the asset", () => {
    const store = buildStore();
    store.dispatch(
      accountBalancesSlice.actions.accountBalanceReceived({
        accountId,
        balances: [main],
        sourceId: "granular",
      }),
    );

    const { result } = renderHook(() => useAccountBalancesToolProps([{ ...input, units: {} }]), {
      wrapper: withStore(store),
    });

    expect(result.current.accounts[0].balance?.unit).toBeUndefined();
  });

  it("is not ready until the host has registered a source", () => {
    const store = buildStore();
    const { result, rerender } = renderHook(() => useAccountBalancesToolProps([input]), {
      wrapper: withStore(store),
    });
    expect(result.current.ready).toBe(false);

    registerAccountBalanceSources([countingSource()]);
    rerender();
    expect(result.current.ready).toBe(true);
  });

  it("forces a round-trip on onRead, and writes the rows to the store", async () => {
    const source = countingSource();
    registerAccountBalanceSources([source]);
    const store = buildStore();
    const { result } = renderHook(() => useAccountBalancesToolProps([input]), {
      wrapper: withStore(store),
    });

    await act(async () => {
      result.current.onRead(accountId);
    });

    await waitFor(() => expect(source.calls()).toBe(1));
    expect(result.current.accounts[0].balance?.value).toBe(main.balance);

    // `maxAge: 0` — a second press must hit the network even though the row is seconds old.
    await act(async () => {
      result.current.onRead(accountId);
    });
    await waitFor(() => expect(source.calls()).toBe(2));
  });

  it("ignores onRead for an account it was not given", async () => {
    const source = countingSource();
    registerAccountBalanceSources([source]);
    const store = buildStore();
    const { result } = renderHook(() => useAccountBalancesToolProps([input]), {
      wrapper: withStore(store),
    });

    await act(async () => {
      result.current.onRead("js:2:ethereum:0xnope:");
    });
    expect(source.calls()).toBe(0);
  });

  it("respects freshness on onReadAll — the skipped reads are the point", async () => {
    const source = countingSource();
    registerAccountBalanceSources([source]);
    const store = buildStore();
    // A row this fresh must not be re-read: that is what a portfolio mount does.
    store.dispatch(
      accountBalancesSlice.actions.accountBalanceReceived({
        accountId,
        balances: [{ ...main, at: new Date().toISOString() as typeof main.at }],
        sourceId: "granular",
      }),
    );

    const { result } = renderHook(() => useAccountBalancesToolProps([input]), {
      wrapper: withStore(store),
    });

    await act(async () => {
      result.current.onReadAll();
    });
    expect(source.calls()).toBe(0);
  });
});
