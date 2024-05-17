import BigNumber from "bignumber.js";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { TezosAccount, Transaction } from "../types";
import prepareTransaction from "./prepareTransaction";
import createTransaction from "./createTransaction";
import { getTransactionStatus } from "./transactionStatus";

const TEZOS_BURN_ADDRESS = "tz1burnburnburnburnburnburnburjAYjjX";

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | undefined;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount) as TezosAccount;
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(),
    ...transaction,
    // estimate using a burn address that exists so we don't enter into NotEnoughBalanceBecauseDestinationNotCreated
    recipient: transaction?.recipient || TEZOS_BURN_ADDRESS,
    useAllAmount: true,
  });
  const s = await getTransactionStatus(mainAccount, t);
  return s.amount;
};

export default estimateMaxSpendable;
