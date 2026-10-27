import React, { type PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
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
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  createPortfolioSourceRuntime,
  portfolioSourceSlice,
  type PortfolioClient,
} from "@features/platform-account-source-portfolio";
import type { Portfolio } from "@domain/api-account-portfolio";
import { identitiesSlice } from "@domain/entity-client-identity";
import { useAccountSourcePortfolioToolProps } from "./useAccountSourcePortfolioToolProps";

const ADDRESS = "0xabababababababababababababababababababab";
const ethereum = mockAddressAccountDescriptor({ address: ADDRESS, path: "m/44h/60h/0h/0/0" });
const solana = mockAddressAccountDescriptor({
  network: "solana",
  address: "9xyz",
  path: "m/44h/501h/0h/0h",
});

/** A service that already holds an EVM registration for the account and one nobody needs. */
function fakeClient(): PortfolioClient {
  let portfolio: Portfolio = {
    id: "p",
    registrations: [
      { id: "reg-eth", type: "evm", address: ADDRESS },
      { id: "reg-old", type: "evm", address: "0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead" },
    ],
    accounts: [{ id: `ethereum:${ADDRESS}`, network: "ethereum", status: "synchronized" }],
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
          account_id: `ethereum:${ADDRESS}`,
          items: [
            {
              network: "ethereum",
              account_id: `ethereum:${ADDRESS}`,
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

/** What the app ranks: it serves every account until the Portfolio source takes over. */
const appSource: AccountDataSource = {
  id: AccountDataSourceIdSchema.parse("app"),
  supports: () => true,
  read: { balance: async () => [] },
};

function setup() {
  const createRuntime = () => createPortfolioSourceRuntime({ clientOf: fakeClient });
  const store = configureStore({
    reducer: {
      accountEntries: accountsSlice.reducer,
      accountBalances: accountBalancesSlice.reducer,
      accountData: accountDataSlice.reducer,
      accountSourcePortfolio: portfolioSourceSlice.reducer,
      identities: identitiesSlice.reducer,
    },
    middleware: getDefault =>
      getDefault({
        thunk: {
          extraArgument: accountDataExtra([appSource]),
        },
      }),
  });
  store.dispatch(identitiesSlice.actions.initFromScratch());
  store.dispatch(
    legacyAccountsSynced(
      [ethereum, solana].map((descriptor, index) => ({
        accountUUID: computeAccountUUID(descriptor),
        descriptor,
        legacyId: AccountIdSchema.parse(`legacy-${index}`),
      })),
    ),
  );
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  const { result } = renderHook(
    () => useAccountSourcePortfolioToolProps({ serviceUrl: "https://portfolio", createRuntime }),
    { wrapper },
  );
  // What another tool does: read the balance of the EVM account through the router.
  const readEthereum = async () => {
    await act(() => store.dispatch(fetchAccountData("balance", ethereum, { maxAge: 0 })));
    return store.getState().accountData.balance?.[computeAccountUUID(ethereum)]?.sourceId;
  };
  return { result, readEthereum };
}

describe("useAccountSourcePortfolioToolProps", () => {
  it("lists each account with its registration, unread before any call", () => {
    const { result } = setup();
    expect(result.current.accounts).toEqual([
      expect.objectContaining({ registered: false, registration: expect.stringContaining("evm") }),
      expect.objectContaining({ registration: undefined, registered: false }),
    ]);
  });

  it("matches the service portfolio after a refresh, and shows what no account needs", async () => {
    const { result } = setup();
    await act(() => result.current.onRefresh());
    expect(result.current.accounts[0]).toMatchObject({
      registered: true,
      serverAccounts: [{ id: `ethereum:${ADDRESS}`, status: "synchronized" }],
    });
    expect(result.current.extraRegistrations).toEqual([
      expect.objectContaining({ id: "reg-old", type: "evm" }),
    ]);
    expect(result.current.serverStatuses).toEqual([{ status: "synchronized", count: 1 }]);

    await act(() => result.current.onReconcile());
    expect(result.current.extraRegistrations).toEqual([]);
    expect(result.current.activity.map(entry => entry.kind)).toContain("prune");
  });

  it("injects the source first in the router while on, and removes it when off", async () => {
    const { result, readEthereum } = setup();
    expect(await readEthereum()).toBe("app");

    act(() => result.current.onToggleEnabled(true));
    expect(result.current.enabled).toBe(true);
    expect(await readEthereum()).toBe("portfolio");
    expect(result.current.accounts[0].outcome).toMatchObject({ outcome: "ok", rows: 1 });

    act(() => result.current.onToggleEnabled(false));
    expect(result.current.enabled).toBe(false);
    expect(await readEthereum()).toBe("app");
  });
});
