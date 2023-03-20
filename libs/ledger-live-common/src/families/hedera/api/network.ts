import BigNumber from "bignumber.js";
import * as hedera from "@hashgraph/sdk";
import { Account } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { AccountId } from "@hashgraph/sdk";
import { HederaAddAccountError } from "../errors";

export function broadcastTransaction(
  transaction: hedera.Transaction
): Promise<hedera.TransactionResponse> {
  return transaction.execute(getClient());
}

export async function buildUnsignedTransaction({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<hedera.TransferTransaction> {
  const hbarAmount = hedera.Hbar.fromTinybars(transaction.amount);
  const accountId = account.freshAddress;

  return new hedera.TransferTransaction()
    .setNodeAccountIds([new AccountId(3)])
    .setTransactionId(hedera.TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo ?? "")
    .addHbarTransfer(accountId, hbarAmount.negated())
    .addHbarTransfer(transaction.recipient, hbarAmount)
    .freeze();
}

export interface AccountBalance {
  balance: BigNumber;
}

export async function getAccountBalance(
  address: string
): Promise<AccountBalance> {
  const accountId = AccountId.fromString(address);
  let accountBalance;

  try {
    accountBalance = await new hedera.AccountBalanceQuery({
      accountId,
    }).execute(getBalanceClient());
  } catch {
    throw new HederaAddAccountError();
  }

  return {
    balance: accountBalance.hbars.to(hedera.HbarUnit.Tinybar),
  };
}

let _hederaClient: hedera.Client | null = null;

let _hederaBalanceClient: hedera.Client | null = null;

function getClient(): hedera.Client {
  _hederaClient ??= hedera.Client.forMainnet().setMaxNodesPerTransaction(1);

  //_hederaClient.setNetwork({ mainnet: "https://hedera.coin.ledger.com" });

  return _hederaClient;
}

function getBalanceClient(): hedera.Client {
  _hederaBalanceClient ??= hedera.Client.forMainnet();

  return _hederaBalanceClient;
}
