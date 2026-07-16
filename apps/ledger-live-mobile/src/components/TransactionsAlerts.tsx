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
  const userId = useSelector(userIdSelector);
  const accountsFilteredBySupportedChains = useMemo(
    () => accounts.filter(account => supportedChainsIds.includes(account?.currency?.id)),
    [accounts, supportedChainsIds],
  );
  const refAccounts = useRef<Account[]>([]);
  const refFeatureEnabled = useRef<boolean>(false);
  const refNotifSettings = useRef<boolean>(false);
  const refReconciliationKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!chainwatchBaseUrl) return;

    // If the FF is disabled or if the transactionsAlerts toggle is turned off in the settings we stop tracking all addresses for this user
    if (
      (!featureTransactionsAlerts?.enabled && refFeatureEnabled.current) ||
      (!notifications.transactionsAlertsCategory && refNotifSettings.current)
    ) {
      refReconciliationKey.current = undefined;
      deleteUserChainwatchAccounts(
        userId.exportUserIdForChainwatch(),
        chainwatchBaseUrl,
        supportedChains,
      );
    }
    refFeatureEnabled.current = featureTransactionsAlerts?.enabled;
    refNotifSettings.current = notifications.transactionsAlertsCategory;

    if (!featureTransactionsAlerts?.enabled || !notifications.transactionsAlertsCategory) return;

    // Ignore balance-only syncs while allowing failed reconciliations to retry.
    const reconciliationKey = JSON.stringify({
      accounts: accountsFilteredBySupportedChains
        .map(account => `${account.currency.id}:${account.freshAddress.toLowerCase()}`)
        .sort(),
      chainwatchBaseUrl,
      supportedChains,
      userId: userId.exportUserIdForChainwatch(),
    });
    if (refReconciliationKey.current === reconciliationKey) return;

    refReconciliationKey.current = reconciliationKey;
    void reconcileTransactionsAlertsAddresses(
      userId.exportUserIdForChainwatch(),
      chainwatchBaseUrl,
      supportedChains,
      accountsFilteredBySupportedChains,
      refAccounts.current,
    )
      .then(() => {
        if (refReconciliationKey.current === reconciliationKey) {
          refAccounts.current = accountsFilteredBySupportedChains;
        }
      })
      .catch(() => {
        if (refReconciliationKey.current === reconciliationKey) {
          refReconciliationKey.current = undefined;
        }
      });
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
