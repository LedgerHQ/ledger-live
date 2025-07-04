import BigNumber from "bignumber.js";
import invariant from "invariant";
import type { Transaction as HederaTransaction, TransactionResponse } from "@hashgraph/sdk";
import {
  Client,
  TransferTransaction,
  Hbar,
  AccountId,
  TransactionId,
  AccountBalanceQuery,
  HbarUnit,
  AccountUpdateTransaction,
} from "@hashgraph/sdk";
import type { Account } from "@ledgerhq/types-live";
import { HederaAddAccountError } from "../errors";
import { Transaction } from "../types";
import { isStakingTransaction } from "../logic";

export function broadcastTransaction(transaction: HederaTransaction): Promise<TransactionResponse> {
  return transaction.execute(getClient());
}

async function buildUnsignedCoinTransaction({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<TransferTransaction> {
  const accountId = account.freshAddress;
  const hbarAmount = Hbar.fromTinybars(transaction.amount);

  return new TransferTransaction()
    .setNodeAccountIds([new AccountId(3)])
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo ?? "")
    .addHbarTransfer(accountId, hbarAmount.negated())
    .addHbarTransfer(transaction.recipient, hbarAmount)
    .freeze();
}

async function buildUnsignedUpdateAccountTransaction({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<AccountUpdateTransaction> {
  invariant(isStakingTransaction(transaction), "invalid transaction properties");

  const accountId = account.freshAddress;
  const tx = new AccountUpdateTransaction()
    .setNodeAccountIds([new AccountId(3)])
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo ?? "")
    .setAccountId(accountId);

  if (typeof transaction.properties.stakedNodeId === "number") {
    tx.setStakedNodeId(transaction.properties.stakedNodeId);
  }

  if (transaction.properties.stakedNodeId === null) {
    tx.clearStakedNodeId();
  }

  tx.freeze();

  return tx;
}

export async function buildUnsignedTransaction({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<TransferTransaction | AccountUpdateTransaction> {
  if (isStakingTransaction(transaction)) {
    return transaction.properties.mode === "claimRewards"
      ? buildUnsignedCoinTransaction({ account, transaction })
      : buildUnsignedUpdateAccountTransaction({ account, transaction });
  } else {
    return buildUnsignedCoinTransaction({ account, transaction });
  }
}

export interface AccountBalance {
  balance: BigNumber;
}

export async function getAccountBalance(address: string): Promise<AccountBalance> {
  const accountId = AccountId.fromString(address);
  let accountBalance;

  try {
    accountBalance = await new AccountBalanceQuery({
      accountId,
    }).execute(getBalanceClient());
  } catch {
    throw new HederaAddAccountError();
  }

  return {
    balance: accountBalance.hbars.to(HbarUnit.Tinybar),
  };
}

let _hederaClient: Client | null = null;

let _hederaBalanceClient: Client | null = null;

function getClient(): Client {
  _hederaClient ??= Client.forMainnet().setMaxNodesPerTransaction(1);

  //_hederaClient.setNetwork({ mainnet: "https://hedera.coin.ledger.com" });

  return _hederaClient;
}

function getBalanceClient(): Client {
  _hederaBalanceClient ??= Client.forMainnet();

  return _hederaBalanceClient;
}
