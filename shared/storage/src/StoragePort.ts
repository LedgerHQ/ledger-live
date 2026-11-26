export type StoragePort = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
};
