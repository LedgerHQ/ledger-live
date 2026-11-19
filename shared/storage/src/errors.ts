export class StorageLockedError extends Error {
  override name = "StorageLockedError";
  readonly key: string;
  constructor(key: string) {
    super(`Storage key "${key}" is encrypted and the storage is locked`);
    this.key = key;
  }
}
