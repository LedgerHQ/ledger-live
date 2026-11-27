import type { CompositeAccountKey } from "../../coin-modules/types";

const HEX_PUBLIC_KEY = /^([0-9a-f]{2})+$/i;
const ACCOUNT_ID = /^\d+\.\d+\.\d+$/;
const SEPARATOR = ":";

export const hederaAccountKey: CompositeAccountKey = {
  keyOf: ({ freshAddress, seedIdentifier }) =>
    seedIdentifier && HEX_PUBLIC_KEY.test(seedIdentifier)
      ? `${freshAddress}${SEPARATOR}${seedIdentifier.toLowerCase()}`
      : undefined,
  partsOf: key => {
    const [freshAddress, seedIdentifier, ...rest] = key.split(SEPARATOR);
    const isKey =
      rest.length === 0 &&
      ACCOUNT_ID.test(freshAddress) &&
      seedIdentifier !== undefined &&
      HEX_PUBLIC_KEY.test(seedIdentifier);
    return isKey ? { freshAddress, seedIdentifier } : undefined;
  },
};
