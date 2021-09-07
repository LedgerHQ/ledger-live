import BigNumber from "bignumber.js";
import * as hedera from "@hashgraph/sdk";
import { Account } from "../../../types";
import { Transaction } from "../types";
import { calculateAmount } from "../utils";

export function broadcastTransaction(transaction: hedera.Transaction): Promise<hedera.TransactionResponse> {
  return transaction.execute(getClient());
}

export function buildUnsignedTransaction({ account, transaction }: {
  account: Account,
  transaction: Transaction,
}): hedera.TransferTransaction {
  let { amount } = calculateAmount({ account, transaction });
  let hbarAmount = hedera.Hbar.fromTinybars(amount);

  return new hedera.TransferTransaction()
    .setTransactionId(hedera.TransactionId.generate(account.seedIdentifier))
    .addHbarTransfer(account.seedIdentifier, hbarAmount.negated())
    .addHbarTransfer(transaction.recipient, hbarAmount)
    .freezeWith(getClient());
}

export interface AccountBalance {
  balance: BigNumber;
}

export async function getAccountBalance(accountId: string): Promise<AccountBalance> {
  let accountBalance = await new hedera.AccountBalanceQuery({ accountId }).execute(getClient());

  return {
      balance: accountBalance.hbars.to(hedera.HbarUnit.Tinybar),
  };
}

let _hederaClient: hedera.Client | null = null;

function getClient(): hedera.Client {
  _hederaClient ??= hedera.Client.forMainnet()
    .setMaxNodesPerTransaction(1);

  return _hederaClient;
}
