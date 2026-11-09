import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { SendAccount, SendAccountLike, SendTokenAccount } from "../registry";

class InvalidAccountTypeError extends Error {
  override name = "InvalidAccountTypeError";
  constructor(type: string) {
    super(`invalid account.type=${type}`);
  }
}

class MissingMainAccountError extends Error {
  override name = "MissingMainAccountError";
  constructor() {
    super("an account is expected");
  }
}

export function getMainAccount(
  account: SendAccountLike,
  parentAccount?: SendAccount | null,
): SendAccount {
  const mainAccount = account.type === "Account" ? account : parentAccount;
  if (!mainAccount) throw new MissingMainAccountError();
  return mainAccount;
}

export function getAccountCurrency(account: SendAccountLike): TokenCurrency | CryptoCurrency {
  const type: string = account.type;
  if (account.type === "TokenAccount") return account.token;
  if (account.type === "Account") return account.currency;
  throw new InvalidAccountTypeError(type);
}

export function isTokenAccount(account: SendAccountLike | undefined): account is SendTokenAccount {
  return account?.type === "TokenAccount";
}

export function encodeOperationId(accountId: string, hash: string, type: string): string {
  return `${accountId}-${hash}-${type}`;
}
