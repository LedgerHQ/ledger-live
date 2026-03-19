import { AppManifest } from "../types";

type StorageGetArgs = {
  key: string;
  storeId: string;
};

type StorageSetArgs = {
  key: string;
  value: unknown;
  storeId: string;
};

type StorageHandlerArgs = StorageGetArgs | StorageSetArgs;

export function protectStorageLogic<T extends StorageHandlerArgs, R>(
  manifest: AppManifest,
  handler: (args: T) => R,
) {
  return (args: T) => {
    const { storeId } = args;

    if (storeId !== manifest.id && (!manifest.storage || !manifest.storage.includes(storeId))) {
      throw new Error(`Live App "${manifest.id}" is not permitted to access storage "${storeId}".`);
    }

    return handler(args);
  };
}
