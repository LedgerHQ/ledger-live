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
  // Keep Chainwatch mutations ordered so stale requests cannot overwrite newer state.
  const refChainwatchOperations = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!chainwatchBaseUrl) return;

    const enqueueChainwatchOperation = (operation: () => Promise<void>) => {
      const queuedOperation = refChainwatchOperations.current
        .catch(() => undefined)
        .then(operation);
      refChainwatchOperations.current = queuedOperation;
      return queuedOperation;
    };

    // If the FF is disabled or if the transactionsAlerts toggle is turned off in the settings we stop tracking all addresses for this user
    if (
      (!featureTransactionsAlerts?.enabled && refFeatureEnabled.current) ||
      (!notifications.transactionsAlertsCategory && refNotifSettings.current)
    ) {
      refReconciliationKey.current = undefined;
      void enqueueChainwatchOperation(async () => {
        await deleteUserChainwatchAccounts(
          userId.exportUserIdForChainwatch(),
          chainwatchBaseUrl,
          supportedChains,
        );
        refAccounts.current = [];
      }).catch(() => undefined);
    }
    refFeatureEnabled.current = featureTransactionsAlerts?.enabled;
    refNotifSettings.current = notifications.transactionsAlertsCategory;

    if (!featureTransactionsAlerts?.enabled || !notifications.transactionsAlertsCategory) return;

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
    void enqueueChainwatchOperation(async () => {
      const previousAccounts = refAccounts.current;
      try {
        await reconcileTransactionsAlertsAddresses(
          userId.exportUserIdForChainwatch(),
          chainwatchBaseUrl,
          supportedChains,
          accountsFilteredBySupportedChains,
          previousAccounts,
        );
        refAccounts.current = accountsFilteredBySupportedChains;
      } catch (error) {
        refAccounts.current = [...previousAccounts, ...accountsFilteredBySupportedChains];
        throw error;
      }
    }).catch(() => {
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
