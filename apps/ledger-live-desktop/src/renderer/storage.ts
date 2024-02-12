import { ipcRenderer } from "electron";
import { getEnv } from "@ledgerhq/live-env";
import { useDBRaw } from "@ledgerhq/live-common/hooks/useDBRaw";
import { DiscoverDB } from "@ledgerhq/live-common/wallet-api/types";
import accountModel from "~/helpers/accountModel";
import memoize from "lodash/memoize";
import debounce from "lodash/debounce";
import { setEnvOnAllThreads } from "~/helpers/env";

// TODO move to bitcoin family
// eslint-disable-next-line no-restricted-imports
import {
  editSatStackConfig,
  stringifySatStackConfig,
  parseSatStackConfig,
  SatStackConfig,
} from "@ledgerhq/live-common/families/bitcoin/satstack";
import { Account, AccountRaw } from "@ledgerhq/types-live";
import { DataModel } from "@ledgerhq/live-common/DataModel";
import { Announcement } from "@ledgerhq/live-common/notifications/AnnouncementProvider/types";
import { CounterValuesStatus, RateMapRaw } from "@ledgerhq/live-countervalues/types";
import { hubStateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { settingsExportSelector } from "./reducers/settings";
import logger from "./logger";

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

export type Settings = ReturnType<typeof settingsExportSelector>;

// The types seen from the user side.
type DatabaseValues = {
  accounts: Account[];
  user: User;
  announcements: {
    announcements: Announcement[];
    seenIds: string[];
    lastUpdateTime: number;
  };
  countervalues: Countervalues;
  postOnboarding: PostOnboarding;
  settings: Settings;
  PLAYWRIGHT_RUN: {
    localStorage?: Record<string, string>;
  };
  discover: DiscoverDB;
  ptx: {
    lastScreen: string;
  };
};

// Infers the type seen from the user side (non-raw).
type DatabaseValue<
  K extends keyof DatabaseValues,
  T = K extends keyof Transforms ? Transforms[K] : unknown,
  // This is needed to make the type inference work here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  V = T extends Transform<any, any> ? ReturnType<T["get"]> : DatabaseValues[K],
> = V;

// A Transformer is a pair of functions to encode/decode the raw data.
type Transform<R, M> = {
  get: (
    raws: Parameters<DataModel<R, M>["decode"]>[0][],
  ) => ReturnType<DataModel<R, M>["decode"]>[] | null;
  set: (
    raws: Parameters<DataModel<R, M>["encode"]>[0][],
  ) => ReturnType<DataModel<R, M>["encode"]>[];
};

// A map of transformers.
type Transforms = {
  accounts: Transform<AccountRaw, Account>;
};

const transforms: Transforms = {
  accounts: {
    get: raws => {
      // NB to prevent parsing encrypted string as JSON
      if (typeof raws === "string") return null;
      const accounts = [];
      if (raws) {
        for (const row of raws) {
          try {
            accounts.push(accountModel.decode(row));
          } catch (e) {
            logger.critical(e);
          }
        }
      }
      return accounts;
    },
    set: accounts => (accounts || []).map(accountModel.encode),
  },
};

export const getKey = async <
  K extends keyof DatabaseValues,
  V = DatabaseValue<K>,
  DV extends V = V,
>(
  ns: string,
  keyPath: K,
  defaultValue?: DV,
): Promise<V> => {
  let data = await ipcRenderer.invoke("getKey", {
    ns,
    keyPath,
    defaultValue,
  });
  const transform = transforms[keyPath as keyof Transforms];
  if (transform) {
    data = transform.get(data);
  }
  return data;
};

let debounceToUse = debounce;
if (getEnv("PLAYWRIGHT_RUN")) {
  debounceToUse =
    fn =>
    (...args) =>
      // @ts-expect-error This is specific to playwright, silence the error
      setTimeout(() => fn(...args));
}

const debouncedSetKey = memoize(
  <K extends keyof DatabaseValues, V = DatabaseValue<K>>(ns: string, keyPath: K) =>
    debounceToUse((value: V) => {
      const transform = transforms[keyPath as keyof Transforms];
      ipcRenderer.invoke("setKey", {
        ns,
        keyPath,
        value: transform ? transform.set(value as Parameters<typeof transform.set>[0]) : value,
      });
    }, 1000),
  (ns: string, keyPath: string) => `${ns}:${keyPath}`,
);

export const setKey = <K extends keyof DatabaseValues, V = DatabaseValue<K>, Val extends V = V>(
  ns: string,
  keyPath: K,
  value: Val,
) => {
  debouncedSetKey<K, V>(ns, keyPath)(value);
};

export const hasEncryptionKey = (ns: string, keyPath: keyof DatabaseValues) =>
  ipcRenderer.invoke("hasEncryptionKey", {
    ns,
    keyPath,
  });

export const setEncryptionKey = (
  ns: string,
  keyPath: keyof DatabaseValues,
  encryptionKey: string,
) =>
  ipcRenderer.invoke("setEncryptionKey", {
    ns,
    keyPath,
    encryptionKey,
  });

export const removeEncryptionKey = (ns: string, keyPath: keyof DatabaseValues) =>
  ipcRenderer.invoke("removeEncryptionKey", {
    ns,
    keyPath,
  });

export const isEncryptionKeyCorrect = (
  ns: string,
  keyPath: keyof DatabaseValues,
  encryptionKey: string,
) =>
  ipcRenderer.invoke("isEncryptionKeyCorrect", {
    ns,
    keyPath,
    encryptionKey,
  });

export const hasBeenDecrypted = (ns: string, keyPath: keyof DatabaseValues) =>
  ipcRenderer.invoke("hasBeenDecrypted", {
    ns,
    keyPath,
  });

export const resetAll = () => ipcRenderer.invoke("resetAll");

export const reload = () => ipcRenderer.invoke("reload");

export const cleanCache = () => ipcRenderer.invoke("cleanCache");

export const clearStorageData = () => ipcRenderer.invoke("clearStorageData");

export const saveLSS = async (lssConfig: SatStackConfig) => {
  const configStub = {
    node: {
      host: "",
      username: "",
      password: "",
    },
    accounts: [],
  };
  const maybeExistingConfig = (await loadLSS()) || configStub;
  const updated = editSatStackConfig(maybeExistingConfig, lssConfig);
  await ipcRenderer.invoke("generate-lss-config", stringifySatStackConfig(updated));
  setEnvOnAllThreads("SATSTACK", true);
};

export const removeLSS = async () => {
  await ipcRenderer.invoke("delete-lss-config");
  setEnvOnAllThreads("SATSTACK", false);
};

export const loadLSS = async (): Promise<SatStackConfig | undefined | null> => {
  try {
    const satStackConfigRaw = await ipcRenderer.invoke("load-lss-config");
    const config = parseSatStackConfig(satStackConfigRaw);
    setEnvOnAllThreads("SATSTACK", true);
    return config;
  } catch (e) {
    // For instance file no longer exists
    setEnvOnAllThreads("SATSTACK", false);
  }
};

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
  selector: (state: V) => Selected = state => state,
) {
  return useDBRaw<V, Selected>({
    initialState,
    getter: () => getKey(ns, keyPath, initialState),
    // @ts-expect-error Todo: state doesn't fit
    setter: state => setKey(ns, keyPath, state),
    selector,
  });
}
