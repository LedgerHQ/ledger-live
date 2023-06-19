import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "../reducers/accounts";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { ChainwatchAccountManager } from "@ledgerhq/live-common/transactionsAlerts/index";
import type { ChainwatchNetwork } from "@ledgerhq/types-live";

const TransactionsAlerts = () => {
  const featureTransactionsAlerts = useFeature<{
    chainwatchBaseUrl: string,
    networks: ChainwatchNetwork[],
  }>("transactionsAlerts");
  
  console.log("FEATURE FLAG", featureTransactionsAlerts);
  if (!featureTransactionsAlerts?.enabled) {
      return null;
  }

  const supportedChains = featureTransactionsAlerts?.params?.networks || [];
  const supportedChainsIds = supportedChains.map(chain => chain.ledgerLiveId);

  const accounts = useSelector(accountsSelector);
  const accountsFilteredBySupportedChains = useMemo(() => accounts.filter(account => supportedChainsIds.includes(account?.currency?.id)), [accounts, supportedChains]);
  const refAccounts = useRef(accounts);

  const registerNewAccountsAddresses = useCallback(async (newAccounts) => {
        
  }, []);

  const removeAccountsAddresses = useCallback(async (removedAccounts) => {
        
  }, []);


  useEffect(() => {
    const newAccounts = accountsFilteredBySupportedChains.filter(account => !refAccounts.current.find(refAccount => refAccount.id === account.id));
    const removedAccounts = refAccounts.current.filter(refAccount => !accountsFilteredBySupportedChains.find(account => account.id === refAccount.id));

    if (newAccounts.length > 0) {
        registerNewAccountsAddresses(newAccounts);
    }
    if (removedAccounts.length > 0) {
        removeAccountsAddresses(removedAccounts);
    }
    refAccounts.current = accountsFilteredBySupportedChains;
  }, [accountsFilteredBySupportedChains]);

  return null;
}

export default TransactionsAlerts;