import invariant from "invariant";
import { asDerivationMode } from "../derivation";
import type { AccountIdParams } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";

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

export function safeEncodeXpubOrAddress(xpubOrAddress: string): string {
  if (!xpubOrAddress) return "";

  return xpubOrAddress.replace(/::/g, "~!colons!~");
}

export function safeDecodeXpubOrAddress(encodedXpubOrAddress: string): string {
  if (!encodedXpubOrAddress) return "";

  return encodedXpubOrAddress.replace(/~!colons!~/g, "::");
}

export function encodeAccountId({
  type,
  version,
  currencyId,
  xpubOrAddress,
  derivationMode,
  customData,
}: AccountIdParams): string {
  const base = `${ensureNoColon(type, "type")}:${ensureNoColon(version, "version")}:${ensureNoColon(
    currencyId,
    "currencyId",
  )}:${safeEncodeXpubOrAddress(xpubOrAddress)}:${ensureNoColon(derivationMode, "derivationMode")}`;

  if (customData && customData.length > 0) {
    return `${base}:${safeEncodeXpubOrAddress(customData)}`;
  }

  return base;
}
export function encodeTokenAccountId(accountId: string, token: TokenCurrency): string {
  return accountId + "+" + safeEncodeTokenId(token.id);
}

export function decodeTokenAccountIdSync(id: string): {
  accountId: string;
  tokenId: string;
} {
  const [accountId, tokenId] = id.split("+");
  const decodedTokenId = safeDecodeTokenId(tokenId);
  return {
    accountId,
    tokenId: decodedTokenId,
  };
}

export async function decodeTokenAccountId(id: string): Promise<{
  accountId: string;
  token: TokenCurrency | undefined;
}> {
  const store = getCryptoAssetsStore();
  const [accountId, tokenId] = id.split("+");
  const decodedTokenId = safeDecodeTokenId(tokenId);
  let token = await store.findTokenById(decodedTokenId);
  if (!token) {
    const { currencyId } = decodeAccountId(accountId);
    token = await store.findTokenByAddressInCurrency(decodedTokenId, currencyId);
  }
  return {
    accountId,
    token,
  };
}

export function decodeAccountId(accountId: string): AccountIdParams {
  invariant(typeof accountId === "string", "accountId is not a string");
  const splitted = accountId.split(":");
  invariant(splitted.length >= 5, "invalid size for accountId");
  const [type, version, currencyId, encodedXpubOrAddress, derivationMode, customData] = splitted;
  return {
    type,
    version,
    currencyId,
    xpubOrAddress: safeDecodeXpubOrAddress(encodedXpubOrAddress),
    derivationMode: asDerivationMode(derivationMode),
    ...(customData && {
      customData: safeDecodeXpubOrAddress(customData),
    }),
  };
}
