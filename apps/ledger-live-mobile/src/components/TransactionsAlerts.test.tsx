import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  deleteUserChainwatchAccounts,
  reconcileTransactionsAlertsAddresses,
} from "@ledgerhq/live-common/transactionsAlerts/index";
import type { Account, ChainwatchNetwork } from "@ledgerhq/types-live";
import { act, render, waitFor } from "@testing-library/react-native";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { notificationsSelector } from "~/reducers/settings";
import { userIdSelector } from "@ledgerhq/client-ids/store";
import TransactionsAlerts from "./TransactionsAlerts";

jest.mock("@ledgerhq/live-common/transactionsAlerts/index");
jest.mock("@features/platform-feature-flags");
jest.mock("~/context/hooks");

const mockedDeleteUserChainwatchAccounts = jest.mocked(deleteUserChainwatchAccounts);
const mockedReconcileTransactionsAlertsAddresses = jest.mocked(
  reconcileTransactionsAlertsAddresses,
);
const mockedUseFeature = jest.mocked(useFeature);
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

const createDeferredPromise = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(promiseResolve => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

describe("TransactionsAlerts", () => {
  let accounts: Account[];
  let transactionsAlertsEnabled: boolean;

  beforeEach(() => {
    jest.clearAllMocks();
    accounts = [makeAccount("first-account", "0x01")];
    transactionsAlertsEnabled = true;
    mockedUseFeature.mockReturnValue({
      enabled: true,
      params: {
        chainwatchBaseUrl: "https://chainwatch",
        networks: [network],
      },
    });
    mockedUseSelector.mockImplementation(selector => {
      if (selector === accountsSelector) return accounts;
      if (selector === notificationsSelector) {
        return { transactionsAlertsCategory: transactionsAlertsEnabled };
      }
      if (selector === userIdSelector) return userId;
      throw new Error("Unexpected selector");
    });
  });

  it("should serialize reconciliations when addresses change", async () => {
    const firstReconciliation = createDeferredPromise();
    mockedReconcileTransactionsAlertsAddresses
      .mockReturnValueOnce(firstReconciliation.promise)
      .mockResolvedValueOnce(undefined);
    const { rerender } = render(<TransactionsAlerts />);

    await waitFor(() =>
      expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledTimes(1),
    );

    const firstAccounts = accounts;
    accounts = [makeAccount("second-account", "0x02")];
    rerender(<TransactionsAlerts />);

    expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstReconciliation.resolve();
      await firstReconciliation.promise;
    });

    await waitFor(() =>
      expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledTimes(2),
    );
    expect(
      mockedReconcileTransactionsAlertsAddresses.mock.calls[1][4].map(
        account => account.freshAddress,
      ),
    ).toEqual(firstAccounts.map(account => account.freshAddress));
  });

  it("should wait for reconciliation before deleting Chainwatch accounts", async () => {
    const reconciliation = createDeferredPromise();
    mockedReconcileTransactionsAlertsAddresses.mockReturnValueOnce(reconciliation.promise);
    const { rerender } = render(<TransactionsAlerts />);

    await waitFor(() =>
      expect(mockedReconcileTransactionsAlertsAddresses).toHaveBeenCalledTimes(1),
    );

    transactionsAlertsEnabled = false;
    rerender(<TransactionsAlerts />);

    expect(mockedDeleteUserChainwatchAccounts).not.toHaveBeenCalled();

    await act(async () => {
      reconciliation.resolve();
      await reconciliation.promise;
    });

    await waitFor(() => expect(mockedDeleteUserChainwatchAccounts).toHaveBeenCalledTimes(1));
  });
});
