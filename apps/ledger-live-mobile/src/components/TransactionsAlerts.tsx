import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "../reducers/accounts";
import getOrCreateUser from "../user";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  updateTransactionsAlertsAddresses,
  deleteUserChainwatchAccounts,
} from "@ledgerhq/live-common/transactionsAlerts/index";
import type { ChainwatchNetwork, Account } from "@ledgerhq/types-live";
import { notificationsSelector } from "../reducers/settings";

const TransactionsAlerts = () => {
  const featureTransactionsAlerts = useFeature<{
    chainwatchBaseUrl: string;
    networks: ChainwatchNetwork[];
  }>("transactionsAlerts");
  const chainwatchBaseUrl = featureTransactionsAlerts?.params?.chainwatchBaseUrl;
  const supportedChains = featureTransactionsAlerts?.params?.networks || [];
  const supportedChainsIds = supportedChains.map((chain: ChainwatchNetwork) => chain.ledgerLiveId);

  const notifications = useSelector(notificationsSelector);
  const accounts = useSelector(accountsSelector);
  const accountsFilteredBySupportedChains = useMemo(
    () => accounts.filter(account => supportedChainsIds.includes(account?.currency?.id)),
    [accounts, supportedChainsIds],
  );
  const refAccounts = useRef<Account[]>([]);

  const syncTransactionsAlerts = async (newAccounts: Account[], removedAccounts: Account[]) => {
    if (chainwatchBaseUrl) {
      const { user } = await getOrCreateUser();
      updateTransactionsAlertsAddresses(
        user.id,
        chainwatchBaseUrl,
        supportedChains,
        newAccounts,
        removedAccounts,
      );
    }
  };

  useEffect(() => {
    if (!chainwatchBaseUrl) return;

    // If the FF is disabled or if the transactionsAlerts toggle is turned off in the settings we stop tracking all addresses for this user
    if (!featureTransactionsAlerts?.enabled || !notifications.transactionsAlertsCategory) {
      getOrCreateUser().then(({ user }) => {
        deleteUserChainwatchAccounts(user.id, chainwatchBaseUrl, supportedChains);
      });
      return;
    }

    const newAccounts = accountsFilteredBySupportedChains.filter(
      account => !refAccounts.current.find(refAccount => refAccount.id === account.id),
    );
    const removedAccounts = refAccounts.current.filter(
      refAccount =>
        !accountsFilteredBySupportedChains.find(account => account.id === refAccount.id),
    );

    if (newAccounts.length > 0 || removedAccounts.length > 0) {
      syncTransactionsAlerts(newAccounts, removedAccounts);
    }
    refAccounts.current = accountsFilteredBySupportedChains;
  }, [
    featureTransactionsAlerts?.enabled,
    chainwatchBaseUrl,
    accountsFilteredBySupportedChains,
    notifications.transactionsAlertsCategory,
  ]);

  return null;
};

export default TransactionsAlerts;
