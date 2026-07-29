import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { userIdSelector, type UserId } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import {
  reconcileTransactionsAlertsAddresses,
  deleteUserChainwatchAccounts,
  getTransactionsAlertsAddresses,
  getTransactionsAlertsAddressKey,
  type TransactionsAlertsAddress,
} from "@ledgerhq/live-common/transactionsAlerts/index";
import type { ChainwatchNetwork } from "@ledgerhq/types-live";
import { notificationsSelector } from "~/reducers/settings";

type ScheduledOperation = {
  userId: UserId;
  key: string;
};

const TransactionsAlerts = () => {
  const featureTransactionsAlerts = useFeature("transactionsAlerts");
  const chainwatchBaseUrl = featureTransactionsAlerts?.params?.chainwatchBaseUrl;
  const supportedChains = useMemo(
    () => featureTransactionsAlerts?.params?.networks || [],
    [featureTransactionsAlerts?.params],
  );
  const supportedChainsIds = useMemo(
    () => new Set(supportedChains.map((chain: ChainwatchNetwork) => chain.ledgerLiveId)),
    [supportedChains],
  );

  const notifications = useSelector(notificationsSelector);
  const accounts = useSelector(accountsSelector);
  const userId = useSelector(userIdSelector);
  const accountsFilteredBySupportedChains = useMemo(
    () => accounts.filter(account => supportedChainsIds.has(account?.currency?.id)),
    [accounts, supportedChainsIds],
  );
  const transactionsAlertsAddresses = useMemo(
    () => getTransactionsAlertsAddresses(accountsFilteredBySupportedChains),
    [accountsFilteredBySupportedChains],
  );
  const refActive = useRef(false);
  const refAddresses = useRef<TransactionsAlertsAddress[]>([]);
  const refScheduledOperation = useRef<ScheduledOperation | undefined>(undefined);
  const refOperationQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!chainwatchBaseUrl) return;

    const isActive = Boolean(
      featureTransactionsAlerts?.enabled && notifications.transactionsAlertsCategory,
    );
    const shouldDelete = refActive.current && !isActive;
    if (!isActive && !shouldDelete) return;
    if (isActive) refActive.current = true;

    const operationKey = JSON.stringify({
      mode: isActive ? "reconcile" : "delete",
      addresses: isActive
        ? transactionsAlertsAddresses
            .map(({ currencyId, address }) => getTransactionsAlertsAddressKey(currencyId, address))
            .sort((first, second) => first.localeCompare(second))
        : undefined,
      chainwatchBaseUrl,
      supportedChains: supportedChains
        .map(
          ({ ledgerLiveId, chainwatchId, nbConfirmations }) =>
            `${ledgerLiveId}:${chainwatchId}:${nbConfirmations}`,
        )
        .sort((first, second) => first.localeCompare(second)),
    });
    const scheduledOperation = refScheduledOperation.current;
    if (scheduledOperation?.userId.equals(userId) && scheduledOperation.key === operationKey)
      return;

    const operation: ScheduledOperation = {
      userId,
      key: operationKey,
    };
    refScheduledOperation.current = operation;

    const operationPromise = refOperationQueue.current
      .catch(() => undefined)
      .then(async () => {
        if (isActive) {
          await reconcileTransactionsAlertsAddresses(
            userId.exportUserIdForChainwatch(),
            chainwatchBaseUrl,
            supportedChains,
            transactionsAlertsAddresses,
            refAddresses.current,
          );
          refAddresses.current = transactionsAlertsAddresses;
        } else {
          await deleteUserChainwatchAccounts(
            userId.exportUserIdForChainwatch(),
            chainwatchBaseUrl,
            supportedChains,
          );
          refAddresses.current = [];
          if (refScheduledOperation.current === operation) {
            refActive.current = false;
          }
        }
      });
    refOperationQueue.current = operationPromise;

    void operationPromise.catch(() => {
      if (refScheduledOperation.current === operation) {
        refScheduledOperation.current = undefined;
      }
    });
  }, [
    featureTransactionsAlerts?.enabled,
    chainwatchBaseUrl,
    notifications.transactionsAlertsCategory,
    supportedChains,
    transactionsAlertsAddresses,
    userId,
  ]);

  return null;
};

export default TransactionsAlerts;
