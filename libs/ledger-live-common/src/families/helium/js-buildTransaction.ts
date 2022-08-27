import { PaymentV2, TokenBurnV1 } from "@helium/transactions";
import type { SendTransaction, Transaction, BurnTransaction } from "./types";
import type { Account } from "@ledgerhq/types-live";
import { getNonce } from "./logic";
import Address from "@helium/address";
import { getFees } from "./api";

const getTokenType = (subAccountId: string | null | undefined) => {
  if (subAccountId?.includes("MOBILE")) {
    return "mobile";
  }

  return "hnt";
};

/**
 *
 * @param a account
 * @param t transaction
 * @returns PaymentV2 object
 */
export const buildPaymentV2Txn = async (
  a: Account,
  t: Transaction
): Promise<PaymentV2> => {
  const nonce = await getNonce(a.freshAddress, a.currency);
  const { dc } = await getFees("payment_v2", a.currency);
  const sendTransaction = t.model as SendTransaction;

  return new PaymentV2({
    payer: Address.fromB58(a.freshAddress),
    payments: [
      {
        tokenType: getTokenType(t.subAccountId),
        payee: Address.fromB58(t.recipient),
        amount: t.amount.toNumber(),
        memo: sendTransaction.memo,
      },
    ],
    nonce,
    fee: dc.toNumber(),
  });
};

/**
 *
 * @param a account
 * @param t
 * @returns
 */
export const buildBurnTransactionV1Txn = async (
  a: Account,
  t: Transaction
): Promise<TokenBurnV1> => {
  const nonce = await getNonce(a.freshAddress, a.currency);
  const { dc } = await getFees("token_burn_v1", a.currency);
  const burnTransaction = t.model as BurnTransaction;

  return new TokenBurnV1({
    payer: Address.fromB58(a.freshAddress),
    payee: Address.fromB58(burnTransaction.payee),
    amount: t.amount.toNumber(),
    nonce,
    memo: burnTransaction.memo,
    fee: dc.toNumber(),
  });
};
