export interface StoreWrapper {
  /**
   * Get a one or more value for a key or array of keys from AsyncStorage
   * @param {String|Array} key A key or array of keys
   * @return {Promise}
   */
  get<T extends object>(
    key: string | string[],
  ): Promise<T | (T | undefined | null)[] | null | undefined>;

  /**
   * Save a key value pair or a series of key value pairs to AsyncStorage.
   * @param  {String|Array} key The key or an array of key/value pairs
   * @param  {Any} value The value to save
   * @return {Promise}
   */
  save<T extends object>(key: string | [string, T][], value?: T): Promise<void>;
  /**
   * Updates the value in the store for a given key in AsyncStorage. If the value is a string it will be replaced. If the value is an object it will be deep merged.
   * @param  {String} key The key
   * @param  {Value} value The value to update with
   * @return {Promise}
   */
  update<T extends object>(key: string, value: T): Promise<void>;

  /**
   * Delete the value for a given key in AsyncStorage.
   * @param  {String|Array} key The key or an array of keys to be deleted
   * @return {Promise}
   */
  delete(key: string | string[]): Promise<void>;

  /**
   * Get all keys in AsyncStorage.
   * @return {Promise} A promise which when it resolves gets passed the saved keys in AsyncStorage.
   */
  keys(): Promise<string[]>;
}
