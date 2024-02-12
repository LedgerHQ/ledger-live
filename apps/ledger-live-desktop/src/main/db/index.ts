import { log } from "@ledgerhq/logs";
import path from "path";
import cloneDeep from "lodash/cloneDeep";
import get from "lodash/get";
import set from "lodash/set";
import fs from "fs/promises";
import { getEnv } from "@ledgerhq/live-env";
import { NoDBPathGiven, DBWrongPassword } from "@ledgerhq/errors";
import { encryptData, decryptData } from "~/main/db/crypto";
import { readFile, writeFile } from "~/main/db/fsHelper";

const debounce = <T, R>(fn: (...args: T[]) => R, ms: number) => {
  let timeout: NodeJS.Timeout | undefined;
  let resolveRefs: Array<(value: R | PromiseLike<R>) => void> = [];
  let rejectRefs: Array<(error: unknown) => void> = [];
  return (...args: T[]) => {
    const promise: Promise<R> = new Promise((resolve, reject) => {
      resolveRefs.push(resolve);
      rejectRefs.push(reject);
    });
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(async () => {
      try {
        const res = await fn(...args);
        resolveRefs.forEach(r => r(res));
      } catch (err) {
        rejectRefs.forEach(r => r(err));
      }
      resolveRefs = [];
      rejectRefs = [];
    }, ms);
    return promise;
  };
};

let DBPath: string | null = null;
let memoryNamespaces: Record<string, Record<string, unknown> | null | undefined> = {};
let encryptionKeys: Record<string, Record<string, string> | null | undefined> = {};
const DEBOUNCE_MS =
  process.env.NODE_ENV === "test" || getEnv("PLAYWRIGHT_RUN") || getEnv("MOCK") ? 16 : 500;
const save = debounce(saveToDisk, DEBOUNCE_MS);

/**
 * Reset memory state, db path, encryption keys, transforms..
 */
function init(_DBPath: string) {
  DBPath = _DBPath;
  memoryNamespaces = {};
  encryptionKeys = {};
}

/**
 * Load a namespace, using <file>.json
 */
async function load(ns: string): Promise<unknown> {
  try {
    if (!DBPath) throw new NoDBPathGiven();
    const filePath = path.resolve(DBPath, `${ns}.json`);
    const fileContent = await readFile(filePath);
    const { data } = JSON.parse(fileContent.toString());
    memoryNamespaces[ns] = data;
  } catch (err) {
    if ((err as { code?: string })?.code === "ENOENT") {
      memoryNamespaces[ns] = {};
      await save(ns);
    } else {
      console.error(err);
      throw err;
    }
  }
  return memoryNamespaces[ns];
}
async function ensureNSLoaded(ns: string) {
  if (!memoryNamespaces[ns]) {
    await load(ns);
  }
}

/**
 * In the event of a user refreshing the app we need to reload the data
 * to ensure the lock/unlock detection is still valid.
 */
async function reload() {
  DBPath && init(DBPath);
}

/**
 * Register a keyPath in db that is encrypted
 * This will decrypt the keyPath at this moment, and will be used
 * in `save` to encrypt it back
 */
async function setEncryptionKey(ns: string, keyPath: string, encryptionKey: string): Promise<void> {
  if (!encryptionKeys[ns]) encryptionKeys[ns] = {};
  encryptionKeys[ns]![keyPath] = encryptionKey;
  const val = await getKey(ns, keyPath, null);

  // no need to decode if already decoded
  if (!val || typeof val !== "string") {
    return save(ns);
  }
  try {
    let decrypted = JSON.parse(decryptData(val, encryptionKey));

    // handle the case when we just migrated from the previous storage
    // which stored the data in binary with a `data` key
    if (ns === "app" && keyPath === "accounts" && decrypted.data) {
      decrypted = decrypted.data;
    }

    // only set decrypted data in memory
    set(memoryNamespaces[ns]!, keyPath, decrypted);
    return save(ns);
  } catch (err) {
    log("db", "setEncryptionKey failure: " + String(err));
    console.error(err);
    throw new DBWrongPassword();
  }
}
async function removeEncryptionKey(ns: string, keyPath: string) {
  set(encryptionKeys, `${ns}.${keyPath}`, undefined);
  return save(ns);
}

/**
 * Set a key in the given namespace
 */
async function setKey<K>(ns: string, keyPath: string, value: K): Promise<void> {
  await ensureNSLoaded(ns);
  set(memoryNamespaces[ns]!, keyPath, value);
  return save(ns);
}

/**
 * Get a key in the given namespace
 */
async function getKey<V>(
  ns: string,
  keyPath: string,
  defaultValue?: V,
): Promise<V | Record<string, V> | undefined> {
  await ensureNSLoaded(ns);
  if (!keyPath) return (memoryNamespaces[ns] as Record<string, V>) || defaultValue;
  return get(memoryNamespaces[ns], keyPath, defaultValue) as V;
}

/**
 * Check if a key has been decrypted
 *
 * /!\ it consider encrypted if it's string and can't JSON.parse, so
 *     can brings false-positive if bad used
 */
async function hasBeenDecrypted(ns: string, keyPath: string): Promise<boolean> {
  const v = await getKey(ns, keyPath);
  if (typeof v !== "string") return true;
  try {
    JSON.parse(v);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Save given namespace to corresponding file, in atomic way
 */
async function saveToDisk(ns: string) {
  if (!DBPath) throw new NoDBPathGiven();
  await ensureNSLoaded(ns);

  // cloning because we are mutating the obj
  const clone = cloneDeep(memoryNamespaces[ns]);

  // encrypt fields
  const namespacedEncryptionKeys = encryptionKeys[ns];
  if (namespacedEncryptionKeys) {
    for (const keyPath in namespacedEncryptionKeys) {
      if (namespacedEncryptionKeys.hasOwnProperty(keyPath)) {
        const encryptionKey = namespacedEncryptionKeys[keyPath];
        if (!encryptionKey) continue; // eslint-disable-line no-continue
        const val = get(clone, keyPath);
        if (!val) continue; // eslint-disable-line no-continue
        const encrypted = encryptData(JSON.stringify(val), encryptionKey);
        set(clone as object, keyPath, encrypted);
      }
    }
  }
  const fileContent = JSON.stringify({
    data: clone,
  });
  await writeFile(path.resolve(DBPath, `${ns}.json`), fileContent);
}
async function cleanCache() {
  await setKey("app", "countervalues", null);
  await save("app");
}
async function resetAll() {
  if (!DBPath) throw new NoDBPathGiven();
  memoryNamespaces.app = null;
  await fs.unlink(path.resolve(DBPath, "app.json"));
}
function isEncryptionKeyCorrect(ns: string, keyPath: string, encryptionKey: string) {
  try {
    return encryptionKeys[ns]![keyPath] === encryptionKey;
  } catch (err) {
    return false;
  }
}
function hasEncryptionKey(ns: string, keyPath: string) {
  try {
    return !!encryptionKeys[ns]![keyPath];
  } catch (err) {
    return false;
  }
}

export default {
  init,
  reload,
  load,
  setEncryptionKey,
  removeEncryptionKey,
  isEncryptionKeyCorrect,
  hasEncryptionKey,
  setKey,
  getKey,
  hasBeenDecrypted,
  cleanCache,
  resetAll,
};
