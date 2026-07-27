import {
  deduplicateTransactionsAlertsAddresses,
  type TransactionsAlertsAddress,
} from "@ledgerhq/live-common/transactionsAlerts/index";
import type { ChainwatchNetwork } from "@ledgerhq/types-live";
import storage from "LLM/storage";

const transactionsAlertsStorageKey = "transactionsAlerts.synchronizedAddresses";

export type TransactionsAlertsTarget = {
  chainwatchBaseUrl: string;
  network: ChainwatchNetwork;
  addresses: string[];
};

export type TransactionsAlertsState = {
  targets: TransactionsAlertsTarget[];
  cleanupKey?: string;
};

const isTransactionsAlertsAddress = (value: unknown): value is TransactionsAlertsAddress =>
  typeof value === "object" &&
  value !== null &&
  "currencyId" in value &&
  typeof value.currencyId === "string" &&
  "address" in value &&
  typeof value.address === "string";

const isChainwatchNetwork = (value: unknown): value is ChainwatchNetwork =>
  typeof value === "object" &&
  value !== null &&
  "ledgerLiveId" in value &&
  typeof value.ledgerLiveId === "string" &&
  "chainwatchId" in value &&
  typeof value.chainwatchId === "string" &&
  "nbConfirmations" in value &&
  typeof value.nbConfirmations === "number";

const isTransactionsAlertsTarget = (value: unknown): value is TransactionsAlertsTarget =>
  typeof value === "object" &&
  value !== null &&
  "chainwatchBaseUrl" in value &&
  typeof value.chainwatchBaseUrl === "string" &&
  "network" in value &&
  isChainwatchNetwork(value.network) &&
  "addresses" in value &&
  Array.isArray(value.addresses) &&
  value.addresses.every(address => typeof address === "string");

const isTransactionsAlertsState = (value: unknown): value is TransactionsAlertsState =>
  typeof value === "object" &&
  value !== null &&
  "targets" in value &&
  Array.isArray(value.targets) &&
  value.targets.every(isTransactionsAlertsTarget) &&
  (!("cleanupKey" in value) ||
    value.cleanupKey === undefined ||
    typeof value.cleanupKey === "string");

export const getTransactionsAlertsTargetKey = ({
  chainwatchBaseUrl,
  network,
}: TransactionsAlertsTarget) =>
  JSON.stringify([chainwatchBaseUrl, network.ledgerLiveId, network.chainwatchId]);

const deduplicateTargetAddresses = (network: ChainwatchNetwork, addresses: string[]) =>
  deduplicateTransactionsAlertsAddresses(
    addresses.map(address => ({ currencyId: network.ledgerLiveId, address })),
  ).map(({ address }) => address);

export const mergeTransactionsAlertsTargets = (targets: TransactionsAlertsTarget[]) =>
  Array.from(
    targets
      .reduce((targetsByKey, target) => {
        const key = getTransactionsAlertsTargetKey(target);
        const previousTarget = targetsByKey.get(key);
        targetsByKey.set(key, {
          ...target,
          addresses: deduplicateTargetAddresses(target.network, [
            ...(previousTarget?.addresses ?? []),
            ...target.addresses,
          ]),
        });
        return targetsByKey;
      }, new Map<string, TransactionsAlertsTarget>())
      .values(),
  );

export const createTransactionsAlertsTargets = (
  chainwatchBaseUrl: string,
  networks: ChainwatchNetwork[],
  addresses: TransactionsAlertsAddress[],
) =>
  mergeTransactionsAlertsTargets(
    networks.map(network => ({
      chainwatchBaseUrl,
      network,
      addresses: addresses
        .filter(address => address.currencyId === network.ledgerLiveId)
        .map(({ address }) => address),
    })),
  );

export const getStoredTransactionsAlertsState = async (
  chainwatchBaseUrl: string | undefined,
  networks: ChainwatchNetwork[],
): Promise<TransactionsAlertsState> => {
  const state = await storage.get<unknown>(transactionsAlertsStorageKey);
  if (isTransactionsAlertsState(state)) {
    return { ...state, targets: mergeTransactionsAlertsTargets(state.targets) };
  }
  if (chainwatchBaseUrl && Array.isArray(state) && state.every(isTransactionsAlertsAddress)) {
    return {
      targets: createTransactionsAlertsTargets(chainwatchBaseUrl, networks, state),
    };
  }
  return { targets: [] };
};

export const storeTransactionsAlertsState = (state: TransactionsAlertsState) =>
  storage.save(transactionsAlertsStorageKey, {
    ...state,
    targets: mergeTransactionsAlertsTargets(state.targets),
  });

export const getStoredTransactionsAlertsAddresses = async () => {
  const state = await storage.get<unknown>(transactionsAlertsStorageKey);
  if (Array.isArray(state) && state.every(isTransactionsAlertsAddress)) {
    return deduplicateTransactionsAlertsAddresses(state);
  }
  if (!isTransactionsAlertsState(state)) return [];
  return deduplicateTransactionsAlertsAddresses(
    state.targets.flatMap(({ network, addresses }) =>
      addresses.map(address => ({ currencyId: network.ledgerLiveId, address })),
    ),
  );
};

export const storeTransactionsAlertsAddresses = (addresses: TransactionsAlertsAddress[]) =>
  storage.save(transactionsAlertsStorageKey, deduplicateTransactionsAlertsAddresses(addresses));

export const clearStoredTransactionsAlertsAddresses = () =>
  storage.delete(transactionsAlertsStorageKey);
