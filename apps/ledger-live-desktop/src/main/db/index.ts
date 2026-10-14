import { log } from "@ledgerhq/logs";
import path from "path";
import cloneDeep from "lodash/cloneDeep";
import get from "lodash/get";
import set from "lodash/set";
import pick from "lodash/pick";
import fs from "fs/promises";
import { getEnv } from "@shared/env";
import { NoDBPathGiven, DBWrongPassword } from "../../errors";
import { INITIAL_STATE as trustchainInitialState } from "@ledgerhq/ledger-key-ring-protocol/store";
import {
  exportWalletState,
  initialState as walletInitialState,
} from "~/renderer/reducers/wallet.core";
import { contactsInitialState } from "@domain/entity-contact";
import { LARGE_SCREEN_UPSELL_MODAL } from "@features/flow-large-screen-upsell";
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

// Track which keyPaths triggered saves for each namespace
const saveTriggers: Map<string, Set<string>> = new Map();

/** Allow list for app namespace: only these + keepLegacy keys are loaded and can be persisted. */
const APP_NAMESPACE_ALLOWED_KEY_PATHS: ReadonlySet<string> = new Set([
  "accounts",
  "countervalues",
  "postOnboarding",
  "settings",
  "trustchain",
  "wallet",
  "market",
  "marketBanner",
  LARGE_SCREEN_UPSELL_MODAL,
  "payCard",
  "knownDevices",
  "cryptoAssets",
  "identities",
  "featureFlags",
  "coinConfigOverrides",
  "discover",
  "ptx",
  "history",
  "PLAYWRIGHT_RUN", // e2e fixtures: localStorage seed (e.g. acceptedTermsVersion) and env overrides
]);

/** Legacy keys we keep in memory and on disk until their replacement is written. */
const APP_NAMESPACE_KEEP_LEGACY: Record<string, { replacedBy: string }> = {
  user: { replacedBy: "identities" },
};

/** Top-level keys kept on load (`pick`) and accepted by `setKey` (allowed + legacy). */
const APP_NAMESPACE_TOP_LEVEL_KEYS: readonly string[] = [
  ...APP_NAMESPACE_ALLOWED_KEY_PATHS,
  ...Object.keys(APP_NAMESPACE_KEEP_LEGACY),
];
const APP_NAMESPACE_SETTABLE_TOP_KEYS: ReadonlySet<string> = new Set(APP_NAMESPACE_TOP_LEVEL_KEYS);

function assertAppNamespaceSetKeyAllowed(keyPath: string): void {
  const top = keyPath.split(".")[0] ?? keyPath;
  if (!APP_NAMESPACE_SETTABLE_TOP_KEYS.has(top)) {
    throw new Error(
      `[db] setKey("app", …): unknown key path "${keyPath}" (top-level "${top}"). ` +
        `Add it to APP_NAMESPACE_ALLOWED_KEY_PATHS (and renderer DatabaseValues when applicable).`,
    );
  }
}

/**
 * Reset memory state, db path, encryption keys, transforms..
 */
function init(_DBPath: string) {
  DBPath = _DBPath;
  memoryNamespaces = {};
  encryptionKeys = {};
  saveTriggers.clear();
}

/**
 * Load a namespace, using <file>.json
 * For app: keep only allowed + keepLegacy keys (unknown keys are dropped).
 */
async function load(ns: string): Promise<unknown> {
  try {
    if (!DBPath) throw new NoDBPathGiven();
    const filePath = path.resolve(DBPath, `${ns}.json`);
    const fileContent = await readFile(filePath);
    const { data } = JSON.parse(fileContent.toString());
    const dataObj = data as Record<string, unknown>;

    if (ns === "app") {
      memoryNamespaces[ns] = pick(dataObj, APP_NAMESPACE_TOP_LEVEL_KEYS) as Record<string, unknown>;
    } else {
      memoryNamespaces[ns] = dataObj;
    }
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
  if (DBPath) init(DBPath);
}

/**
 * define all db paths where we need encryption
 */
const encryptedDataPaths = [
  ["app", "accounts"],
  ["app", "trustchain"],
  ["app", "wallet"],
] as const;

type EncryptedAppKeyPath = (typeof encryptedDataPaths)[number][1];

// Empty payloads encrypted when password lock is enabled before any account exists.
const ENCRYPTION_PATH_DEFAULTS: Record<EncryptedAppKeyPath, unknown> = {
  accounts: [],
  trustchain: trustchainInitialState,
  wallet: exportWalletState({ wallet: walletInitialState, contacts: contactsInitialState }),
};

for (const [, keyPath] of encryptedDataPaths) {
  if (ENCRYPTION_PATH_DEFAULTS[keyPath] === undefined) {
    throw new Error(`[db] missing ENCRYPTION_PATH_DEFAULTS for "${keyPath}"`);
  }
}

function ensureEncryptedPathInMemory(ns: string, keyPath: EncryptedAppKeyPath): void {
  const memory = memoryNamespaces[ns]!;
  const current = get(memory, keyPath);
  if (current === undefined || current === null) {
    set(memory, keyPath, ENCRYPTION_PATH_DEFAULTS[keyPath]);
  }
}

function decryptPath(
  ns: string,
  keyPath: EncryptedAppKeyPath,
  encrypted: string,
  encryptionKey: string,
): unknown {
  let decrypted = JSON.parse(decryptData(encrypted, encryptionKey));

  for (const path of encryptedDataPaths) {
    if (ns === path[0] && keyPath === path[1] && (decrypted as { data?: unknown }).data) {
      decrypted = (decrypted as { data: unknown }).data;
      break;
    }
  }

  return decrypted;
}

function decryptEncryptedPathInMemory(
  ns: string,
  keyPath: EncryptedAppKeyPath,
  encryptionKey: string,
) {
  const memory = memoryNamespaces[ns]!;
  const val = get(memory, keyPath);
  if (typeof val !== "string") return;
  set(memory, keyPath, decryptPath(ns, keyPath, val, encryptionKey));
}

/**
 * Register a keyPath in db that is encrypted
 * This will decrypt the keyPath at this moment, and will be used
 * in `save` to encrypt it back
 * Resolves true when it checked a password: a path decrypted, or the held key matched.
 */
async function setEncryptionKey(
  encryptionKey: string,
  currentEncryptionKey?: string,
): Promise<boolean> {
  if (typeof encryptionKey !== "string" || !encryptionKey) throw new DBWrongPassword();
  const replacesHeldKey = assertHeldKey(currentEncryptionKey);

  const decrypted: Array<[string, EncryptedAppKeyPath, unknown]> = [];
  const missing: Array<[string, EncryptedAppKeyPath]> = [];

  for (const [ns, keyPath] of encryptedDataPaths) {
    const val = await getKey(ns, keyPath, null);
    if (val === null || val === undefined) missing.push([ns, keyPath]);

    // no need to decode if already decoded; "" is corrupt ciphertext, not a decoded value
    if (typeof val !== "string") continue;
    try {
      decrypted.push([ns, keyPath, decryptPath(ns, keyPath, val, encryptionKey)]);
    } catch (err) {
      log("db", "setEncryptionKey failure: " + String(err));
      throw new DBWrongPassword();
    }
  }

  // Nothing changes until every path decrypts: a partial unlock would leave plaintext that the
  // next save writes out unencrypted, and a wrong key that passes isEncryptionKeyCorrect.
  const nsToSave = new Set<string>();
  for (const [ns, keyPath] of encryptedDataPaths) {
    nsToSave.add(ns);
    if (!encryptionKeys[ns]) encryptionKeys[ns] = {};
    encryptionKeys[ns]![keyPath] = encryptionKey;
  }
  for (const [ns, keyPath, value] of decrypted) set(memoryNamespaces[ns]!, keyPath, value);
  for (const [ns, keyPath] of missing) ensureEncryptedPathInMemory(ns, keyPath);

  for (const ns of nsToSave) {
    await save(ns);
  }
  return replacesHeldKey || decrypted.length > 0;
}
async function removeEncryptionKey(currentEncryptionKey?: string): Promise<boolean> {
  const removesHeldKey = assertHeldKey(currentEncryptionKey);
  const nsToSave = new Set<string>();
  for (const [ns, keyPath] of encryptedDataPaths) {
    nsToSave.add(ns);
    await ensureNSLoaded(ns);
    const encryptionKey = encryptionKeys[ns]?.[keyPath];
    if (encryptionKey) {
      try {
        decryptEncryptedPathInMemory(ns, keyPath, encryptionKey);
      } catch (err) {
        log("db", "removeEncryptionKey failure: " + String(err));
        throw err;
      }
    }
    ensureEncryptedPathInMemory(ns, keyPath);
    set(encryptionKeys, `${ns}.${keyPath}`, undefined);
  }

  for (const ns of nsToSave) {
    await save(ns);
  }
  return removesHeldKey;
}

/**
 * Set a key in the given namespace
 */
async function setKey<K>(ns: string, keyPath: string, value: K): Promise<void> {
  if (ns === "app") {
    assertAppNamespaceSetKeyAllowed(keyPath);
  }
  await ensureNSLoaded(ns);
  set(memoryNamespaces[ns]!, keyPath, value);
  // Track keyPath to identify what triggered the save
  if (!saveTriggers.has(ns)) {
    saveTriggers.set(ns, new Set());
  }
  saveTriggers.get(ns)!.add(keyPath);
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
async function hasBeenDecrypted(): Promise<boolean> {
  // conventionally we check the first path
  const [ns, keyPath] = encryptedDataPaths[0];
  const v = await getKey(ns, keyPath);
  if (typeof v !== "string") return true;
  try {
    JSON.parse(v);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build payload for app namespace: allowed keys + keepLegacy keys only when replacement not written.
 */
function buildAppNamespacePayload(memory: Record<string, unknown>): Record<string, unknown> {
  const payload = pick(memory, [...APP_NAMESPACE_ALLOWED_KEY_PATHS]) as Record<string, unknown>;
  for (const [legacyKey, { replacedBy }] of Object.entries(APP_NAMESPACE_KEEP_LEGACY)) {
    if (payload[replacedBy] === undefined && memory[legacyKey] !== undefined) {
      payload[legacyKey] = memory[legacyKey];
    }
  }
  return payload;
}

/**
 * Save given namespace to corresponding file, in atomic way
 */
async function saveToDisk(ns: string) {
  if (!DBPath) throw new NoDBPathGiven();
  await ensureNSLoaded(ns);

  const startTime = Date.now();
  const triggersSet = saveTriggers.get(ns);
  const triggers = triggersSet ? Array.from(triggersSet) : [];

  const memory = memoryNamespaces[ns]!;
  const raw = ns === "app" ? buildAppNamespacePayload(memory) : memory;
  const clone = cloneDeep(raw);

  // encrypt fields
  const namespacedEncryptionKeys = encryptionKeys[ns];
  if (namespacedEncryptionKeys) {
    for (const keyPath in namespacedEncryptionKeys) {
      if (namespacedEncryptionKeys.hasOwnProperty(keyPath)) {
        const encryptionKey = namespacedEncryptionKeys[keyPath];
        if (!encryptionKey) continue; // eslint-disable-line no-continue
        const val = get(clone, keyPath);
        const payload = val ?? ENCRYPTION_PATH_DEFAULTS[keyPath as EncryptedAppKeyPath];
        if (val === undefined || val === null) {
          set(memory, keyPath, payload);
        }
        const encrypted = encryptData(JSON.stringify(payload), encryptionKey);
        set(clone, keyPath, encrypted);
      }
    }
  }
  const fileContent = JSON.stringify({
    data: clone,
  });
  const filePath = path.resolve(DBPath, `${ns}.json`);
  await writeFile(filePath, fileContent);

  const duration = Date.now() - startTime;
  const sizeInBytes = Buffer.byteLength(fileContent, "utf8");
  const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
  const triggersStr = ` | ${triggers.join(", ")}`;
  console.log(`${ns}.json saved in ${duration}ms (${sizeInMB} MB)${triggersStr}`);
  saveTriggers.delete(ns);
}
async function cleanCache() {
  await setKey("app", "countervalues", null);
  await save("app");
}
async function resetAll() {
  if (!DBPath) throw new NoDBPathGiven();
  memoryNamespaces.app = null;
  encryptionKeys = {}; // Clear encryption keys to prevent re-encryption of old data
  await fs.unlink(path.resolve(DBPath, "app.json")).catch((e: NodeJS.ErrnoException) => {
    if (e.code !== "ENOENT") throw e;
  });
}
function isEncryptionKeyCorrect(encryptionKey: string | undefined) {
  const [ns, keyPath] = encryptedDataPaths[0]; // conventionally we check the first path
  const current = encryptionKeys[ns]?.[keyPath];
  return typeof current === "string" && !!current && current === encryptionKey;
}
// The db stays decrypted after an auto-lock: replacing or removing the held key without it
// would change the password without knowing it.
function assertHeldKey(currentEncryptionKey: string | undefined): boolean {
  if (!hasEncryptionKey()) return false;
  if (!isEncryptionKeyCorrect(currentEncryptionKey)) throw new DBWrongPassword();
  return true;
}
function hasEncryptionKey() {
  const [ns, keyPath] = encryptedDataPaths[0]; // conventionally we check the first path
  try {
    return !!encryptionKeys[ns]![keyPath];
  } catch {
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
