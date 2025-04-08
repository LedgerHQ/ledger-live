import type { Storage } from "./types";
import asyncStorageWrapper from "./asyncStorageWrapper";

/** Singleton reference to the global application storage object. */
export default createStorage();

/** Creates the global application storage object that implements the {@link Storage} interface. */
function createStorage(): Storage {
  return {
    keys() {
      return asyncStorageWrapper.keys();
    },

    get(key) {
      return asyncStorageWrapper.get(key);
    },

    save(key, value) {
      return asyncStorageWrapper.save(key, value);
    },

    update(key, value) {
      return asyncStorageWrapper.update(key, value);
    },

    delete(key) {
      return asyncStorageWrapper.delete(key);
    },

    push(key, value) {
      return asyncStorageWrapper.push(key, value);
    },

    migrate() {
      throw new Error("Unimplemented");
    },

    resetMigration() {
      throw new Error("Unimplemented");
    },

    rollbackMigration() {
      throw new Error("Unimplemented");
    },
  } satisfies Storage;
}
