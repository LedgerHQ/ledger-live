import type { AccountLike, DerivationMode } from "@ledgerhq/types-live";
import { getTagDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** The address type of an account ("Native segwit", "Taproot"...), when it has one worth showing. */
export const getAccountTag = (account: AccountLike): string | undefined => {
  if (account.type !== "Account") return undefined;

  const { currency, derivationMode } = account;
  if (derivationMode === undefined || derivationMode === null) return undefined;

  const tag = getTagDerivationMode(currency, derivationMode as DerivationMode);
  return tag ? capitalize(tag) : undefined;
};
