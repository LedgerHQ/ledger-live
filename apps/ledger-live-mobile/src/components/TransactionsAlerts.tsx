import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { userIdSelector } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import {
  reconcileTransactionsAlertsAddresses,
  deleteUserChainwatchAccounts,
} from "@ledgerhq/live-common/transactionsAlerts/index";
import type { ChainwatchNetwork, Account } from "@ledgerhq/types-live";
import { notificationsSelector } from "~/reducers/settings";

const haveSameAccountAddresses = (previousAccounts: Account[], nextAccounts: Account[]) =>
  previousAccounts.length === nextAccounts.length &&
  previousAccounts.every(
    (account, index) =>
      account.currency.id === nextAccounts[index].currency.id &&
      account.freshAddress.toLowerCase() === nextAccounts[index].freshAddress.toLowerCase(),
  );

const TransactionsAlerts = () => {
  const featureTransactionsAlerts = useFeature("transactionsAlerts");
  const chainwatchBaseUrl = featureTransactionsAlerts?.params?.chainwatchBaseUrl;
  const supportedChains = useMemo(
    () => featureTransactionsAlerts?.params?.networks || [],
    [featureTransactionsAlerts?.params],
  );
  const supportedChainsIds = useMemo(
    () => supportedChains.map((chain: ChainwatchNetwork) => chain.ledgerLiveId),
    [supportedChains],
  );

  const notifications = useSelector(notificationsSelector);
  const userId = useSelector(userIdSelector);
  // Only address changes should trigger reconciliation.
  const accountsFilteredBySupportedChains = useSelector(
    state =>
      accountsSelector(state).filter(account => supportedChainsIds.includes(account.currency.id)),
    haveSameAccountAddresses,
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
      deleteUserChainwatchAccounts(
        userId.exportUserIdForChainwatch(),
        chainwatchBaseUrl,
        supportedChains,
      );
    }
    refFeatureEnabled.current = featureTransactionsAlerts?.enabled;
    refNotifSettings.current = notifications.transactionsAlertsCategory;

    if (!featureTransactionsAlerts?.enabled || !notifications.transactionsAlertsCategory) return;

    let isCurrentReconciliation = true;
    void reconcileTransactionsAlertsAddresses(
      userId.exportUserIdForChainwatch(),
      chainwatchBaseUrl,
      supportedChains,
      accountsFilteredBySupportedChains,
      refAccounts.current,
    )
      .then(() => {
        if (isCurrentReconciliation) {
          refAccounts.current = accountsFilteredBySupportedChains;
        }
      })
      .catch(() => undefined);

    return () => {
      isCurrentReconciliation = false;
    };
  }, [
    featureTransactionsAlerts?.enabled,
    chainwatchBaseUrl,
    accountsFilteredBySupportedChains,
    notifications.transactionsAlertsCategory,
    supportedChains,
    userId,
  ]);

  return null;
};

export default TransactionsAlerts;
