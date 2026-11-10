import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import {
  accountDataExtra,
  fetchAccountData,
  type AccountDataSource,
} from "@domain/api-account-data";
import { AccountIdSchema, accountsSlice, legacyAccountsSynced } from "@domain/entity-account";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import {
  AccountDataSourceIdSchema,
  accountDataSlice,
  selectAccountDataStatus,
} from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import { identitiesSlice } from "@domain/entity-client-identity";
import type { PortfolioClient } from "@features/platform-account-source-portfolio";
import { useAccountSourcePortfolioToolProps } from "./useAccountSourcePortfolioToolProps";

const ADDRESS = "0xabababababababababababababababababababab";
const ACCOUNT_ID = `ethereum:${ADDRESS}`;
const ethereum = mockAddressAccountDescriptor({ address: ADDRESS, path: "m/44h/60h/0h/0/0" });
/** Segwit (purpose 49): the service refuses to derive it. */
const bitcoin = mockUtxoAccountDescriptor({ path: "m/49h/0h/0h" });
/** A mock account: Reconcile never registers it. */
const mockEthereum = {
  ...mockAddressAccountDescriptor({ address: `0x${"cd".repeat(20)}`, path: "m/44h/60h/0h/0/0" }),
  purpose: "mock" as const,
};

type Listed = Awaited<ReturnType<PortfolioClient["createPortfolio"]>>;

/** A service holding the account's registration, synchronized, and one registration nobody needs. */
function fakeClient(): PortfolioClient {
  let portfolio: Listed = {
    id: "p",
    registrations: [
      { id: "reg-eth", type: "evm", address: ADDRESS },
      { id: "reg-old", type: "evm", address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead" },
    ],
    accounts: [{ id: ACCOUNT_ID, network: "ethereum", status: "synchronized" }],
  };
  return {
    getPortfolio: async () => portfolio,
    createPortfolio: async () => portfolio,
    addRegistrations: async () => portfolio,
    removeRegistrations: async (_id, ids) => {
      portfolio = {
        ...portfolio,
        registrations: portfolio.registrations?.filter(entry => !ids.includes(entry.id)),
      };
      return portfolio;
    },
  };
}

/** What the app ranks: it answers every account until the Portfolio source takes over. */
const appSource: AccountDataSource = {
  id: AccountDataSourceIdSchema.parse("app"),
  supports: () => true,
  read: { balance: async () => [] },
};

function setup() {
  const store = configureStore({
    reducer: {
      accountEntries: accountsSlice.reducer,
      accountBalances: accountBalancesSlice.reducer,
      accountData: accountDataSlice.reducer,
      identities: identitiesSlice.reducer,
    },
    middleware: getDefault =>
      getDefault({
        // identities holds its ids as class instances, as in the apps.
        serializableCheck: false,
        thunk: { extraArgument: accountDataExtra([appSource]) },
      }),
  });
  store.dispatch(identitiesSlice.actions.initFromScratch());
  store.dispatch(
    legacyAccountsSynced(
      [ethereum, bitcoin, mockEthereum].map((descriptor, index) => ({
        accountUUID: computeAccountUUID(descriptor),
        descriptor,
        legacyId: AccountIdSchema.parse(`legacy-${index}`),
      })),
    ),
  );
  const client = fakeClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const mountPanel = () =>
    renderHook(
      () => useAccountSourcePortfolioToolProps({ serviceUrl: "https://portfolio", client }),
      { wrapper },
    ).result;
  const result = mountPanel();
  const readEthereum = async () => {
    await act(() => store.dispatch(fetchAccountData("balance", ethereum, { maxAge: 0 })));
    return selectAccountDataStatus(store.getState(), "balance", computeAccountUUID(ethereum))
      ?.sourceId;
  };
  return { result, readEthereum, mountPanel };
}

describe("useAccountSourcePortfolioToolProps", () => {
  it("lists each account, supported or not (mock ones never are), before any service call", () => {
    const { result } = setup();
    expect(result.current.accounts).toEqual([
      expect.objectContaining({ supported: true, registered: false, serverAccountId: ACCOUNT_ID }),
      expect.objectContaining({ supported: false, registered: false }),
      expect.objectContaining({ supported: false, registered: false }),
    ]);
  });

  it("matches the portfolio after a refresh, and reconcile removes what no account needs", async () => {
    const { result } = setup();
    act(() => result.current.onRefresh());
    await waitFor(() => expect(result.current.listedAt).toBeDefined());
    expect(result.current.accounts[0]).toMatchObject({
      registered: true,
      serverStatus: "synchronized",
    });
    expect(result.current.extraRegistrations).toEqual([
      expect.objectContaining({ id: "reg-old", type: "evm" }),
    ]);

    act(() => result.current.onReconcile());
    await waitFor(() => expect(result.current.extraRegistrations).toEqual([]));
  });

  it("injects the source while on, which serves no read yet, and removes it when off", async () => {
    const { result, readEthereum } = setup();

    act(() => result.current.onToggleEnabled(true));
    expect(result.current.enabled).toBe(true);
    expect(await readEthereum()).toBe("app");
    expect(result.current.accounts[0].outcome).toBeUndefined();

    act(() => result.current.onToggleEnabled(false));
    expect(result.current.enabled).toBe(false);
    expect(await readEthereum()).toBe("app");
  });

  it("keeps every panel on the store in step with the injection", () => {
    const { result, mountPanel } = setup();
    const detached = mountPanel();

    act(() => detached.current.onToggleEnabled(true));
    expect(result.current.enabled).toBe(true);

    act(() => result.current.onToggleEnabled(false));
    expect(detached.current.enabled).toBe(false);
  });
});
