import type { ListableStoragePort } from "./StoragePort";

/** A copy through JSON, as a JSON store gives it back: `undefined` stays `undefined`. */
const copyAsStored = (value: unknown): unknown => {
  const json = JSON.stringify(value);
  return json === undefined ? undefined : JSON.parse(json);
};

export function createMemoryStorage(initial: Record<string, unknown> = {}): ListableStoragePort {
  const values = new Map<string, unknown>(
    Object.entries(initial).map(([key, value]) => [key, copyAsStored(value)]),
  );

  return {
    async get(key) {
      return values.has(key) ? copyAsStored(values.get(key)) : undefined;
    },
    async set(key, value) {
      values.set(key, copyAsStored(value));
    },
    async remove(key) {
      values.delete(key);
    },
    async keys(prefix) {
      return [...values.keys()].filter(key => key.startsWith(prefix));
    },
  };
}
