import { getEnv } from "@ledgerhq/live-env";

/** `KEYCHAIN_OBSERVABLE_RANGE`: a floor for every mode's gap limit in a scan. */
export const getKeychainObservableRange = (): number => getEnv("KEYCHAIN_OBSERVABLE_RANGE") ?? 0;

/** `SHOW_LEGACY_NEW_ACCOUNT`: a scan offers a new account in the legacy "" mode. */
export const showsLegacyNewAccount = (): boolean => !!getEnv("SHOW_LEGACY_NEW_ACCOUNT");
