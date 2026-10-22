import { loadAppConfig as load, profileOf } from "./load";
import { appConfigStorage } from "./storage";

/**
 * Resolves the configuration of this session. The store calls it once it is created, after `init()`
 * has seeded `localStorage`.
 */
export const loadAppConfig = (storage = appConfigStorage) =>
  load(storage, profileOf(process.env.CONFIG_PROFILE));
