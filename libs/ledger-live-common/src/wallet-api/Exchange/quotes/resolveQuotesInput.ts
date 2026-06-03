import type { Account, AccountLike } from "@ledgerhq/types-live";

import { getAccountIdFromWalletAccountId } from "../../converters";
import type { QuotesInput } from "./types";

export type ResolvedQuotesInput = QuotesInput & {
  sendAddress: string;
  receiveAddress: string;
  sendCurrencyId: string;
  receiveCurrencyId: string;
};

function findAccountByWalletAccountId(
  accounts: AccountLike[],
  walletAccountId: string,
): AccountLike | undefined {
  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  return accountId ? accounts.find(account => account.id === accountId) : undefined;
}

function resolveCurrencyId(account: AccountLike | undefined): string | undefined {
  if (!account) {
    return undefined;
  }
  return account.type === "TokenAccount" ? account.token.id : account.currency.id;
}

function resolveMainAccount(
  account: AccountLike | undefined,
  accounts: AccountLike[],
): Account | undefined {
  if (!account) {
    return undefined;
  }
  if (account.type === "Account") {
    return account;
  }
  return accounts.find(
    (candidate): candidate is Account =>
      candidate.type === "Account" && candidate.id === account.parentId,
  );
}

export function resolveQuotesInput(
  input: QuotesInput,
  accounts: AccountLike[],
): ResolvedQuotesInput | undefined {
  const sendAccount = findAccountByWalletAccountId(accounts, input.sendAccountId);
  const receiveAccount = findAccountByWalletAccountId(accounts, input.receiveAccountId);
  const sendMainAccount = resolveMainAccount(sendAccount, accounts);
  const receiveMainAccount = resolveMainAccount(receiveAccount, accounts);

  const sendCurrencyId = input.sendCurrencyId ?? resolveCurrencyId(sendAccount);
  const receiveCurrencyId = input.receiveCurrencyId ?? resolveCurrencyId(receiveAccount);
  const sendAddress = input.sendAddress ?? sendMainAccount?.freshAddress;
  const receiveAddress = input.receiveAddress ?? receiveMainAccount?.freshAddress;

  if (!sendCurrencyId || !receiveCurrencyId || !sendAddress || !receiveAddress) {
    return undefined;
  }

  const networkFeesCurrencyId = input.networkFeesCurrencyId || sendMainAccount?.currency.id;

  return {
    ...input,
    sendCurrencyId,
    receiveCurrencyId,
    sendAddress,
    receiveAddress,
    ...(networkFeesCurrencyId ? { networkFeesCurrencyId } : {}),
  };
}
