import { findTokenById } from "@ledgerhq/cryptoassets";
import { PublicKey } from "@solana/web3.js";
import { TokenAccount } from "../../types/account";

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export const MAX_MEMO_LENGTH = 500;

export const isValidBase58Address = (address: string): boolean => {
  try {
    return Boolean(new PublicKey(address));
  } catch (_) {
    return false;
  }
};

export const isEd25519Address = (address: string): boolean => {
  return PublicKey.isOnCurve(new PublicKey(address).toBytes());
};

export function encodeAccountIdWithTokenAccountAddress(
  accountId: string,
  address: string
): string {
  return `${accountId}+${address}`;
}

export function decodeAccountIdWithTokenAccountAddress(
  accountIdWithTokenAccountAddress: string
): { accountId: string; address: string } {
  const lastColonIndex = accountIdWithTokenAccountAddress.lastIndexOf("+");
  return {
    accountId: accountIdWithTokenAccountAddress.slice(0, lastColonIndex),
    address: accountIdWithTokenAccountAddress.slice(lastColonIndex + 1),
  };
}

export function toTokenId(mint: string): string {
  return `solana/spl/${mint}`;
}

export function toTokenMint(tokenId: string): string {
  return tokenId.split("/")[2];
}

export function toSubAccMint(subAcc: TokenAccount): string {
  return toTokenMint(subAcc.token.id);
}

export function tokenIsListedOnLedger(mint: string): boolean {
  return findTokenById(toTokenId(mint))?.type === "TokenCurrency";
}
