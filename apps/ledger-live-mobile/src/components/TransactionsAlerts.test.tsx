import React from "react";
import { UserId } from "@domain/entity-client-identity";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
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
const userId = UserId.fromString(chainwatchUserId);
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
const duplicateAccount01 = makeAccount("duplicate-account", "0x01");

const readyChainwatchAccount = (suffixes: string[] = []): ChainwatchAccount => ({
  suffixes,
  monitors: [
    { confirmations: 1, type: "send", id: 1 },
    { confirmations: 1, type: "receive", id: 2 },
  ],
  targets: [{ equipment: chainwatchUserId, type: "braze", id: 1 }],
});

const withTransactionsAlertsState =
  (
    accounts: Account[],
    networks: ChainwatchNetwork[] = [network],
    transactionsAlertsCategory = true,
    featureEnabled = true,
  ) =>
  (state: State): State =>
    withFlagOverrides({
      transactionsAlerts: {
        ...transactionsAlertsFlag,
        enabled: featureEnabled,
        params: { ...transactionsAlertsFlag.params, networks },
      },
    })({
      ...state,
      accounts: { ...state.accounts, active: accounts },
      identities: {
        ...state.identities,
        userId,
      },
      settings: {
        ...state.settings,
        notifications: {
          ...state.settings.notifications,
          transactionsAlertsCategory,
        },
      },
    });

const installChainwatchHandlers = (
  initialRemote: { exists: boolean; suffixes: string[] } = { exists: false, suffixes: [] },
  failAddressPuts = 0,
  addressPutGate?: Promise<void>,
) => {
  const accountUrl = `https://chainwatch/${network.chainwatchId}/account/${chainwatchUserId}/`;
  const addressesUrl = `${accountUrl}addresses/`;
  const addressPuts: unknown[] = [];
  const addressDeletes: unknown[] = [];
  let accountGets = 0;
  let accountPuts = 0;
  let accountDeletes = 0;
  let remainingAddressPutFailures = failAddressPuts;
  const remote = {
    exists: initialRemote.exists,
    suffixes: [...initialRemote.suffixes],
  };

  server.use(
    http.get(accountUrl, () => {
      accountGets += 1;
      return remote.exists
        ? HttpResponse.json(readyChainwatchAccount(remote.suffixes))
        : new HttpResponse(null, { status: 404 });
    }),
    http.put(accountUrl, () => {
      accountPuts += 1;
      remote.exists = true;
      return HttpResponse.json(readyChainwatchAccount(remote.suffixes));
    }),
    http.delete(accountUrl, () => {
      accountDeletes += 1;
      remote.exists = false;
      remote.suffixes = [];
      return new HttpResponse(null, { status: 200 });
    }),
    http.put(addressesUrl, async ({ request }) => {
      const body = await request.json();
      addressPuts.push(body);
      await addressPutGate;
      if (remainingAddressPutFailures > 0) {
        remainingAddressPutFailures -= 1;
        return new HttpResponse(null, { status: 500 });
      }
      if (Array.isArray(body)) {
        remote.suffixes = [...new Set([...remote.suffixes, ...body.map(String)])];
      }
      return new HttpResponse(null, { status: 200 });
    }),
    http.delete(addressesUrl, async ({ request }) => {
      const body = await request.json();
      addressDeletes.push(body);
      if (Array.isArray(body)) {
        const removed = new Set(body.map(String));
        remote.suffixes = remote.suffixes.filter(suffix => !removed.has(suffix));
      }
      return new HttpResponse(null, { status: 200 });
    }),
  );

  return {
    addressPuts,
    addressDeletes,
    getAccountGets: () => accountGets,
    getAccountPuts: () => accountPuts,
    getAccountDeletes: () => accountDeletes,
    getRemote: () => ({ exists: remote.exists, suffixes: [...remote.suffixes] }),
  };
};

describe("TransactionsAlerts", () => {
  it("should register an address missing from an existing Chainwatch account", async () => {
    const chainwatch = installChainwatchHandlers({ exists: true, suffixes: [] });

    render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toEqual([["0x01"]]));
    expect(chainwatch.getAccountPuts()).toBe(0);
  });

  it("should not register an address already returned by Chainwatch", async () => {
    const chainwatch = installChainwatchHandlers({ exists: true, suffixes: ["0x01"] });

    render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.getAccountGets()).toBe(1));
    expect(chainwatch.addressPuts).toHaveLength(0);
    expect(chainwatch.getAccountPuts()).toBe(0);
  });

  it("should remove old addresses and register current ones when accounts change", async () => {
    const chainwatch = installChainwatchHandlers();
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });
    await waitFor(() => expect(chainwatch.addressPuts).toEqual([["0x01"]]));

    act(() => {
      store.dispatch(replaceAccounts([account02]));
    });

    await waitFor(() => {
      expect(chainwatch.addressDeletes).toEqual([["0x01"]]);
      expect(chainwatch.addressPuts).toEqual([["0x01"], ["0x02"]]);
    });
    expect(chainwatch.getRemote().suffixes).toEqual(["0x02"]);
  });

  it("should ignore account changes that keep the same desired address set", async () => {
    const chainwatch = installChainwatchHandlers();
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });
    await waitFor(() => expect(chainwatch.addressPuts).toEqual([["0x01"]]));
    const accountGetsAfterRegistration = chainwatch.getAccountGets();

    act(() => {
      store.dispatch(replaceAccounts([account01, duplicateAccount01]));
    });
    await act(async () => {});

    expect(chainwatch.getAccountGets()).toBe(accountGetsAfterRegistration);
  });

  it("should ignore equivalent network reordering", async () => {
    const chainwatch = installChainwatchHandlers();
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01], [network, secondNetwork]),
    });
    await waitFor(() => expect(chainwatch.addressPuts).toEqual([["0x01"]]));
    const accountGetsAfterRegistration = chainwatch.getAccountGets();

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

    expect(chainwatch.getAccountGets()).toBe(accountGetsAfterRegistration);
  });

  it("should retry reconciliation after a failed Chainwatch request", async () => {
    const chainwatch = installChainwatchHandlers({ exists: true, suffixes: [] }, 1);
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });
    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));

    await act(async () => {});
    act(() => {
      store.dispatch(replaceAccounts([account01]));
    });

    await waitFor(() => expect(chainwatch.addressPuts).toEqual([["0x01"], ["0x01"]]));
    expect(chainwatch.getRemote().suffixes).toEqual(["0x01"]);
  });

  it("should delete Chainwatch accounts when active alerts are turned off", async () => {
    const chainwatch = installChainwatchHandlers();
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });
    await waitFor(() => expect(chainwatch.addressPuts).toEqual([["0x01"]]));

    act(() => {
      store.dispatch(setNotifications({ transactionsAlertsCategory: false }));
    });

    await waitFor(() => expect(chainwatch.getAccountDeletes()).toBe(1));
  });

  it("should wait for reconciliation before deleting disabled alerts", async () => {
    let releaseAddressPut = () => {};
    const addressPutGate = new Promise<void>(resolve => {
      releaseAddressPut = resolve;
    });
    const chainwatch = installChainwatchHandlers({ exists: true, suffixes: [] }, 0, addressPutGate);
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });
    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));

    act(() => {
      store.dispatch(setNotifications({ transactionsAlertsCategory: false }));
    });
    await act(async () => {});
    expect(chainwatch.getAccountDeletes()).toBe(0);

    await act(async () => {
      releaseAddressPut();
    });
    await waitFor(() => expect(chainwatch.getAccountDeletes()).toBe(1));
    expect(chainwatch.getRemote().exists).toBe(false);
  });

  it("should reconcile queued address changes from the last completed state", async () => {
    let releaseAddressPut = () => {};
    const addressPutGate = new Promise<void>(resolve => {
      releaseAddressPut = resolve;
    });
    const chainwatch = installChainwatchHandlers({ exists: true, suffixes: [] }, 0, addressPutGate);
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });
    await waitFor(() => expect(chainwatch.addressPuts).toEqual([["0x01"]]));

    act(() => {
      store.dispatch(replaceAccounts([account02]));
    });
    await act(async () => {
      releaseAddressPut();
    });

    await waitFor(() => expect(chainwatch.addressDeletes).toEqual([["0x01"]]));
    expect(chainwatch.addressPuts).toEqual([["0x01"], ["0x02"]]);
    expect(chainwatch.getRemote().suffixes).toEqual(["0x02"]);
  });

  it("should not delete Chainwatch accounts when alerts start disabled", async () => {
    const chainwatch = installChainwatchHandlers({ exists: true, suffixes: ["0x01"] });

    render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01], [network], false),
    });
    await act(async () => {});

    expect(chainwatch.getAccountDeletes()).toBe(0);
    expect(chainwatch.getAccountGets()).toBe(0);
  });
});
