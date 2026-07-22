import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, ChainwatchAccount, ChainwatchNetwork } from "@ledgerhq/types-live";
import { setOverride } from "@shared/feature-flags";
import { server, http, HttpResponse } from "@tests/server";
import { act, render, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { replaceAccounts } from "~/actions/accounts";
import { setNotifications } from "~/actions/settings";
import type { State } from "~/reducers/types";
import TransactionsAlerts from "./TransactionsAlerts";

const avalanche = getCryptoCurrencyById("avalanche_c_chain");
const network: ChainwatchNetwork = {
  ledgerLiveId: avalanche.id,
  chainwatchId: "avax",
  nbConfirmations: 1,
};
const secondNetwork: ChainwatchNetwork = {
  ledgerLiveId: "bitcoin",
  chainwatchId: "btc",
  nbConfirmations: 2,
};
const chainwatchUserId = "chainwatch-user-id";
const accountUrl = `https://chainwatch/avax/account/${chainwatchUserId}/`;
const addressesUrl = `${accountUrl}addresses/`;
const transactionsAlertsFlag = {
  enabled: true,
  params: {
    chainwatchBaseUrl: "https://chainwatch",
    networks: [network],
  },
};

const makeAccount = (id: string, freshAddress: string): Account => ({
  ...genAccount(id, { currency: avalanche }),
  freshAddress,
});

const account01 = makeAccount("first-account", "0x01");
const account02 = makeAccount("second-account", "0x02");

const readyChainwatchAccount = (suffixes: string[] = []): ChainwatchAccount => ({
  suffixes,
  monitors: [
    { confirmations: 1, type: "send", id: 1 },
    { confirmations: 1, type: "receive", id: 2 },
  ],
  targets: [{ equipment: chainwatchUserId, type: "braze", id: 1 }],
});

const withTransactionsAlertsState =
  (accounts: Account[], networks: ChainwatchNetwork[] = [network]) =>
  (state: State): State =>
    withFlagOverrides({
      transactionsAlerts: {
        ...transactionsAlertsFlag,
        params: { ...transactionsAlertsFlag.params, networks },
      },
    })({
      ...state,
      accounts: { ...state.accounts, active: accounts },
      identities: {
        ...state.identities,
        userId: {
          exportUserIdForChainwatch: () => chainwatchUserId,
        } as State["identities"]["userId"],
      },
      settings: {
        ...state.settings,
        notifications: {
          ...state.settings.notifications,
          transactionsAlertsCategory: true,
        },
      },
    });

const installChainwatchHandlers = (
  initialRemote?: { exists: boolean; suffixes: string[] },
  options?: {
    failAddressPuts?: number;
    delayAddressPut?: (putIndex: number) => Promise<void>;
  },
) => {
  const addressPuts: { body?: unknown }[] = [];
  const addressDeletes: { body?: unknown }[] = [];
  const accountPuts: { body?: unknown }[] = [];
  const accountDeletes: { body?: unknown }[] = [];
  let accountGets = 0;
  const state = {
    suffixes: [...(initialRemote?.suffixes ?? [])],
    exists: initialRemote?.exists ?? false,
  };
  let remainingAddressPutFailures = options?.failAddressPuts ?? 0;

  server.use(
    http.get(accountUrl, () => {
      accountGets += 1;
      if (!state.exists) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(readyChainwatchAccount(state.suffixes));
    }),
    http.put(accountUrl, () => {
      accountPuts.push({});
      state.exists = true;
      return HttpResponse.json(readyChainwatchAccount(state.suffixes));
    }),
    http.delete(accountUrl, () => {
      accountDeletes.push({});
      state.exists = false;
      state.suffixes = [];
      return new HttpResponse(null, { status: 200 });
    }),
    http.put(addressesUrl, async ({ request }) => {
      const body = await request.json();
      addressPuts.push({ body });
      if (options?.delayAddressPut) {
        await options.delayAddressPut(addressPuts.length - 1);
      }
      if (remainingAddressPutFailures > 0) {
        remainingAddressPutFailures -= 1;
        return new HttpResponse(null, { status: 500 });
      }
      if (Array.isArray(body)) {
        state.suffixes = [...new Set([...state.suffixes, ...body.map(String)])];
      }
      return new HttpResponse(null, { status: 200 });
    }),
    http.delete(addressesUrl, async ({ request }) => {
      const body = await request.json();
      addressDeletes.push({ body });
      if (Array.isArray(body)) {
        const removed = new Set(body.map(String));
        state.suffixes = state.suffixes.filter(suffix => !removed.has(suffix));
      }
      return new HttpResponse(null, { status: 200 });
    }),
  );

  return {
    addressPuts,
    addressDeletes,
    accountPuts,
    accountDeletes,
    getAccountGets: () => accountGets,
    getRemote: () => ({ exists: state.exists, suffixes: [...state.suffixes] }),
  };
};

describe("TransactionsAlerts", () => {
  it("should register a wallet address with Chainwatch", async () => {
    const chainwatch = installChainwatchHandlers();

    render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));
    expect(chainwatch.addressPuts[0].body).toEqual(["0x01"]);
  });

  it("should register a local address that is missing from Chainwatch", async () => {
    const chainwatch = installChainwatchHandlers({ exists: true, suffixes: [] });

    render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));
    expect(chainwatch.addressPuts[0].body).toEqual(["0x01"]);
    expect(chainwatch.accountPuts).toHaveLength(0);
  });

  it("should remove old addresses and register new ones when accounts change", async () => {
    const chainwatch = installChainwatchHandlers();
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));
    expect(chainwatch.addressPuts[0].body).toEqual(["0x01"]);

    act(() => {
      store.dispatch(replaceAccounts([account02]));
    });

    await waitFor(() => {
      expect(chainwatch.addressPuts).toHaveLength(2);
      expect(chainwatch.addressDeletes).toHaveLength(1);
    });
    expect(chainwatch.addressPuts[1].body).toEqual(["0x02"]);
    expect(chainwatch.addressDeletes[0].body).toEqual(["0x01"]);
  });

  it("should not register addresses again when nothing changed", async () => {
    const chainwatch = installChainwatchHandlers();
    const { rerender } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));

    rerender(<TransactionsAlerts />);

    await act(async () => {});

    expect(chainwatch.addressPuts).toHaveLength(1);
  });

  it("should not reconcile again when equivalent networks are reordered", async () => {
    const chainwatch = installChainwatchHandlers();
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01], [network, secondNetwork]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));
    await act(async () => {});
    const accountGetsBeforeReorder = chainwatch.getAccountGets();

    act(() => {
      store.dispatch(
        setOverride({
          key: "transactionsAlerts",
          value: {
            ...transactionsAlertsFlag,
            params: {
              ...transactionsAlertsFlag.params,
              networks: [{ ...secondNetwork }, { ...network }],
            },
          },
        }),
      );
    });
    await act(async () => {});

    expect(chainwatch.getAccountGets()).toBe(accountGetsBeforeReorder);
  });

  it("should delete the Chainwatch account when transaction alerts are turned off", async () => {
    const chainwatch = installChainwatchHandlers();
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));

    act(() => {
      store.dispatch(setNotifications({ transactionsAlertsCategory: false }));
    });

    await waitFor(() => expect(chainwatch.accountDeletes).toHaveLength(1));
  });

  it("should register addresses again after a failed Chainwatch request", async () => {
    const chainwatch = installChainwatchHandlers(
      { exists: true, suffixes: [] },
      { failAddressPuts: 1 },
    );
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));
    expect(chainwatch.addressPuts[0].body).toEqual(["0x01"]);
    expect(chainwatch.getRemote().suffixes).toEqual([]);

    // Rejection clears the reconciliation key, so the next account refresh can retry it.
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    act(() => {
      store.dispatch(replaceAccounts([account01]));
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(2));
    expect(chainwatch.addressPuts[1].body).toEqual(["0x01"]);
    expect(chainwatch.getRemote().suffixes).toEqual(["0x01"]);
  });
});
