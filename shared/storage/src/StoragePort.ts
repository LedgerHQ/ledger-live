/** What a record stored in 1 key needs. */
export type StoragePort = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
};

/** What a record stored as 1 key for each entry needs: it lists and removes entry keys. */
export type ListableStoragePort = StoragePort & {
  keys(prefix: string): Promise<string[]>;
  remove(key: string): Promise<void>;
};
