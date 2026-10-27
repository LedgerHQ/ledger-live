import isEmpty from "lodash/isEmpty";
import { bootstrap, store as storeBridge } from "~/renderer/bridge";

type StoreObject = Record<string, unknown>;
type Mutate = (state: StoreObject) => StoreObject;
type Mutation = { mutate: Mutate; done: boolean };

// Main persists mutations in the order they are sent: the cache replays the ones that have not
// failed, in that order, over the last state main is known to hold.
let persisted: StoreObject = bootstrap.store;
let queue: Mutation[] = [];
// Synchronous on purpose: the Recover funnel reads it on first render.
let cache: StoreObject = persisted;

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

const replay = (mutations: Mutation[], state: StoreObject): StoreObject =>
  mutations.reduce((next, { mutate }) => mutate(next), state);

async function commit(mutate: Mutate, persist: () => Promise<void>): Promise<void> {
  const next = mutate(cache);
  const mutation: Mutation = { mutate, done: false };
  queue.push(mutation);
  cache = next;
  try {
    await persist();
    mutation.done = true;
  } catch (error) {
    queue = queue.filter(other => other !== mutation);
    cache = replay(queue, persisted);
    throw error;
  } finally {
    const pending = queue.findIndex(other => !other.done);
    const settled = pending === -1 ? queue.length : pending;
    persisted = replay(queue.slice(0, settled), persisted);
    queue = queue.slice(settled);
  }
}

export async function setStoreValue<T>(key: string, value: T, storeId: string): Promise<void> {
  const path = storePath(key, storeId);
  await commit(
    state => (path.length === 0 ? state : writePath(state, path, value)),
    () => storeBridge.set(storeKey(key, storeId), value),
  );
}

export async function resetStore(): Promise<void> {
  await commit(
    () => ({}),
    () => storeBridge.clear(),
  );
}
