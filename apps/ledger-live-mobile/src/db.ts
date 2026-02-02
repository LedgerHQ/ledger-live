import { log } from "@ledgerhq/logs";
import { atomicQueue } from "@ledgerhq/live-common/promise";
import type { Account, AccountRaw, PostOnboardingState } from "@ledgerhq/types-live";
import type {
  CounterValuesStateRaw,
  RateMapRaw,
  CounterValuesStatus,
} from "@ledgerhq/live-countervalues/types";
import { useDBRaw } from "@ledgerhq/live-common/hooks/useDBRaw";
import { Dispatch, SetStateAction } from "react";
import storage from "LLM/storage";
import type { User } from "./types/store";
import type {
  BleState,
  LargeMoverState,
  MarketState,
  ProtectState,
  SettingsState,
} from "./reducers/types";
import { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { ExportedWalletState } from "@ledgerhq/live-wallet/store";
import { type PersistedCAL } from "@ledgerhq/cryptoassets/cal-client/persistence";
import { PersistedIdentities } from "@ledgerhq/client-ids/store";

const ACCOUNTS_KEY = "accounts";
const ACCOUNTS_KEY_SORT = "accounts.sort";
const ACCOUNTS_DB_PREFIX = "accounts.active.";
const COUNTERVALUES_DB_PREFIX = "countervalues.";
export async function clearDb() {
  const list = await storage.keys();
  await storage.delete(list.filter(k => k !== "user"));
}
export async function getUser(): Promise<User> {
  const user = (await storage.get("user")) as User;
  return user;
}
export async function setUser(user: User): Promise<void> {
  await storage.update("user", user);
}
export async function updateUser(user: User): Promise<void> {
  await storage.update("user", user);
}
export async function getSettings(): Promise<Partial<SettingsState>> {
  const settings = (await storage.get("settings")) as Partial<SettingsState>;
  return settings;
}
export async function saveSettings(obj: Partial<SettingsState>): Promise<void> {
  await storage.save("settings", obj);
}

export const getCountervalues: typeof unsafeGetCountervalues = atomicQueue(unsafeGetCountervalues);
export const saveCountervalues: typeof unsafeSaveCountervalues =
  atomicQueue(unsafeSaveCountervalues);
export async function unsafeGetCountervalues(): Promise<CounterValuesStateRaw> {
  const keys = await getKeys(COUNTERVALUES_DB_PREFIX);

  if (!keys.length) {
    return {
      status: {},
    };
  }

  return ((await storage.get(keys)) as CounterValuesStateRaw[]).reduce(
    (prev: CounterValuesStateRaw, val: RateMapRaw | CounterValuesStatus, i: number) =>
      ({
        ...prev,
        [keys[i].split(COUNTERVALUES_DB_PREFIX)[1]]: val,
      }) as CounterValuesStateRaw,
    {} as CounterValuesStateRaw,
  );
}

async function getKeys(prefix: string) {
  return (await storage.keys()).filter(k => k.indexOf(prefix) === 0);
}

async function unsafeSaveCountervalues(state: CounterValuesStateRaw): Promise<void> {
  const data = Object.entries(state).map<[string, RateMapRaw | CounterValuesStatus]>(
    ([key, val]) => [`${COUNTERVALUES_DB_PREFIX}${key}`, val],
  );
  const dataKeys = new Set(data.map(([k]) => k));
  const deletedKeys = (await getKeys(COUNTERVALUES_DB_PREFIX)).filter(k => !dataKeys.has(k));
  await storage.save(data);

  if (deletedKeys.length) {
    await storage.delete(deletedKeys);
  }
}

export async function getBle(): Promise<BleState> {
  const ble = (await storage.get("ble")) as BleState;
  return ble;
}
export async function saveBle(obj: BleState): Promise<void> {
  await storage.save("ble", obj);
}

const formatAccountDBKey = (id: string): string => `${ACCOUNTS_DB_PREFIX}${id}`;

/** get Db accounts keys */
function onlyAccountsKeys(keys: string[]): Array<string> {
  return keys.filter(key => key.indexOf(ACCOUNTS_DB_PREFIX) === 0);
}

// get accounts specific method to aggregate all account keys into the correct format
async function unsafeGetAccounts(): Promise<{
  active: { data: AccountRaw }[];
}> {
  await migrateAccountsIfNecessary();
  const keys = await storage.keys();
  const accountKeys = onlyAccountsKeys(keys);

  // if some account keys, we retrieve them and return (order from storage)
  if (accountKeys && accountKeys.length > 0) {
    const active = (await storage.get(accountKeys)) as { data: AccountRaw }[];
    return {
      active,
    };
  }

  // fallback to empty state
  return {
    active: [],
  };
}

/** save accounts method between SQLite db and redux store persist */
async function unsafeSaveAccounts(
  {
    active: newAccounts,
  }: {
    active: { data: AccountRaw }[];
  },
  stats?:
    | {
        changed: string[];
      }
    | null
    | undefined,
): Promise<void> {
  log("db", "saving accounts...");
  const keys = await storage.keys();
  const currentAccountKeys = onlyAccountsKeys(keys);

  /** format data for DB persist */
  const dbData: [string, { data: AccountRaw; version: number }][] = newAccounts.map(({ data }) => [
    formatAccountDBKey(data.id),
    {
      data,
      // FIXME: IS THIS VERSION THE MIGRATION VERSION ?
      version: 1,
    },
  ]);

  const newAccountKeysSet = new Set(dbData.map(([k]) => k));
  /** Find current DB accounts keys diff with app state to remove them */
  const deletedKeys =
    currentAccountKeys.length > 0
      ? currentAccountKeys.filter(key => !newAccountKeysSet.has(key))
      : [];

  // we only save those who effectively changed
  const changedIdsSet = stats ? new Set(stats.changed) : null;
  const dbDataWithOnlyChanges: Array<[string, unknown]> = !changedIdsSet
    ? dbData
    : dbData.filter(([_key, { data }]) => changedIdsSet.has(data.id));
  const toSave = [...dbDataWithOnlyChanges];

  // only persist sort when we're already saving account data or deletions
  if (dbDataWithOnlyChanges.length > 0 || deletedKeys.length > 0) {
    toSave.push([ACCOUNTS_KEY_SORT, newAccounts.map(a => a.data.id)]);
  }

  /** persist store data to DB */
  if (toSave.length > 0) {
    await storage.save(toSave);
  }

  /** then delete potential removed keys */
  if (deletedKeys.length > 0) {
    await storage.delete(deletedKeys);
  }

  log(
    "db",
    "saved " +
      dbDataWithOnlyChanges.length +
      " accounts" +
      (deletedKeys.length ? " and deleted " + deletedKeys.length : ""),
  );
}

export const getAccounts: typeof unsafeGetAccounts = atomicQueue(unsafeGetAccounts);
export const saveAccounts: typeof unsafeSaveAccounts = atomicQueue(unsafeSaveAccounts);

async function migrateAccountsIfNecessary(): Promise<void> {
  const keys = await storage.keys();

  /** check if old data is present */
  const hasOldAccounts = keys.includes(ACCOUNTS_KEY);

  if (hasOldAccounts) {
    log("db", "should migrateAccountsIfNecessary");
    let oldAccounts: {
      active: { data: Account }[];
    } | null = null;

    try {
      /** fetch old accounts db data */
      oldAccounts = (await storage.get(ACCOUNTS_KEY)) as {
        active: { data: Account }[];
      };
    } catch (e) {
      /** catch possible "Row too big to fit into CursorWindow" */
      console.error(e);
    }

    /** format old data to be saved on an account based key */
    const accountsData: { data: Account }[] = (oldAccounts && oldAccounts.active) || [];
    const newDBData: [string, { data: Account; version: number }][] = accountsData.map(
      ({ data }) => [
        formatAccountDBKey(data.id),
        {
          data,
          version: 1,
        },
      ],
    );

    /** save new formatted data then remove old data from DB */
    await storage.save(newDBData);
    await storage.delete(ACCOUNTS_KEY);
    log("db", "done migrateAccountsIfNecessary");
  }
}

export function getPostOnboardingState(): Promise<PostOnboardingState> {
  return storage.get("postOnboarding") as Promise<PostOnboardingState>;
}

export async function savePostOnboardingState(obj: PostOnboardingState): Promise<void> {
  await storage.save("postOnboarding", obj);
}

export function getMarketState(): Promise<MarketState> {
  return storage.get("market") as Promise<MarketState>;
}

export async function saveMarketState(obj: MarketState): Promise<void> {
  await storage.save("market", obj);
}

export function getTrustchainState(): Promise<TrustchainStore> {
  return storage.get("trustchain") as Promise<TrustchainStore>;
}

export async function saveTrustchainState(obj: TrustchainStore): Promise<void> {
  await storage.save("trustchain", obj);
}

export async function getWalletExportState(): Promise<ExportedWalletState> {
  const wallet = (await storage.get("wallet")) as ExportedWalletState;
  return wallet;
}

export async function saveWalletExportState(obj: ExportedWalletState): Promise<void> {
  await storage.save("wallet", obj);
}

export async function getProtect(): Promise<ProtectState> {
  const protect = (await storage.get("protect")) as ProtectState;
  return protect;
}

export function useDB<State, Selected>(
  key: string,
  initialState: State,
  // @ts-expect-error State !== Selected
  selector: (state: State) => Selected = state => state,
): [Selected, Dispatch<SetStateAction<State>>] {
  return useDBRaw<State, Selected>({
    initialState,
    getter: () => storage.get(key) as Promise<State>,
    setter: (state: State) => storage.save(key, state),
    selector,
  });
}

export function getLargeMoverState(): Promise<LargeMoverState> {
  return storage.get("largeMover") as Promise<LargeMoverState>;
}
export async function saveLargeMoverState(state: LargeMoverState): Promise<void> {
  await storage.save("largeMover", state);
}

export function getCryptoAssetsCacheState(): Promise<PersistedCAL | null> {
  return storage.get("cryptoAssetsCache") as Promise<PersistedCAL | null>;
}
export async function saveCryptoAssetsCacheState(persistedData: PersistedCAL): Promise<void> {
  if (persistedData.tokens.length > 0) {
    await storage.save("cryptoAssetsCache", persistedData);
  }
}

export function getIdentities(): Promise<PersistedIdentities | null> {
  return storage.get("identities") as Promise<PersistedIdentities | null>;
}
export async function saveIdentities(persistedData: PersistedIdentities): Promise<void> {
  await storage.save("identities", persistedData);
}
