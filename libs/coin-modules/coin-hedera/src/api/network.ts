import invariant from "invariant";
import type { Transaction as HederaTransaction, TransactionResponse } from "@hashgraph/sdk";
import {
  Client,
  TransferTransaction,
  Hbar,
  AccountId,
  TransactionId,
  TokenAssociateTransaction,
} from "@hashgraph/sdk";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/helpers";
import { safeParseAccountId } from "../bridge/utils";
import { Transaction } from "../types";
import { isTokenAssociateTransaction } from "../logic";

export function broadcastTransaction(transaction: HederaTransaction): Promise<TransactionResponse> {
  return transaction.execute(getHederaClient());
}

// https://github.com/LedgerHQ/ledger-live/pull/72/commits/1e942687d4301660e43e0c4b5419fcfa2733b290
const nodeAccountIds: AccountId[] = [new AccountId(3)];

async function buildUnsignedCoinTransaction({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<TransferTransaction> {
  const accountId = account.freshAddress;
  const hbarAmount = Hbar.fromTinybars(transaction.amount);
  const [_, recipientAddress] = safeParseAccountId(transaction.recipient);
  const recipientWithoutChecksum = recipientAddress?.accountId ?? transaction.recipient;

  return new TransferTransaction()
    .setNodeAccountIds(nodeAccountIds)
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo ?? "")
    .addHbarTransfer(accountId, hbarAmount.negated())
    .addHbarTransfer(recipientWithoutChecksum, hbarAmount)
    .freeze();
}

async function buildUnsignedTokenTransaction({
  account,
  tokenAccount,
  transaction,
}: {
  account: Account;
  tokenAccount: TokenAccount;
  transaction: Transaction;
}): Promise<TransferTransaction> {
  const accountId = account.freshAddress;
  const tokenId = tokenAccount.token.contractAddress;
  const [_, recipientAddress] = safeParseAccountId(transaction.recipient);
  const recipientWithoutChecksum = recipientAddress?.accountId ?? transaction.recipient;

  return new TransferTransaction()
    .setNodeAccountIds(nodeAccountIds)
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo ?? "")
    .addTokenTransfer(tokenId, accountId, transaction.amount.negated().toNumber())
    .addTokenTransfer(tokenId, recipientWithoutChecksum, transaction.amount.toNumber())
    .freeze();
}

async function buildTokenAssociateTransaction({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<TokenAssociateTransaction> {
  invariant(isTokenAssociateTransaction(transaction), "invalid transaction properties");

  const accountId = account.freshAddress;

  return new TokenAssociateTransaction()
    .setNodeAccountIds(nodeAccountIds)
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo ?? "")
    .setAccountId(accountId)
    .setTokenIds([transaction.properties.token.contractAddress])
    .freeze();
}

export async function buildUnsignedTransaction({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<TransferTransaction | TokenAssociateTransaction> {
  const subAccount = findSubAccountById(account, transaction?.subAccountId || "");
  const isTokenTransaction = isTokenAccount(subAccount);

  if (isTokenAssociateTransaction(transaction)) {
    return buildTokenAssociateTransaction({ account, transaction });
  } else if (isTokenTransaction) {
    return buildUnsignedTokenTransaction({ account, tokenAccount: subAccount, transaction });
  } else {
    return buildUnsignedCoinTransaction({ account, transaction });
  }
}

let _hederaClient: Client | null = null;

export function getHederaClient(): Client {
  _hederaClient ??= Client.forMainnet().setMaxNodesPerTransaction(1);

  //_hederaClient.setNetwork({ mainnet: "https://hedera.coin.ledger.com" });

  return _hederaClient;
}
