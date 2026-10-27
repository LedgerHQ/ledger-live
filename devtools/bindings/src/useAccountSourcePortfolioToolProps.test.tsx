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
import { AccountDataSourceIdSchema, accountDataSlice } from "@domain/entity-account-data";
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
const bitcoin = mockUtxoAccountDescriptor();

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
    getBalance: async () => ({
      items: [
        {
          type: "success",
          network: "ethereum",
          account_id: ACCOUNT_ID,
          items: [
            {
              network: "ethereum",
              account_id: ACCOUNT_ID,
              asset: "native",
              name: "Ether",
              ticker: "ETH",
              decimals: 18,
              amount: "42",
              estimated: false,
              status: "confirmed",
              locked: false,
            },
          ],
        },
      ],
    }),
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
      getDefault({ thunk: { extraArgument: accountDataExtra([appSource]) } }),
  });
  store.dispatch(identitiesSlice.actions.initFromScratch());
  store.dispatch(
    legacyAccountsSynced(
      [ethereum, bitcoin].map((descriptor, index) => ({
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
  const { result } = renderHook(
    () => useAccountSourcePortfolioToolProps({ serviceUrl: "https://portfolio", client }),
    { wrapper },
  );
  const readEthereum = async () => {
    await act(() => store.dispatch(fetchAccountData("balance", ethereum, { maxAge: 0 })));
    return store.getState().accountData.balance?.[computeAccountUUID(ethereum)]?.sourceId;
  };
  return { result, readEthereum };
}

describe("useAccountSourcePortfolioToolProps", () => {
  it("lists each account, supported or not, before any service call", () => {
    const { result } = setup();
    expect(result.current.accounts).toEqual([
      expect.objectContaining({ supported: true, registered: false, serverAccountId: ACCOUNT_ID }),
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

  it("injects the source first in the router while on, and removes it when off", async () => {
    const { result, readEthereum } = setup();
    expect(await readEthereum()).toBe("app");

    act(() => result.current.onToggleEnabled(true));
    expect(result.current.enabled).toBe(true);
    expect(await readEthereum()).toBe("portfolio");
    expect(result.current.accounts[0].outcome).toMatchObject({ status: "served", rows: 1 });

    act(() => result.current.onToggleEnabled(false));
    expect(result.current.enabled).toBe(false);
    expect(await readEthereum()).toBe("app");
  });
});
