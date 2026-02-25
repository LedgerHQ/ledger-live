import { Account } from "@ledgerhq/types-live";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";

export const getAccountProtocol = (account: Account): string | null => {
  if (
    account.type === "Account" &&
    account.derivationMode !== undefined &&
    account.derivationMode !== null &&
    account.currency.type === "CryptoCurrency"
  ) {
    return getTagDerivationMode(account.currency, account.derivationMode) || null;
  }
  return null;
};
