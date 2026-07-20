import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  deleteUserChainwatchAccounts,
  reconcileTransactionsAlertsAddresses,
} from "@ledgerhq/live-common/transactionsAlerts/index";
import type { Account, ChainwatchNetwork } from "@ledgerhq/types-live";
import {
  FEATURE_FLAGS_DEFAULTS,
  FEATURE_FLAGS_INITIAL_STATE,
  featureFlagsReducer,
} from "@shared/feature-flags";
import { render, waitFor } from "@testing-library/react-native";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { notificationsSelector } from "~/reducers/settings";
import { userIdSelector } from "@ledgerhq/client-ids/store";
import TransactionsAlerts from "./TransactionsAlerts";

jest.mock("@ledgerhq/live-common/transactionsAlerts/index", () => {
  const actual = jest.requireActual<
    typeof import("@ledgerhq/live-common/transactionsAlerts/index")
  >("@ledgerhq/live-common/transactionsAlerts/index");

  return {
    ...actual,
    deleteUserChainwatchAccounts: jest.fn(),
    getTransactionsAlertsAddressKey: jest.fn(
      (currencyId: string, address: string) => `${currencyId}:${address}`,
    ),
    reconcileTransactionsAlertsAddresses: jest.fn(),
  };
});
jest.mock("~/context/hooks", () => ({ useSelector: jest.fn() }));

const mockedDeleteUserChainwatchAccounts = jest.mocked(deleteUserChainwatchAccounts);
const mockedReconcileTransactionsAlertsAddresses = jest.mocked(
  reconcileTransactionsAlertsAddresses,
);
const mockedUseSelector = jest.mocked(useSelector);

const avalanche = getCryptoCurrencyById("avalanche_c_chain");
const network: ChainwatchNetwork = {
  ledgerLiveId: avalanche.id,
  chainwatchId: "avax",
  nbConfirmations: 1,
};
const chainwatchUserId = "chainwatch-user-id";
const userId = { exportUserIdForChainwatch: () => chainwatchUserId };

const makeAccount = (id: string, freshAddress: string): Account => ({
  ...genAccount(id, { currency: avalanche }),
  freshAddress,
});

const renderTransactionsAlerts = () =>
  render(<TransactionsAlerts />, {
    wrapper: ({ children }) => {
      const store = configureStore({
        reducer: { featureFlags: featureFlagsReducer },
        preloadedState: {
          featureFlags: {
            ...FEATURE_FLAGS_INITIAL_STATE,
            resolved: {
              ...FEATURE_FLAGS_DEFAULTS,
              transactionsAlerts: {
                enabled: true,
                params: {
                  chainwatchBaseUrl: "https://chainwatch",
                  networks: [network],
                },
              },
            },
          },
        },
      });

      return <Provider store={store}>{children}</Provider>;
    },
  });

describe("TransactionsAlerts", () => {
  let accounts: Account[];
  let transactionsAlertsEnabled: boolean;

  beforeEach(() => {
    jest.clearAllMocks();
    accounts = [makeAccount("first-account", "0x01")];
    transactionsAlertsEnabled = true;
    mockedDeleteUserChainwatchAccounts.mockResolvedValue(undefined);
    mockedReconcileTransactionsAlertsAddresses.mockResolvedValue(undefined);
    mockedUseSelector.mockImplementation(selector => {
      if (selector === accountsSelector) return accounts;
      if (selector === notificationsSelector) {
        return { transactionsAlertsCategory: transactionsAlertsEnabled };
      }
      if (selector === userIdSelector) return userId;
      throw new Error("Unexpected selector");
    });
  });

  it("should reconcile supported accounts", async () => {
    renderTransactionsAlerts();

    await waitFor(() =>
      expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledWith(
        chainwatchUserId,
        "https://chainwatch",
        [network],
        accounts,
        [],
      ),
    );
  });

  it("should use successfully reconciled accounts as previous state", async () => {
    const previousAccounts = accounts;
    const { rerender } = renderTransactionsAlerts();
    await waitFor(() =>
      expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledTimes(1),
    );

    accounts = [makeAccount("second-account", "0x02")];
    rerender(<TransactionsAlerts />);

    await waitFor(() =>
      expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledTimes(2),
    );
    expect(
      mockedReconcileTransactionsAlertsAddresses.mock.calls[1][4].map(
        account => account.freshAddress,
      ),
    ).toEqual(previousAccounts.map(account => account.freshAddress));
  });

  it("should skip an unchanged reconciliation after success", async () => {
    const { rerender } = renderTransactionsAlerts();
    await waitFor(() =>
      expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledTimes(1),
    );

    rerender(<TransactionsAlerts />);

    expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledTimes(1);
  });

  it("should retry an unchanged reconciliation after failure", async () => {
    mockedReconcileTransactionsAlertsAddresses.mockRejectedValueOnce(new Error("failed"));
    const { rerender } = renderTransactionsAlerts();
    await waitFor(() =>
      expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledTimes(1),
    );

    rerender(<TransactionsAlerts />);

    await waitFor(() =>
      expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledTimes(2),
    );
  });

  it("should delete Chainwatch accounts when alerts are disabled", async () => {
    const { rerender } = renderTransactionsAlerts();
    await waitFor(() =>
      expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledTimes(1),
    );

    transactionsAlertsEnabled = false;
    rerender(<TransactionsAlerts />);

    await waitFor(() =>
      expect(mockedDeleteUserChainwatchAccounts).toHaveBeenCalledWith(
        chainwatchUserId,
        "https://chainwatch",
        [network],
      ),
    );
  });
});
