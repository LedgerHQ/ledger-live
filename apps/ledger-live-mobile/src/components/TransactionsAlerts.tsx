import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "../reducers/accounts";
import getOrCreateUser from "../user";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import updateTransactionsAlertsAddresses from "@ledgerhq/live-common/transactionsAlerts/index";
import type { ChainwatchNetwork, Account } from "@ledgerhq/types-live";

const TransactionsAlerts = () => {
  const featureTransactionsAlerts = useFeature<{
    chainwatchBaseUrl: string;
    networks: ChainwatchNetwork[];
  }>("transactionsAlerts");
  const chainwatchBaseUrl = featureTransactionsAlerts?.params?.chainwatchBaseUrl;
  const supportedChains = featureTransactionsAlerts?.params?.networks || [];
  const supportedChainsIds = supportedChains.map((chain: ChainwatchNetwork) => chain.ledgerLiveId);

  const accounts = useSelector(accountsSelector);
  const accountsFilteredBySupportedChains = useMemo(
    () => accounts.filter(account => supportedChainsIds.includes(account?.currency?.id)),
    [accounts, supportedChainsIds],
  );
  const refAccounts = useRef<Account[]>([]);


  const syncTransactionsAlerts = async (
    newAccounts: Account[],
    removedAccounts: Account[],
  ) => {
    const { user } = await getOrCreateUser();
    updateTransactionsAlertsAddresses(user.id, chainwatchBaseUrl, supportedChains, newAccounts, removedAccounts);
  };

  useEffect(() => {
    if (!chainwatchBaseUrl) return

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
  }, [chainwatchBaseUrl, accountsFilteredBySupportedChains]);

  return null;
};

export default TransactionsAlerts;
