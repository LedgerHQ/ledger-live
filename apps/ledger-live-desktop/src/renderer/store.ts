import isEmpty from "lodash/isEmpty";
import { bootstrap, store as storeBridge } from "~/renderer/bridge";

type StoreObject = Record<string, unknown>;

// Synchronous on purpose: the Recover funnel reads it on first render.
let cache: StoreObject = bootstrap.store;

const storeKey = (key: string, storeId: string) => `${storeId}-${key}`;

const DISALLOWED_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

// Read and written like electron-store's dot-prop, where `\.` is a literal dot:
// https://github.com/sindresorhus/dot-prop/blob/v6.0.1/index.js
const storePath = (key: string, storeId: string): string[] => {
  const parts = storeKey(key, storeId).split(".");
  const segments: string[] = [];
  let index = 0;
  while (index < parts.length) {
    let segment = parts[index++];
    while (segment.endsWith("\\") && index < parts.length) {
      segment = `${segment.slice(0, -1)}.${parts[index++]}`;
    }
    segments.push(segment);
  }
  return segments.some(segment => DISALLOWED_SEGMENTS.has(segment)) ? [] : segments;
};

const isStoreObject = (value: unknown): value is StoreObject =>
  typeof value === "object" && value !== null;

const readPath = (path: string[]): unknown =>
  path.reduce<unknown>((node, segment) => (isStoreObject(node) ? node[segment] : undefined), cache);

// Copy-on-write: the snapshot is frozen.
const writePath = (
  node: StoreObject,
  [segment, ...rest]: string[],
  value: unknown,
): StoreObject => {
  const copy: StoreObject = Array.isArray(node) ? Object.assign([], node) : { ...node };
  const child = node[segment];
  copy[segment] =
    rest.length === 0 ? value : writePath(isStoreObject(child) ? child : {}, rest, value);
  return copy;
};

export function getStoreValue<T>(key: string, storeId: string): T | undefined {
  const path = storePath(key, storeId);
  if (path.length === 0) return undefined;
  const value = readPath(path);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return isEmpty(value) ? undefined : (value as T);
}

// The undo restores the whole top-level entry, unless a later write has replaced it.
const writeCache = (path: string[], value: unknown): (() => void) => {
  if (path.length === 0) return () => {};
  const [entry] = path;
  const previous = cache;
  cache = writePath(cache, path, value);
  const written = cache[entry];
  return () => {
    if (cache[entry] === written) cache = { ...cache, [entry]: previous[entry] };
  };
};

export async function setStoreValue<T>(key: string, value: T, storeId: string): Promise<void> {
  const undo = writeCache(storePath(key, storeId), value);
  try {
    await storeBridge.set(storeKey(key, storeId), value);
  } catch (error) {
    undo();
    throw error;
  }
}

export async function resetStore(): Promise<void> {
  const previous = cache;
  const cleared: StoreObject = {};
  cache = cleared;
  try {
    await storeBridge.clear();
  } catch (error) {
    if (cache === cleared) cache = previous;
    throw error;
  }
}
