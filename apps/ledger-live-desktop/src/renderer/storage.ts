import { useCallback } from "react";
import { db } from "~/renderer/bridge";
import type { Serializable } from "~/bridge/contract";
import { getEnv } from "@shared/env";
import type { ConfigSelectionId } from "@shared/app-config";
import { useDBRaw } from "@ledgerhq/live-common/hooks/useDBRaw";
import { DiscoverDB } from "@ledgerhq/live-common/wallet-api/types";
import { flushInRounds } from "~/helpers/flushInRounds";
import debounce from "lodash/debounce";

import { CounterValuesStatus, RateMapRaw } from "@domain/entity-market-countervalues";
import { hubStateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { settingsStoreSelector } from "./reducers/settings";
import logger from "./logger";
import { trustchainStoreSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { marketStoreSelector } from "./reducers/market";
import { marketBannerStoreSelector } from "./reducers/marketBanner";
import { knownDevicesStoreSelector } from "./reducers/knownDevices";
import { ExportedWalletState } from "~/renderer/reducers/wallet";
import type { PersistedCAL } from "@domain/api-currency-token";
import type { PersistedIdentities } from "@domain/entity-client-identity";
import type { PredictionsState } from "@domain/entity-predictions";
import type { FeatureFlagsState } from "@shared/feature-flags";
import type { RestorableLargeScreenUpsellModalState } from "@features/flow-large-screen-upsell";
import type { PayCardBalanceState } from "@features/flow-pay-balance/state";
import type { AccountAnalyticsIntroductionState } from "@features/flow-account-detail-analytics-notice/state";
import type { PayCardFeatureTourState } from "@features/flow-pay-feature-tour/state";
import type { ReceiveVerifyHintState } from "@features/flow-receive/state";
import type { PayCardLoginIntroState } from "@features/flow-pay-card-auth/state";
import type { PayCardOnboardingWidgetPersistedState } from "@features/flow-pay-card-widget/state";

/*
  This file serve as an interface for the RPC binding to the main thread that now manage the config file.
 */

export type User = {
  id: string;
};

export type Countervalues = Record<string, CounterValuesStatus | RateMapRaw> & {
  status: CounterValuesStatus;
};

export type PostOnboarding = ReturnType<typeof hubStateSelector>;

export type Settings = ReturnType<typeof settingsStoreSelector>;
export type Market = ReturnType<typeof marketStoreSelector>;
export type MarketBanner = ReturnType<typeof marketBannerStoreSelector>;
export type KnownDevices = ReturnType<typeof knownDevicesStoreSelector>;
export type PayCard = PayCardFeatureTourState &
  PayCardBalanceState &
  PayCardLoginIntroState &
  PayCardOnboardingWidgetPersistedState;

export type TrustchainStore = ReturnType<typeof trustchainStoreSelector>;

// The types seen from the user side. Persistence owns `accounts` and `history` (src/persistence/).
type DatabaseValues = {
  user: User;
  countervalues: Countervalues;
  postOnboarding: PostOnboarding;
  settings: Settings;
  trustchain: TrustchainStore;
  wallet: ExportedWalletState;
  market: Market;
  marketBanner: MarketBanner;
  predictions: PredictionsState;
  knownDevices: KnownDevices;
  cryptoAssets: PersistedCAL;
  featureFlags: Pick<FeatureFlagsState, "overrides" | "bannerVisible">;
  coinConfigOverrides: { overrides: Record<string, unknown> };
  identities: PersistedIdentities;
  PLAYWRIGHT_RUN: {
    localStorage?: Record<string, string>;
    appConfig?: Record<string, ConfigSelectionId>;
    appConfigDevValues?: Record<string, string>;
  };
  discover: DiscoverDB;
  ptx: {
    lastScreen: string;
  };
  largeScreenUpsellModal: RestorableLargeScreenUpsellModalState;
  payCard: PayCard;
  receiveVerifyHint: ReceiveVerifyHintState;
  accountAnalyticsIntroduction: AccountAnalyticsIntroductionState;
};

type DatabaseValue<K extends keyof DatabaseValues> = DatabaseValues[K];

export const getKey = async <
  K extends keyof DatabaseValues,
  V = DatabaseValue<K>,
  DV extends V = V,
>(
  ns: string,
  keyPath: K,
  defaultValue?: DV,
): Promise<V> => {
  const data: unknown = await db.getKey(ns, keyPath, defaultValue);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return data as V;
};

/** Playwright runs write at once; persistence uses the same delay for its records. */
export const SET_KEY_DEBOUNCE_MS = getEnv("PLAYWRIGHT_RUN") ? 0 : 1000;

type DebouncedSetKey = ReturnType<typeof debounce<(value: unknown) => Promise<void>>>;

const debouncedSetKeys = new Map<string, DebouncedSetKey>();

/** A reset increments it: the writes queued before the reset do not reach main. */
let writeGeneration = 0;

const debouncedSinceLastFlush = new Set<DebouncedSetKey>();

function getDebouncedSetKey(ns: string, keyPath: keyof DatabaseValues): DebouncedSetKey {
  const id = `${ns}:${keyPath}`;
  const existing = debouncedSetKeys.get(id);
  if (existing) return existing;

  const write = async (value: unknown, generation: number) => {
    try {
      const resetSinceQueued = generation !== writeGeneration;
      if (resetSinceQueued) return;
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      await db.setKey(ns, keyPath, value as Serializable);
    } catch (e) {
      logger.error("debouncedSetKey failed", { ns, keyPath }, e);
    }
  };
  // An older value must not reach main after a newer one.
  let lastWrite: Promise<void> = Promise.resolve();
  const debouncedSetKey = debounce((value: unknown) => {
    const generation = writeGeneration;
    lastWrite = lastWrite.then(() => write(value, generation));
    return lastWrite;
  }, SET_KEY_DEBOUNCE_MS);
  debouncedSetKeys.set(id, debouncedSetKey);
  return debouncedSetKey;
}

export const setKey = <K extends keyof DatabaseValues, V = DatabaseValue<K>, Val extends V = V>(
  ns: string,
  keyPath: K,
  value: Val,
) => {
  const debouncedSetKey = getDebouncedSetKey(ns, keyPath);
  debouncedSinceLastFlush.add(debouncedSetKey);
  debouncedSetKey(value);
};

let lastFlush: Promise<void> = Promise.resolve();

/**
 * Send the debounced `setKey` calls to main now, and wait until main has them.
 * A flush starts when the previous one ends, so it also waits for the writes of that flush.
 */
export const flushPendingWrites = (): Promise<void> => {
  const flush = lastFlush.then(() => flushInRounds(flushDebouncedSetKeys));
  lastFlush = flush.catch(() => undefined);
  return flush;
};

async function flushDebouncedSetKeys(): Promise<boolean> {
  const toFlush = Array.from(debouncedSinceLastFlush);
  debouncedSinceLastFlush.clear();
  await Promise.all(toFlush.map(debouncedSetKey => debouncedSetKey.flush()));
  return debouncedSinceLastFlush.size > 0;
}

export const setEncryptionKey = (encryptionKey: string, currentEncryptionKey?: string) =>
  db.setEncryptionKey(encryptionKey, currentEncryptionKey);

export const removeEncryptionKey = (currentEncryptionKey?: string) =>
  db.removeEncryptionKey(currentEncryptionKey);

export const isEncryptionKeyCorrect = (encryptionKey: string) =>
  db.isEncryptionKeyCorrect(encryptionKey);

export const hasBeenDecrypted = () => db.hasBeenDecrypted();

export const resetAll = () => {
  writeGeneration++;
  debouncedSetKeys.forEach(debouncedSetKey => debouncedSetKey.cancel());
  debouncedSinceLastFlush.clear();
  return db.resetAll();
};

export const reload = () => db.reload();

export const cleanCache = () => db.cleanCache();

function identitySelector<V>(state: V): V {
  return state;
}

export function useDB<
  Selected,
  K extends keyof DatabaseValues,
  V = DatabaseValue<K>,
  DV extends V = V,
>(
  ns: string,
  keyPath: K,
  initialState: DV,
  // @ts-expect-error State !== Selected
  selector: (state: V) => Selected = identitySelector,
) {
  return useDBRaw<V, Selected>({
    initialState,
    getter: useCallback(() => getKey(ns, keyPath, initialState), [ns, keyPath, initialState]),
    // @ts-expect-error Todo: state doesn't fit
    setter: useCallback(state => setKey(ns, keyPath, state), [ns, keyPath]),
    selector,
  });
}
