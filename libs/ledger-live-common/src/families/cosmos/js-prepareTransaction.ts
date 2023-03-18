import { CosmosAccount, Transaction } from "./types";
import BigNumber from "bignumber.js";
import { getMaxEstimatedBalance } from "./logic";
import { CacheRes, makeLRUCache } from "../../cache";
import type { Account } from "@ledgerhq/types-live";
import cryptoFactory from "./chain/chain";

export const calculateFees: CacheRes<
  Array<{
    account: Account;
    transaction: Transaction;
  }>,
  {
    estimatedFees: BigNumber;
    estimatedGas: BigNumber;
  }
> = makeLRUCache(
  async ({
    account,
    transaction,
  }): Promise<{
    estimatedFees: BigNumber;
    estimatedGas: BigNumber;
  }> => {
    return await getEstimatedFees(account as CosmosAccount, transaction);
  },
  ({ account, transaction }) =>
    `${account.id}_${account.currency.id}_${transaction.amount.toString()}_${
      transaction.recipient
    }_${String(transaction.useAllAmount)}_${transaction.mode}_${
      transaction.validators
        ? transaction.validators.map((v) => v.address).join("-")
        : ""
    }_${transaction.memo ? transaction.memo.toString() : ""}_${
      transaction.sourceValidator ? transaction.sourceValidator : ""
    }`
);

const getEstimatedFees = async (
  account: CosmosAccount,
  transaction: Transaction
): Promise<any> => {
  const cosmosCurrency = cryptoFactory(account.currency.id);
  let estimatedGas = new BigNumber(cosmosCurrency.defaultGas);
  if (cosmosCurrency.gas[transaction.mode]) {
    estimatedGas = new BigNumber(cosmosCurrency.gas[transaction.mode]);
  }
  const estimatedFees = estimatedGas.times(cosmosCurrency.minGasprice);
  return { estimatedFees, estimatedGas };
};

export const prepareTransaction = async (
  account: Account,
  transaction: Transaction
): Promise<Transaction> => {
  let memo = transaction.memo;
  let amount = transaction.amount;

  if (transaction.mode !== "send" && !transaction.memo) {
    memo = "Ledger Live";
  }

  const { estimatedFees, estimatedGas } = await calculateFees({
    account,
    transaction: {
      ...transaction,
      amount: transaction.useAllAmount
        ? account.spendableBalance.minus(new BigNumber(2500))
        : amount,
      memo,
    },
  });

  if (transaction.useAllAmount) {
    amount = getMaxEstimatedBalance(account as CosmosAccount, estimatedFees);
  }

  if (
    transaction.memo !== memo ||
    !estimatedFees.eq(transaction.fees || new BigNumber(0)) ||
    !estimatedGas.eq(transaction.gas || new BigNumber(0)) ||
    !amount.eq(transaction.amount)
  ) {
    return {
      ...transaction,
      memo,
      fees: estimatedFees,
      gas: estimatedGas,
      amount,
    };
  }

  return transaction;
};

export default prepareTransaction;
