import BigNumber from "bignumber.js";
import * as hedera from "@hashgraph/sdk";
import { Account } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { AccountId } from "@hashgraph/sdk";
import { HederaAddAccountError } from "../errors";

export function broadcastTransaction(
  transaction: hedera.Transaction,
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

export async function getAccountBalance(address: string): Promise<AccountBalance> {
  const accountId = AccountId.fromString(address);
  let accountBalance;

  try {
    accountBalance = await new hedera.AccountBalanceQuery({
      accountId,
    }).execute(getClient());
  } catch {
    throw new HederaAddAccountError();
  }

  return {
    balance: accountBalance.hbars.to(hedera.HbarUnit.Tinybar),
  };
}

let _hederaClient: hedera.Client | null = null;

function getClient(): hedera.Client {
  const nodes = {
    "https://hedera-edf.coin.ledger.com:443": new AccountId(21),
    "https://hedera-nomura.coin.ledger.com:443": new AccountId(7),
    "https://hedera-ubisoft.coin.ledger.com:443": new AccountId(28),
  }
  _hederaClient ??= hedera.Client.forMainnet();
  _hederaClient.setNetwork(nodes);

  return _hederaClient;
}
