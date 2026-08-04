// Deprecated: compatibility shim, import @domain/entity-account-name directly.
export type { AccountForName } from "@domain/entity-account-name/accountName";
export {
  MAX_ACCOUNT_NAME_LENGTH,
  normalizeName,
  getDefaultAccountName,
  getDefaultAccountNameForCurrencyIndex,
  validateNameEdition,
} from "@domain/entity-account-name/accountName";
