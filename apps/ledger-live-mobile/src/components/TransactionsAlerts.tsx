import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "../reducers/accounts";
import getOrCreateUser from "../user";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import ChainwatchAccountManager from "@ledgerhq/live-common/transactionsAlerts/index";
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

  const formatAccountsByCurrencies = (newAccounts: Account[], removedAccounts: Account[]) => {
    const accountsByCurrencies: Record<
      string,
      { newAccounts: Account[]; removedAccounts: Account[] }
    > = {};

    for (const newAccount of newAccounts) {
      if (!accountsByCurrencies[newAccount.currency.id]) {
        accountsByCurrencies[newAccount.currency.id] = { newAccounts: [], removedAccounts: [] };
      }
      accountsByCurrencies[newAccount.currency.id].newAccounts.push(newAccount);
    }
    for (const removedAccount of removedAccounts) {
      if (!accountsByCurrencies[removedAccount.currency.id]) {
        accountsByCurrencies[removedAccount.currency.id] = { newAccounts: [], removedAccounts: [] };
      }
      accountsByCurrencies[removedAccount.currency.id].removedAccounts.push(removedAccount);
    }

    return accountsByCurrencies;
  };

  const updateTransactionAlertsAddresses = async (
    newAccounts: Account[],
    removedAccounts: Account[],
  ) => {
    const { user } = await getOrCreateUser();
    const accountsByCurrencies = formatAccountsByCurrencies(newAccounts, removedAccounts);

    for (const [currencyId, accounts] of Object.entries(accountsByCurrencies)) {
      const network = supportedChains.find(
        (chain: ChainwatchNetwork) => chain.ledgerLiveId === currencyId,
      );
      const accountManager = new ChainwatchAccountManager(chainwatchBaseUrl, user.id, network);

      await accountManager.setupChainwatchAccount();
      await Promise.all([
        accountManager.registerNewAccountsAddresses(accounts.newAccounts),
        accountManager.removeAccountsAddresses(accounts.removedAccounts),
      ]);
    }
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
      updateTransactionAlertsAddresses(newAccounts, removedAccounts);
    }
    refAccounts.current = accountsFilteredBySupportedChains;
  }, [chainwatchBaseUrl, accountsFilteredBySupportedChains]);

  return null;
};

export default TransactionsAlerts;
