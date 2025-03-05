import invariant from "invariant";
import { asDerivationMode } from "../derivation";
import { findTokenByAddressInCurrency, findTokenById } from "@ledgerhq/cryptoassets";
import type { AccountIdParams } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

function ensureNoColon(value: string, ctx: string): string {
  invariant(!value.includes(":"), "AccountId '%s' component must not use colon", ctx);
  return value;
}

export function safeEncodeTokenId(tokenId: string): string {
  if (!tokenId) return "";

  const URIEncoded = encodeURIComponent(tokenId);
  const dashUnderscoreSafe = URIEncoded.replace(/-/g, "~!dash!~").replace(/_/g, "~!underscore!~");

  return dashUnderscoreSafe;
}

export function safeDecodeTokenId(encodedTokenId: string): string {
  if (!encodedTokenId) return "";

  const dashUnderscoreUnsafe = encodedTokenId
    .replace(/~!dash!~/g, "-")
    .replace(/~!underscore!~/g, "_");
  const decodedURIComponent = decodeURIComponent(dashUnderscoreUnsafe);

  return decodedURIComponent;
}

export function encodeAccountId({
  type,
  version,
  currencyId,
  xpubOrAddress,
  derivationMode,
}: AccountIdParams): string {
  return `${ensureNoColon(type, "type")}:${ensureNoColon(version, "version")}:${ensureNoColon(
    currencyId,
    "currencyId",
  )}:${ensureNoColon(xpubOrAddress, "xpubOrAddress")}:${ensureNoColon(
    derivationMode,
    "derivationMode",
  )}`;
}
export function encodeTokenAccountId(accountId: string, token: TokenCurrency): string {
  return accountId + "+" + safeEncodeTokenId(token.id);
}

export function decodeTokenAccountId(id: string): {
  accountId: string;
  token: TokenCurrency | undefined;
} {
  const [accountId, tokenId] = id.split("+");
  const decodedTokenId = safeDecodeTokenId(tokenId);
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
