// @flow
import invariant from "invariant";
import type { CryptoCurrency, DerivationMode } from "../types";
import { asDerivationMode } from "../derivation";

export type AccountIdParams = {
  type: string,
  version: string,
  currencyId: string,
  xpubOrAddress: string,
  derivationMode: DerivationMode
};

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
  derivationMode
}: AccountIdParams) {
  return `${ensureNoColon(type, "type")}:${ensureNoColon(
    version,
    "version"
  )}:${ensureNoColon(currencyId, "currencyId")}:${ensureNoColon(
    xpubOrAddress,
    "xpubOrAddress"
  )}:${ensureNoColon(derivationMode, "derivationMode")}`;
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
    derivationMode: asDerivationMode(derivationMode)
  };
}

// you can pass account because type is shape of Account
// wallet name is a lib-core concept that usually identify a pool of accounts with the same (seed, cointype, derivation scheme) config.
export function getWalletName({
  seedIdentifier,
  derivationMode,
  currency
}: {
  seedIdentifier: string,
  derivationMode: DerivationMode,
  currency: CryptoCurrency
}) {
  return `${seedIdentifier}_${currency.id}_${derivationMode}`;
}
