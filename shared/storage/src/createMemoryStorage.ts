import type { StoragePort } from "./StoragePort";

const copyAsStored = (value: unknown): unknown => {
  const json = JSON.stringify(value);
  return json === undefined ? undefined : JSON.parse(json);
};

export function createMemoryStorage(initial: Record<string, unknown> = {}): StoragePort {
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
  };
}
