import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/reducers/accounts";
import getOrCreateUser from "../user";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import {
  updateTransactionsAlertsAddresses,
  deleteUserChainwatchAccounts,
} from "@ledgerhq/live-common/transactionsAlerts/index";
import type { ChainwatchNetwork, Account } from "@ledgerhq/types-live";
import { notificationsSelector } from "~/reducers/settings";

const TransactionsAlerts = () => {
  const featureTransactionsAlerts = useFeature("transactionsAlerts");
  const chainwatchBaseUrl = featureTransactionsAlerts?.params?.chainwatchBaseUrl;
  const supportedChains = useMemo(
    () => featureTransactionsAlerts?.params?.networks || [],
    [featureTransactionsAlerts?.params],
  );
  const supportedChainsIds = supportedChains.map((chain: ChainwatchNetwork) => chain.ledgerLiveId);

  const notifications = useSelector(notificationsSelector);
  const accounts = useSelector(accountsSelector);
  const accountsFilteredBySupportedChains = useMemo(
    () => accounts.filter(account => supportedChainsIds.includes(account?.currency?.id)),
    [accounts, supportedChainsIds],
  );
  const refAccounts = useRef<Account[]>([]);
  const refFeatureEnabled = useRef<boolean>(false);
  const refNotifSettings = useRef<boolean>(false);

  useEffect(() => {
    if (!chainwatchBaseUrl) return;

    // If the FF is disabled or if the transactionsAlerts toggle is turned off in the settings we stop tracking all addresses for this user
    if (
      (!featureTransactionsAlerts?.enabled && refFeatureEnabled.current) ||
      (!notifications.transactionsAlertsCategory && refNotifSettings.current)
    ) {
      getOrCreateUser().then(({ user }) => {
        deleteUserChainwatchAccounts(user.id, chainwatchBaseUrl, supportedChains);
      });
    }
    const newAccounts =
      notifications.transactionsAlertsCategory && !refNotifSettings.current
        ? accountsFilteredBySupportedChains
        : accountsFilteredBySupportedChains.filter(
            account => !refAccounts.current.find(refAccount => refAccount.id === account.id),
          );
    const removedAccounts = refAccounts.current.filter(
      refAccount =>
        !accountsFilteredBySupportedChains.find(account => account.id === refAccount.id),
    );

    refFeatureEnabled.current = featureTransactionsAlerts?.enabled;
    refNotifSettings.current = notifications.transactionsAlertsCategory;

    if (!featureTransactionsAlerts?.enabled || !notifications.transactionsAlertsCategory) return;

    if (newAccounts.length > 0 || removedAccounts.length > 0) {
      getOrCreateUser().then(({ user }) => {
        updateTransactionsAlertsAddresses(
          user.id,
          chainwatchBaseUrl,
          supportedChains,
          newAccounts,
          removedAccounts,
        );
      });
    }
    refAccounts.current = accountsFilteredBySupportedChains;
    refFeatureEnabled.current = featureTransactionsAlerts?.enabled;
    refNotifSettings.current = notifications.transactionsAlertsCategory;
  }, [
    featureTransactionsAlerts?.enabled,
    chainwatchBaseUrl,
    accountsFilteredBySupportedChains,
    notifications.transactionsAlertsCategory,
    supportedChains,
  ]);

  return null;
};

export default TransactionsAlerts;
