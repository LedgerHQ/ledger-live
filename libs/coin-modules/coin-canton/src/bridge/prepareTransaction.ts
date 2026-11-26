import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CantonContext } from "../config";
import { estimateFees, estimateSendMax } from "../logic/estimateFees";
import { getCalTokensCached } from "../network/gateway";
import { Transaction } from "../types";
import { getCurrencyContext } from "./context";
import { updateTransaction } from "./updateTransaction";

type CantonTokenAccount = TokenAccount & {
  cantonResources: { instrumentAdmin: string };
};

const estimateFee = async (context: CantonContext, amount: BigNumber): Promise<BigNumber> =>
  BigNumber((await estimateFees(context, BigInt(amount.toFixed()))).toString());

export const prepareTransaction = async (
  context: CantonContext,
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  const currencyContext = getCurrencyContext(context, account.currency);
  const isTokenTransaction = !!transaction.subAccountId;
  const subAccount = isTokenTransaction
    ? account.subAccounts?.find(
        (sub): sub is CantonTokenAccount =>
          sub.type === "TokenAccount" && sub.id === transaction.subAccountId,
      )
    : undefined;

  let amount = transaction.amount || BigNumber(0);
  let fee: BigNumber;
  if (transaction.useAllAmount && !isTokenTransaction) {
    const max = await estimateSendMax(currencyContext, BigInt(account.spendableBalance.toFixed()));
    amount = BigNumber(max.amount.toString());
    fee = BigNumber(max.fee.toString());
  } else {
    // The parent account pays a token's fee in CC, so a token's Send max is its whole balance.
    if (transaction.useAllAmount) amount = subAccount?.spendableBalance ?? BigNumber(0);
    fee = await estimateFee(currencyContext, amount);
  }

  let tokenId = transaction.tokenId;
  let instrumentAdmin: string | undefined;
  if (subAccount) {
    const calTokens = await getCalTokensCached(
      await context.config(account.currency.id),
      account.currency.id,
    );
    tokenId = calTokens.get(subAccount.token.id) || subAccount.token.name;
    instrumentAdmin = subAccount.token.contractAddress;
  }

  // Native when no token is chosen. A token account that is gone sets no asset: the status and the signing block the send.
  if (!tokenId && !transaction.subAccountId) {
    tokenId = (await context.config(account.currency.id)).nativeInstrumentId;
  }

  return updateTransaction(transaction, {
    fee,
    tokenId,
    ...(instrumentAdmin ? { instrumentAdmin } : {}),
    ...(transaction.useAllAmount ? { amount } : {}),
  });
};
