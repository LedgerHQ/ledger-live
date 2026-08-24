import { parseNavigationBackPath } from "LLD/utils/navigationBackPath";

export const CRYPTO_ADDRESSES_BACK_PATH_STATE_KEY = "cryptoAddressesBackPath";

export type CryptoAddressesLocationState = Readonly<{
  cryptoAddressesBackPath?: string;
}>;

const EXCLUDED_CRYPTO_ADDRESSES_BACK_PATHNAMES = new Set<string>(["/cryptos"]);

/** Resolves the Contacts-originated back path and ignores unknown or unsafe location state. */
export function parseCryptoAddressesBackPath(locationState: unknown): string | undefined {
  return parseNavigationBackPath(
    locationState,
    CRYPTO_ADDRESSES_BACK_PATH_STATE_KEY,
    EXCLUDED_CRYPTO_ADDRESSES_BACK_PATHNAMES,
  );
}
