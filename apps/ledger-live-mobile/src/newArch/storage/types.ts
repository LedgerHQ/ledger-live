/** Application storage interface used to store data in the application. */
export interface Storage {
  /** Get all keys in application storage. */
  keys(): Promise<string[]>;

  /**
   * Gets a one or more value for a key or array of keys from Storage
   *
   * @param key
   * A key or array of keys
   */
  get<T>(key: string | string[]): Promise<T | (T | undefined)[] | undefined>;

  /**
   * Save a key value pair or a series of key value pairs to Storage.
   *
   * @param key
   * The key or an array of key value pairs to be saved
   *
   * @param value
   * The value to be saved. If the key is an array of key value pairs,
   * this argument is ignored.
   */
  save<T>(key: string | [string, T][], value?: T): Promise<void>;

  /**
   * Updates the value in the store for a given key in application storage.
   *
   * - If the value is a string it will be replaced.
   * - If the value is an object it will be deep merged.
   *
   * @param key
   * The key to update.
   *
   * @param value
   * The value to update with
   */
  update<T>(key: string, value: T): Promise<void>;

  /**
   * Delete the value for a given key in application storage.
   *
   * @param key
   * The key or an array of keys to be deleted
   */
  delete(key: string | string[]): Promise<void>;

  /**
   * Push a value onto an array stored in application storage by key or create
   * a new array in Storage for a key if it's not yet defined.
   *
   * @param key
   * The key
   *
   * @param value
   * The value to push onto the array
   */
  push<T = unknown>(key: string, value: T): Promise<void>;

  /** Migrate the current application storage engine from AsyncStorage to MMKV. */
  migrate(): Promise<void>;

  /** Fully reset the migration state to be able migrate again. */
  resetMigration(): Promise<void>;

  /** Rollback the migration to AsyncStorage. */
  rollbackMigration(): Promise<void>;
}

/** Internal state of the {@link Storage}. */
export interface StorageState {
  storageType: StorageType;
}

/** Initializer callback function to initialize {@link StorageState} state. */
export type StorageInitializer = (state: StorageState) => void;

/** Represents all the available storage types. */
export type StorageType = "MMKV" | "AsyncStorage";
