import React from "react";
import { UserId } from "@ledgerhq/client-ids/ids";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, ChainwatchAccount, ChainwatchNetwork } from "@ledgerhq/types-live";
import { setOverride } from "@shared/feature-flags";
import { server, http, HttpResponse } from "@tests/server";
import { act, render, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { replaceAccounts } from "~/actions/accounts";
import { setNotifications } from "~/actions/settings";
import type { State } from "~/reducers/types";
import {
  clearStoredTransactionsAlertsAddresses,
  createTransactionsAlertsTargets,
  getStoredTransactionsAlertsAddresses,
  getStoredTransactionsAlertsState,
  storeTransactionsAlertsState,
  storeTransactionsAlertsAddresses,
} from "LLM/storage/transactionsAlerts";
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

const createDeferredPromise = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(promiseResolve => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const installChainwatchHandlers = (
  initialRemote?: { exists: boolean; suffixes: string[] },
  options?: {
    failAddressPuts?: number;
    delayAddressPut?: (putIndex: number) => Promise<void>;
    failAccountDeletes?: number;
  },
  chainwatchId = network.chainwatchId,
) => {
  const accountUrl = `https://chainwatch/${chainwatchId}/account/${chainwatchUserId}/`;
  const addressesUrl = `${accountUrl}addresses/`;
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
  let remainingAccountDeleteFailures = options?.failAccountDeletes ?? 0;

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
      if (remainingAccountDeleteFailures > 0) {
        remainingAccountDeleteFailures -= 1;
        return new HttpResponse(null, { status: 500 });
      }
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
  beforeEach(async () => {
    await clearStoredTransactionsAlertsAddresses();
  });

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

  it("should not reconcile when only the number of accounts sharing an address changes", async () => {
    const chainwatch = installChainwatchHandlers();
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));
    const accountGetsAfterRegistration = chainwatch.getAccountGets();

    await act(async () => {
      store.dispatch(replaceAccounts([account01, duplicateAccount01]));
    });
    expect(chainwatch.getAccountGets()).toBe(accountGetsAfterRegistration);

    await act(async () => {
      store.dispatch(replaceAccounts([account01]));
    });
    expect(chainwatch.getAccountGets()).toBe(accountGetsAfterRegistration);
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

    // Failure clears the scheduled operation so the next account refresh can retry it.
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([
      { currencyId: avalanche.id, address: "0x01" },
    ]);
    act(() => {
      store.dispatch(replaceAccounts([account01]));
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(2));
    expect(chainwatch.addressPuts[1].body).toEqual(["0x01"]);
    expect(chainwatch.getRemote().suffixes).toEqual(["0x01"]);
  });

  it("should retry both sides of a partially failed reconciliation", async () => {
    await storeTransactionsAlertsAddresses([
      { currencyId: avalanche.id, address: account01.freshAddress },
    ]);
    const chainwatch = installChainwatchHandlers(
      { exists: true, suffixes: ["0x01"] },
      { failAddressPuts: 1 },
    );
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account02]),
    });

    await waitFor(() => {
      expect(chainwatch.addressDeletes).toHaveLength(1);
      expect(chainwatch.addressPuts).toHaveLength(1);
    });
    expect(chainwatch.getRemote().suffixes).toEqual([]);
    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([
      { currencyId: avalanche.id, address: "0x01" },
      { currencyId: avalanche.id, address: "0x02" },
    ]);

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    act(() => {
      store.dispatch(replaceAccounts([account02]));
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(2));
    expect(chainwatch.getRemote().suffixes).toEqual(["0x02"]);
    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([
      { currencyId: avalanche.id, address: "0x02" },
    ]);
  });

  it("should remove addresses persisted by a previous app session", async () => {
    await storeTransactionsAlertsAddresses([
      { currencyId: avalanche.id, address: account01.freshAddress },
    ]);
    const chainwatch = installChainwatchHandlers({ exists: true, suffixes: ["0x01"] });

    render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account02]),
    });

    await waitFor(() => {
      expect(chainwatch.addressPuts).toHaveLength(1);
      expect(chainwatch.addressDeletes).toHaveLength(1);
    });
    expect(chainwatch.addressPuts[0].body).toEqual(["0x02"]);
    expect(chainwatch.addressDeletes[0].body).toEqual(["0x01"]);
    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([
      { currencyId: avalanche.id, address: "0x02" },
    ]);
  });

  it("should serialize reconciliations when accounts change", async () => {
    const firstAddressPut = createDeferredPromise();
    const chainwatch = installChainwatchHandlers(undefined, {
      delayAddressPut: putIndex => (putIndex === 0 ? firstAddressPut.promise : Promise.resolve()),
    });
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));

    act(() => {
      store.dispatch(replaceAccounts([account02]));
    });
    await act(async () => {});
    expect(chainwatch.addressPuts).toHaveLength(1);

    await act(async () => {
      firstAddressPut.resolve();
      await firstAddressPut.promise;
    });

    await waitFor(() => {
      expect(chainwatch.addressPuts).toHaveLength(2);
      expect(chainwatch.addressDeletes).toHaveLength(1);
    });
    expect(chainwatch.getRemote()).toEqual({ exists: true, suffixes: ["0x02"] });
  });

  it("should remove subscriptions when a supported network is removed", async () => {
    const chainwatch = installChainwatchHandlers();
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));

    act(() => {
      store.dispatch(
        setOverride({
          key: "transactionsAlerts",
          value: {
            ...transactionsAlertsFlag,
            params: { ...transactionsAlertsFlag.params, networks: [] },
          },
        }),
      );
    });

    await waitFor(() => expect(chainwatch.accountDeletes).toHaveLength(1));
    expect(chainwatch.getRemote()).toEqual({ exists: false, suffixes: [] });
    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([]);
  });

  it("should register a remapped target even when the old target cleanup fails", async () => {
    const remappedNetwork = { ...network, chainwatchId: "avax-v2" };
    await storeTransactionsAlertsState({
      targets: createTransactionsAlertsTargets(
        "https://chainwatch",
        [network],
        [{ currencyId: avalanche.id, address: account01.freshAddress }],
      ),
    });
    const oldChainwatch = installChainwatchHandlers(
      { exists: true, suffixes: ["0x01"] },
      { failAccountDeletes: 1 },
    );
    const newChainwatch = installChainwatchHandlers(undefined, undefined, "avax-v2");
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01], [remappedNetwork]),
    });

    await waitFor(() => {
      expect(newChainwatch.addressPuts).toHaveLength(1);
      expect(oldChainwatch.accountDeletes).toHaveLength(1);
    });

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    act(() => {
      store.dispatch(replaceAccounts([account01]));
    });

    await waitFor(() => expect(oldChainwatch.accountDeletes).toHaveLength(2));
    expect(newChainwatch.addressPuts).toHaveLength(1);
    const storedState = await getStoredTransactionsAlertsState("https://chainwatch", [
      remappedNetwork,
    ]);
    expect(storedState.targets).toEqual([
      {
        chainwatchBaseUrl: "https://chainwatch",
        network: remappedNetwork,
        addresses: ["0x01"],
      },
    ]);
  });

  it("should wait for reconciliation before deleting Chainwatch accounts", async () => {
    const addressPut = createDeferredPromise();
    const chainwatch = installChainwatchHandlers(undefined, {
      delayAddressPut: () => addressPut.promise,
    });
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));

    act(() => {
      store.dispatch(setNotifications({ transactionsAlertsCategory: false }));
    });
    await act(async () => {});
    expect(chainwatch.accountDeletes).toHaveLength(0);

    await act(async () => {
      addressPut.resolve();
      await addressPut.promise;
    });

    await waitFor(() => expect(chainwatch.accountDeletes).toHaveLength(1));
    expect(chainwatch.getRemote()).toEqual({ exists: false, suffixes: [] });
    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([]);
  });

  it("should retry a failed cleanup on the next account refresh", async () => {
    await storeTransactionsAlertsAddresses([
      { currencyId: avalanche.id, address: account01.freshAddress },
    ]);
    const chainwatch = installChainwatchHandlers(
      { exists: true, suffixes: ["0x01"] },
      { failAccountDeletes: 1 },
    );
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01], [network], false),
    });

    await waitFor(() => expect(chainwatch.accountDeletes).toHaveLength(1));
    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([
      { currencyId: avalanche.id, address: "0x01" },
    ]);

    act(() => {
      store.dispatch(replaceAccounts([account01]));
    });

    await waitFor(() => expect(chainwatch.accountDeletes).toHaveLength(2));
    expect(chainwatch.getRemote()).toEqual({ exists: false, suffixes: [] });
    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([]);
  });

  it("should clean up once when alerts are disabled on startup", async () => {
    await storeTransactionsAlertsAddresses([
      { currencyId: avalanche.id, address: account01.freshAddress },
    ]);
    const chainwatch = installChainwatchHandlers({ exists: true, suffixes: ["0x01"] });
    const firstRender = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01], [network], false),
    });

    await waitFor(() => expect(chainwatch.accountDeletes).toHaveLength(1));

    firstRender.unmount();
    render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01], [network], false),
    });
    await act(async () => {});

    expect(chainwatch.accountDeletes).toHaveLength(1);
    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([]);
  });

  it("should clean up a persisted network after it is removed from the flag", async () => {
    await storeTransactionsAlertsState({
      targets: createTransactionsAlertsTargets(
        "https://chainwatch",
        [network],
        [{ currencyId: avalanche.id, address: account01.freshAddress }],
      ),
    });
    const chainwatch = installChainwatchHandlers({ exists: true, suffixes: ["0x01"] });

    render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01], [], false),
    });

    await waitFor(() => expect(chainwatch.accountDeletes).toHaveLength(1));
    expect(chainwatch.getRemote()).toEqual({ exists: false, suffixes: [] });
    await expect(getStoredTransactionsAlertsAddresses()).resolves.toEqual([]);
  });

  it("should clean persisted targets when the current base URL is missing", async () => {
    const chainwatch = installChainwatchHandlers();
    const { store } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));

    act(() => {
      store.dispatch(
        setOverride({
          key: "transactionsAlerts",
          value: { enabled: false },
        }),
      );
    });

    await waitFor(() => expect(chainwatch.accountDeletes).toHaveLength(1));
    expect(chainwatch.getRemote()).toEqual({ exists: false, suffixes: [] });
  });

  it("should wait for remote feature flags before cleaning persisted targets", async () => {
    await storeTransactionsAlertsState({
      targets: createTransactionsAlertsTargets(
        "https://chainwatch",
        [network],
        [{ currencyId: avalanche.id, address: account01.freshAddress }],
      ),
    });
    const chainwatch = installChainwatchHandlers({ exists: true, suffixes: ["0x01"] });

    render(<TransactionsAlerts />, {
      overrideInitialState: state => {
        const configuredState = withTransactionsAlertsState([account01], [network], false)(state);
        return {
          ...configuredState,
          featureFlags: {
            ...configuredState.featureFlags,
            remoteFlagsReady: false,
          },
        };
      },
    });
    await act(async () => {});

    expect(chainwatch.accountDeletes).toHaveLength(0);
    expect(chainwatch.getAccountGets()).toBe(0);
    expect(chainwatch.getRemote()).toEqual({ exists: true, suffixes: ["0x01"] });
  });

  it("should attempt every persisted target during cleanup", async () => {
    await storeTransactionsAlertsState({
      targets: createTransactionsAlertsTargets("https://chainwatch", [network, secondNetwork], []),
    });
    const avalancheChainwatch = installChainwatchHandlers(
      { exists: true, suffixes: [] },
      { failAccountDeletes: 1 },
    );
    const bitcoinChainwatch = installChainwatchHandlers(
      { exists: true, suffixes: [] },
      undefined,
      "btc",
    );

    render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([], [], false),
    });

    await waitFor(() => {
      expect(avalancheChainwatch.accountDeletes).toHaveLength(1);
      expect(bitcoinChainwatch.accountDeletes).toHaveLength(1);
    });
  });

  it("should export the user id only when calling Chainwatch", async () => {
    const exportUserId = jest.spyOn(userId, "exportUserIdForChainwatch");
    const chainwatch = installChainwatchHandlers();
    const { rerender } = render(<TransactionsAlerts />, {
      overrideInitialState: withTransactionsAlertsState([account01]),
    });

    await waitFor(() => expect(chainwatch.addressPuts).toHaveLength(1));
    expect(exportUserId).toHaveBeenCalledTimes(1);

    rerender(<TransactionsAlerts />);
    await act(async () => {});
    expect(exportUserId).toHaveBeenCalledTimes(1);

    exportUserId.mockRestore();
  });
});
