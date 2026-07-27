import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { userIdSelector, type UserId } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import { selectRemoteFlagsReady } from "@shared/feature-flags";
import {
  reconcileTransactionsAlertsAddresses,
  deleteUserChainwatchAccounts,
  getTransactionsAlertsAddresses,
  getTransactionsAlertsAddressKey,
} from "@ledgerhq/live-common/transactionsAlerts/index";
import type { ChainwatchNetwork } from "@ledgerhq/types-live";
import { notificationsSelector } from "~/reducers/settings";
import {
  createTransactionsAlertsTargets,
  getStoredTransactionsAlertsState,
  getTransactionsAlertsTargetKey,
  mergeTransactionsAlertsTargets,
  storeTransactionsAlertsState,
  type TransactionsAlertsTarget,
} from "LLM/storage/transactionsAlerts";

type ScheduledOperation = {
  userId: UserId;
  key: string;
  token: symbol;
};

let chainwatchOperations = Promise.resolve();

const enqueueChainwatchOperation = (operation: () => Promise<void>) => {
  // Effect reruns must not let an older reconciliation finish after a newer one.
  const queuedOperation = chainwatchOperations.catch(() => undefined).then(operation);
  chainwatchOperations = queuedOperation;
  return queuedOperation;
};

const getTargetAddresses = ({ network, addresses }: TransactionsAlertsTarget) =>
  addresses.map(address => ({ currencyId: network.ledgerLiveId, address }));

const runChainwatchOperations = async (operations: (() => Promise<void>)[]) => {
  const errors: unknown[] = [];
  for (const operation of operations) {
    try {
      await operation();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) throw errors[0];
};

const getCleanupKey = (targets: TransactionsAlertsTarget[]) =>
  JSON.stringify(
    targets
      .map(target => `${getTransactionsAlertsTargetKey(target)}:${target.network.nbConfirmations}`)
      .sort((first, second) => first.localeCompare(second)),
  );

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
  const remoteFlagsReady = useSelector(selectRemoteFlagsReady);
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
  const currentTargets = useMemo(
    () =>
      chainwatchBaseUrl
        ? createTransactionsAlertsTargets(
            chainwatchBaseUrl,
            supportedChains,
            transactionsAlertsAddresses,
          )
        : [],
    [chainwatchBaseUrl, supportedChains, transactionsAlertsAddresses],
  );
  const refScheduledOperation = useRef<ScheduledOperation | undefined>(undefined);

  useEffect(() => {
    if (!remoteFlagsReady) return;

    const shouldReconcile =
      Boolean(chainwatchBaseUrl) &&
      featureTransactionsAlerts?.enabled &&
      notifications.transactionsAlertsCategory;
    const operationKey = JSON.stringify({
      mode: shouldReconcile ? "reconcile" : "delete",
      addresses: shouldReconcile
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
      token: Symbol(),
    };
    refScheduledOperation.current = operation;

    const operationPromise =
      shouldReconcile && chainwatchBaseUrl
        ? enqueueChainwatchOperation(async () => {
            const previousState = await getStoredTransactionsAlertsState(
              chainwatchBaseUrl,
              supportedChains,
            );
            const previousTargetsByKey = new Map(
              previousState.targets.map(target => [getTransactionsAlertsTargetKey(target), target]),
            );
            const currentTargetsByKey = new Map(
              currentTargets.map(target => [getTransactionsAlertsTargetKey(target), target]),
            );
            const pendingTargets = mergeTransactionsAlertsTargets([
              ...previousState.targets,
              ...currentTargets,
            ]);
            // Keep a conservative superset until every remote mutation succeeds.
            await storeTransactionsAlertsState({ targets: pendingTargets });
            const currentOperations = currentTargets.flatMap(currentTarget => {
              const targetKey = getTransactionsAlertsTargetKey(currentTarget);
              const previousTarget = previousTargetsByKey.get(targetKey);
              if (!currentTarget.addresses.length && !previousTarget?.addresses.length) return [];
              return [
                () =>
                  reconcileTransactionsAlertsAddresses(
                    userId.exportUserIdForChainwatch(),
                    currentTarget.chainwatchBaseUrl,
                    [currentTarget.network],
                    getTargetAddresses(currentTarget),
                    getTargetAddresses(previousTarget ?? { ...currentTarget, addresses: [] }),
                  ),
              ];
            });
            const staleTargetOperations = previousState.targets
              .filter(target => !currentTargetsByKey.has(getTransactionsAlertsTargetKey(target)))
              .map(
                target => () =>
                  deleteUserChainwatchAccounts(
                    userId.exportUserIdForChainwatch(),
                    target.chainwatchBaseUrl,
                    [target.network],
                  ),
              );
            await runChainwatchOperations([...currentOperations, ...staleTargetOperations]);
            await storeTransactionsAlertsState({ targets: currentTargets });
          })
        : enqueueChainwatchOperation(async () => {
            const previousState = await getStoredTransactionsAlertsState(
              chainwatchBaseUrl,
              supportedChains,
            );
            const cleanupTargets = mergeTransactionsAlertsTargets([
              ...previousState.targets,
              ...currentTargets,
            ]);
            const currentCleanupKey = getCleanupKey(currentTargets);
            if (
              previousState.targets.length === 0 &&
              previousState.cleanupKey === currentCleanupKey
            )
              return;

            await runChainwatchOperations(
              cleanupTargets.map(
                target => () =>
                  deleteUserChainwatchAccounts(
                    userId.exportUserIdForChainwatch(),
                    target.chainwatchBaseUrl,
                    [target.network],
                  ),
              ),
            );
            await storeTransactionsAlertsState({ targets: [], cleanupKey: currentCleanupKey });
          });

    void operationPromise.catch(() => {
      if (refScheduledOperation.current?.token === operation.token) {
        refScheduledOperation.current = undefined;
      }
    });
  }, [
    featureTransactionsAlerts?.enabled,
    chainwatchBaseUrl,
    notifications.transactionsAlertsCategory,
    remoteFlagsReady,
    supportedChains,
    currentTargets,
    transactionsAlertsAddresses,
    userId,
  ]);

  return null;
};

export default TransactionsAlerts;
