import { useCallback } from "react";
import { ipcRenderer } from "electron";
import { getEnv } from "@shared/env";
import { useDBRaw } from "@ledgerhq/live-common/hooks/useDBRaw";
import { DiscoverDB } from "@ledgerhq/live-common/wallet-api/types";
import accountModel from "~/helpers/accountModel";
import { ENCRYPTED_APP_KEYS, type EncryptedAppKey } from "~/config/encryptedAppKeys";
import memoize from "lodash/memoize";
import debounce from "lodash/debounce";

import { Account, AccountRaw, AccountUserData } from "@ledgerhq/types-live";
import { DataModel } from "@ledgerhq/live-common/DataModel";
import { CounterValuesStatus, RateMapRaw } from "@ledgerhq/live-countervalues/types";
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
import type { FeatureFlagsState } from "@shared/feature-flags";
import type { RestorableLargeScreenUpsellModalState } from "@features/flow-large-screen-upsell";
import type { PayCardBalanceState } from "@features/flow-pay-balance/state";
import type { PayCardFeatureTourState } from "@features/flow-pay-feature-tour/state";

/** Persisted pay card blob: the tour flag and the balance filter, stored under one key. */
type PayCardPersistedState = PayCardFeatureTourState & PayCardBalanceState;

/*
  This file serve as an interface for the RPC binding to the main thread that now manage the config file.
  Because only serialized json can be sent between processes, the transform system now live here.
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
export type PayCard = PayCardPersistedState;

export type TrustchainStore = ReturnType<typeof trustchainStoreSelector>;

// The types seen from the user side.
type DatabaseValues = {
  accounts: Account[];
  user: User;
  countervalues: Countervalues;
  postOnboarding: PostOnboarding;
  settings: Settings;
  trustchain: TrustchainStore;
  wallet: ExportedWalletState;
  market: Market;
  marketBanner: MarketBanner;
  knownDevices: KnownDevices;
  cryptoAssets: PersistedCAL;
  featureFlags: Pick<FeatureFlagsState, "overrides" | "bannerVisible">;
  coinConfigOverrides: { overrides: Record<string, unknown> };
  identities: PersistedIdentities;
  history: { lastSeenOperationDate: string | null };
  PLAYWRIGHT_RUN: {
    localStorage?: Record<string, string>;
  };
  discover: DiscoverDB;
  ptx: {
    lastScreen: string;
  };
  largeScreenUpsellModal: RestorableLargeScreenUpsellModalState;
  payCard: PayCard;
};

const encryptedAppKeySet: ReadonlySet<keyof DatabaseValues> = new Set(ENCRYPTED_APP_KEYS);

// Infers the type seen from the user side (non-raw).
type DatabaseValue<K extends keyof DatabaseValues> = DatabaseValueMap[K];
type DatabaseValueMap = {
  [K in keyof DatabaseValues]: K extends keyof Transforms
    ? Awaited<ReturnType<Transforms[K]["get"]>>
    : DatabaseValues[K];
};

type DatabaseReadValue<K extends keyof DatabaseValues> = K extends EncryptedAppKey
  ? ProtectedValue<DatabaseValue<K>>
  : DatabaseValue<K> | null | undefined;
type AnyDatabaseReadValue =
  | ProtectedValue<DatabaseValue<EncryptedAppKey>>
  | DatabaseValue<UnprotectedAppKey>
  | null
  | undefined;
type ProtectedValue<T> = { status: "encrypted" } | { status: "available"; data: T | null };
type UnprotectedAppKey = Exclude<keyof DatabaseValues, EncryptedAppKey>;

// A Transformer is a pair of functions to encode/decode the raw data.
type Transform<R, M> = {
  get: (
    raws: Parameters<DataModel<R, M>["decode"]>[0][],
  ) => Promise<Awaited<ReturnType<DataModel<R, M>["decode"]>>[]>;
  set: (
    raws: Parameters<DataModel<R, M>["encode"]>[0][],
  ) => Promise<Awaited<ReturnType<DataModel<R, M>["encode"]>>[]>;
};

// A map of transformers.
type Transforms = {
  accounts: Transform<AccountRaw, [Account, AccountUserData]>;
};

const transforms: Transforms = {
  accounts: {
    get: async raws => {
      const accounts: Array<[Account, AccountUserData]> = [];
      if (raws) {
        for (const raw of raws) {
          try {
            accounts.push(await accountModel.decode(raw));
          } catch (e) {
            logger.critical(e);
          }
        }
      }
      return accounts;
    },
    set: async accounts =>
      Promise.all((accounts || []).map(account => accountModel.encode(account))),
  },
};

export function getKey<K extends keyof DatabaseValues>(
  ns: "app",
  keyPath: K,
  defaultValue?: DatabaseValue<K>,
): Promise<DatabaseReadValue<K>>;
export async function getKey(
  ns: "app",
  keyPath: keyof DatabaseValues,
  defaultValue?: DatabaseValue<keyof DatabaseValues>,
): Promise<AnyDatabaseReadValue> {
  return isProtectedAppKey(keyPath)
    ? getEncryptedKey(ns, keyPath, defaultValue as DatabaseValue<typeof keyPath>)
    : getUnprotectedKey(ns, keyPath, defaultValue as DatabaseValue<typeof keyPath>);
}

async function getEncryptedKey<K extends EncryptedAppKey>(
  ns: "app",
  keyPath: K,
  defaultValue?: DatabaseValue<K>,
): Promise<ProtectedValue<DatabaseValue<K>>> {
  const data = await getKeyIpc(ns, keyPath);

  if (typeof data === "string") return { status: "encrypted" };
  if (data === undefined) return { status: "available", data: defaultValue ?? null };
  if (data === null) return { status: "available", data: null };

  return {
    status: "available",
    // WARNING: These type casts are not guaranteed the storage could contain an unexpected value
    data: hasOwn(transforms, keyPath)
      ? await getTransformedKey(keyPath, data as RawDatabaseValue<typeof keyPath>)
      : (data as DatabaseValue<K>),
  };
}

async function getUnprotectedKey<K extends UnprotectedAppKey>(
  ns: "app",
  keyPath: K,
  defaultValue?: DatabaseValue<K>,
): Promise<DatabaseValue<K> | null | undefined> {
  const data = await getKeyIpc(ns, keyPath, defaultValue);

  if (typeof data === "undefined" || data === null) return data;

  // WARNING: These type casts are not guaranteed the storage could contain an unexpected value
  return hasOwn(transforms, keyPath)
    ? await getTransformedKey(keyPath, data as RawDatabaseValue<typeof keyPath>)
    : (data as DatabaseValue<K>);
}

function getKeyIpc<K extends keyof DatabaseValues>(
  ns: "app",
  keyPath: K,
  defaultValue?: DatabaseValue<K>,
): Promise<unknown> {
  return ipcRenderer.invoke("getKey", {
    ns,
    keyPath,
    defaultValue,
  });
}

type RawDatabaseValue<K extends keyof DatabaseValues> = K extends keyof Transforms
  ? Parameters<Transforms[K]["get"]>[0]
  : DatabaseValue<K>;
function getTransformedKey<K extends keyof Transforms>(
  keyPath: K,
  value: RawDatabaseValue<K>,
): Promise<DatabaseValue<K>> {
  return transforms[keyPath].get(value);
}

function hasOwn<T extends object>(object: T, key: PropertyKey): key is keyof T {
  return Object.hasOwn(object, key);
}

function isProtectedAppKey<K extends keyof DatabaseValues>(
  keyPath: K,
): keyPath is Extract<K, EncryptedAppKey> {
  return encryptedAppKeySet.has(keyPath);
}

let debounceToUse = debounce;
if (getEnv("PLAYWRIGHT_RUN")) {
  debounceToUse =
    fn =>
    (...args) =>
      // @ts-expect-error This is specific to playwright, silence the error
      setTimeout(() => fn(...args));
}

const debouncedSetKey = memoize(
  <K extends keyof DatabaseValues>(ns: "app", keyPath: K) =>
    debounceToUse(async (value: DatabaseValue<K>) => {
      try {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const transform = transforms[keyPath as keyof Transforms];
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const transformedValue = transform
          ? await transform.set(value as Parameters<typeof transform.set>[0])
          : value;
        await ipcRenderer.invoke("setKey", {
          ns,
          keyPath,
          value: transformedValue,
        });
      } catch (e) {
        logger.error("debouncedSetKey failed", { ns, keyPath }, e);
      }
    }, 1000),
  (ns: "app", keyPath: string) => `${ns}:${keyPath}`,
);

export const setKey = <K extends keyof DatabaseValues>(
  ns: "app",
  keyPath: K,
  value: DatabaseValue<K>,
) => {
  debouncedSetKey<K>(ns, keyPath)(value);
};

export const hasEncryptionKey = (ns: "app", keyPath: EncryptedAppKey) =>
  ipcRenderer.invoke("hasEncryptionKey", {
    ns,
    keyPath,
  });

export const setEncryptionKey = (encryptionKey: string) =>
  ipcRenderer.invoke("setEncryptionKey", { encryptionKey });

export const removeEncryptionKey = () => ipcRenderer.invoke("removeEncryptionKey", {});

export const isEncryptionKeyCorrect = (encryptionKey: string) =>
  ipcRenderer.invoke("isEncryptionKeyCorrect", { encryptionKey });

export const hasBeenDecrypted = () => ipcRenderer.invoke("hasBeenDecrypted", {});

export const resetAll = () => ipcRenderer.invoke("resetAll");

export const reload = () => ipcRenderer.invoke("reload");

export const cleanCache = () => ipcRenderer.invoke("cleanCache");

function identitySelector<V>(state: V): V {
  return state;
}

export function useDB<Selected, K extends UnprotectedAppKey>(
  ns: "app",
  keyPath: K,
  initialState: DatabaseValue<K>,
  // @ts-expect-error State !== Selected
  selector: (state: DatabaseValue<K>) => Selected = identitySelector,
) {
  return useDBRaw<DatabaseValue<K>, Selected>({
    initialState,
    getter: useCallback(
      async () => (await getUnprotectedKey(ns, keyPath, initialState)) ?? undefined,
      [ns, keyPath, initialState],
    ),
    setter: useCallback(state => setKey(ns, keyPath, state), [ns, keyPath]),
    selector,
  });
}
