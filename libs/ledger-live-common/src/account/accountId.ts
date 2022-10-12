import memoize from "lodash/memoize";
import invariant from "invariant";
import { asDerivationMode } from "../derivation";
import { getCryptoCurrencyById, findTokenById } from "../currencies";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets";
import type { AccountIdParams, DerivationMode } from "@ledgerhq/types-live";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";

function ensureNoColon(value: string, ctx: string): string {
  invariant(
    !value.includes(":"),
    "AccountId '%s' component must not use colon",
    ctx
  );
  return value;
}

export function encodeAccountId({
  type,
  version,
  currencyId,
  xpubOrAddress,
  derivationMode,
}: AccountIdParams): string {
  return `${ensureNoColon(type, "type")}:${ensureNoColon(
    version,
    "version"
  )}:${ensureNoColon(currencyId, "currencyId")}:${ensureNoColon(
    xpubOrAddress,
    "xpubOrAddress"
  )}:${ensureNoColon(derivationMode, "derivationMode")}`;
}
export function encodeTokenAccountId(
  accountId: string,
  token: TokenCurrency
): string {
  return accountId + "+" + encodeURIComponent(token.id);
}
export function decodeTokenAccountId(id: string): {
  accountId: string;
  token: TokenCurrency | null | undefined;
} {
  const [accountId, tokenId] = id.split("+");
  const decodedTokenId = decodeURIComponent(tokenId);
  let token = findTokenById(decodedTokenId);
  if (!token) {
    const { currencyId } = decodeAccountId(accountId);
    token = findTokenByAddressInCurrency(decodedTokenId, currencyId);
  }
  return {
    accountId,
    token,
  };
}
export function decodeAccountId(accountId: string): AccountIdParams {
  invariant(typeof accountId === "string", "accountId is not a string");
  const splitted = accountId.split(":");
  invariant(splitted.length === 5, "invalid size for accountId");
  const [type, version, currencyId, xpubOrAddress, derivationMode] = splitted;
  return {
    type,
    version,
    currencyId,
    xpubOrAddress,
    derivationMode: asDerivationMode(derivationMode),
  };
}
// you can pass account because type is shape of Account
// wallet name is a lib-core concept that usually identify a pool of accounts with the same (seed, cointype, derivation scheme) config.
export function getWalletName({
  seedIdentifier,
  derivationMode,
  currency,
}: {
  seedIdentifier: string;
  derivationMode: DerivationMode;
  currency: CryptoCurrency;
}): string {
  return `${seedIdentifier}_${currency.id}_${derivationMode}`;
}
export const inferFamilyFromAccountId: (
  accountId: string
) => string | null | undefined = memoize((accountId) => {
  try {
    const { currencyId } = decodeAccountId(accountId);
    return getCryptoCurrencyById(currencyId).family;
  } catch (e) {
    return null;
  }
});
