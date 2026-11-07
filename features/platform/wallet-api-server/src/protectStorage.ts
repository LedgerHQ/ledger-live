/** What the storage rule reads of a manifest. */
export type StorageManifest = { id: string; storage?: string[] };

/** A live app reaches its own store and the stores its manifest lists, nothing else. */
export function protectStorageLogic<T extends { storeId: string }, R>(
  manifest: StorageManifest,
  handler: (args: T) => R,
) {
  return (args: T) => {
    const { storeId } = args;
    if (storeId !== manifest.id && !manifest.storage?.includes(storeId)) {
      throw new Error(`Live App "${manifest.id}" is not permitted to access storage "${storeId}".`);
    }
    return handler(args);
  };
}
