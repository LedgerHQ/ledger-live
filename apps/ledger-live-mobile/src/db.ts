import { log } from "@ledgerhq/logs";
import { atomicQueue } from "@ledgerhq/live-common/promise";
import type { Account, AccountRaw, PostOnboardingState } from "@ledgerhq/types-live";
import type {
  CounterValuesStateRaw,
  RateMapRaw,
  CounterValuesStatus,
} from "@ledgerhq/live-countervalues/types";
import { Announcement } from "@ledgerhq/live-common/notifications/AnnouncementProvider/types";
import { useDBRaw } from "@ledgerhq/live-common/hooks/useDBRaw";
import { Dispatch, SetStateAction } from "react";
import store from "./logic/storeWrapper";
import type { User } from "./types/store";
import type { BleState, ProtectState, SettingsState } from "./reducers/types";

export type Notifications = {
  announcements: Announcement[];
  seenIds: string[];
  lastUpdateTime: number;
  initDate?: number;
};

const ACCOUNTS_KEY = "accounts";
const ACCOUNTS_KEY_SORT = "accounts.sort";
const ACCOUNTS_DB_PREFIX = "accounts.active.";
const COUNTERVALUES_DB_PREFIX = "countervalues.";
export async function clearDb() {
  const list = await store.keys();
  await store.delete(list.filter(k => k !== "user"));
}
export async function getUser(): Promise<User> {
  const user = (await store.get("user")) as User;
  return user;
}
export async function setUser(user: User): Promise<void> {
  await store.update("user", user);
}
export async function updateUser(user: User): Promise<void> {
  await store.update("user", user);
}
export async function getSettings(): Promise<Partial<SettingsState>> {
  const settings = (await store.get("settings")) as Partial<SettingsState>;
  return settings;
}
export async function saveSettings(obj: Partial<SettingsState>): Promise<void> {
  await store.save("settings", obj);
}
export async function getWCSession(): Promise<unknown> {
  const wcsession = await store.get("wcsession");
  return wcsession;
}
export async function saveWCSession(obj: unknown): Promise<void> {
  await store.save("wcsession", obj);
}
export async function getNotifications(): Promise<Notifications> {
  const notifications = (await store.get("notifications")) as Notifications;
  return notifications;
}
export async function saveNotifications(obj: Notifications): Promise<void> {
  await store.save("notifications", obj);
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

  return ((await store.get(keys)) as CounterValuesStateRaw[]).reduce(
    (prev: CounterValuesStateRaw, val: RateMapRaw | CounterValuesStatus, i: number) =>
      ({
        ...prev,
        [keys[i].split(COUNTERVALUES_DB_PREFIX)[1]]: val,
      }) as CounterValuesStateRaw,
    {} as CounterValuesStateRaw,
  );
}

async function getKeys(prefix: string) {
  return (await store.keys()).filter(k => k.indexOf(prefix) === 0);
}

async function unsafeSaveCountervalues(
  state: CounterValuesStateRaw,
  {
    changed,
    pairIds,
  }: {
    changed: boolean;
    pairIds: string[];
  },
): Promise<void> {
  if (!changed) return;
  const deletedKeys = (await getKeys(COUNTERVALUES_DB_PREFIX)).filter(
    k => ![...pairIds, "status"].includes(k.replace(COUNTERVALUES_DB_PREFIX, "")),
  );
  const data = Object.entries(state).map<[string, RateMapRaw | CounterValuesStatus]>(
    ([key, val]) => [`${COUNTERVALUES_DB_PREFIX}${key}`, val],
  );
  await store.save(data);

  if (deletedKeys.length) {
    await store.delete(deletedKeys);
  }
}

export async function getBle(): Promise<BleState> {
  const ble = (await store.get("ble")) as BleState;
  return ble;
}
export async function saveBle(obj: BleState): Promise<void> {
  await store.save("ble", obj);
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
  const keys = await store.keys();
  const accountKeys = onlyAccountsKeys(keys);

  // if some account keys, we retrieve them and return
  if (accountKeys && accountKeys.length > 0) {
    let active = (await store.get(accountKeys)) as { data: AccountRaw }[];

    if (keys.includes(ACCOUNTS_KEY_SORT)) {
      const ids = (await store.get(ACCOUNTS_KEY_SORT)) as string[];
      active = active
        .map<[{ data: AccountRaw }, number]>(a => [a, ids.indexOf(a.data.id)])
        .sort((a, b) => a[1] - b[1])
        .map(a => a[0]);
    }

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
  const keys = await store.keys();
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

  /** Find current DB accounts keys diff with app state to remove them */
  const deletedKeys =
    currentAccountKeys && currentAccountKeys.length
      ? currentAccountKeys.filter(key => dbData.every(([accountKey]) => accountKey !== key))
      : [];
  // we only save those who effectively changed
  const dbDataWithOnlyChanges = !stats
    ? dbData
    : dbData.filter(([_key, { data }]) => stats.changed.includes(data.id));

  /** persist store data to DB */
  await store.save([
    ...dbDataWithOnlyChanges, // also store an index of ids to keep sort in memory
    [ACCOUNTS_KEY_SORT, newAccounts.map(a => a.data.id)],
  ] as [string, string | { data: AccountRaw; version: number }][]);

  /** then delete potential removed keys */
  if (deletedKeys.length > 0) {
    await store.delete(deletedKeys);
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
  const keys = await store.keys();

  /** check if old data is present */
  const hasOldAccounts = keys.includes(ACCOUNTS_KEY);

  if (hasOldAccounts) {
    log("db", "should migrateAccountsIfNecessary");
    let oldAccounts: {
      active: { data: Account }[];
    } | null = null;

    try {
      /** fetch old accounts db data */
      oldAccounts = (await store.get(ACCOUNTS_KEY)) as {
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
    await store.save(newDBData);
    await store.delete(ACCOUNTS_KEY);
    log("db", "done migrateAccountsIfNecessary");
  }
}

export function getPostOnboardingState(): Promise<PostOnboardingState> {
  return store.get("postOnboarding") as Promise<PostOnboardingState>;
}

export async function savePostOnboardingState(obj: PostOnboardingState): Promise<void> {
  await store.save("postOnboarding", obj);
}

export async function getProtect(): Promise<ProtectState> {
  const protect = (await store.get("protect")) as ProtectState;
  return protect;
}

export async function saveProtect(obj: ProtectState): Promise<void> {
  await store.save("protect", obj);
}

export async function deleteProtect(): Promise<void> {
  await store.delete("protect");
}

export function useDB<State, Selected>(
  key: string,
  initialState: State,
  // @ts-expect-error State !== Selected
  selector: (state: State) => Selected = state => state,
): [Selected, Dispatch<SetStateAction<State>>] {
  return useDBRaw<State, Selected>({
    initialState,
    getter: () => store.get(key) as Promise<State>,
    setter: (state: State) => store.save(key, state),
    selector,
  });
}
