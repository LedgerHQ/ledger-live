import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  AccountId,
  Hbar,
  TokenAssociateTransaction,
  TransactionId,
  TransferTransaction,
} from "@hashgraph/sdk";
import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { HEDERA_TRANSACTION_MODES } from "../constants";
import type { HederaMemo } from "../types";
import { serializeTransaction } from "./utils";

// avoid "sign" prompt loop by having only one node (one transaction)
// https://github.com/LedgerHQ/ledger-live/pull/72/commits/1e942687d4301660e43e0c4b5419fcfa2733b290
// changing this will break `getHederaTransactionBodyBytes` from logic/utils.ts
const nodeAccountIds: AccountId[] = [new AccountId(3)];

interface BuilderOperator {
  accountId: string;
}

interface BuilderCommonTransactionFields {
  maxFee: BigNumber | undefined;
  memo: string;
}

interface BuilderCoinTransferTransaction extends BuilderCommonTransactionFields {
  type: HEDERA_TRANSACTION_MODES.Send;
  amount: BigNumber;
  recipient: string;
}

interface BuilderTokenTransferTransaction extends BuilderCommonTransactionFields {
  type: HEDERA_TRANSACTION_MODES.Send;
  tokenId: string;
  amount: BigNumber;
  recipient: string;
}

interface BuilderTokenAssociateTransaction extends BuilderCommonTransactionFields {
  type: HEDERA_TRANSACTION_MODES.TokenAssociate;
  tokenId: string;
}

async function buildUnsignedCoinTransaction({
  account,
  transaction,
}: {
  account: BuilderOperator;
  transaction: BuilderCoinTransferTransaction;
}): Promise<TransferTransaction> {
  const accountId = account.accountId;
  const hbarAmount = Hbar.fromTinybars(transaction.amount);

  const tx = new TransferTransaction()
    .setNodeAccountIds(nodeAccountIds)
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo)
    .addHbarTransfer(accountId, hbarAmount.negated())
    .addHbarTransfer(transaction.recipient, hbarAmount);

  if (transaction.maxFee) {
    tx.setMaxTransactionFee(Hbar.fromTinybars(transaction.maxFee.toNumber()));
  }

  return tx.freeze();
}

async function buildUnsignedTokenTransaction({
  account,
  transaction,
}: {
  account: BuilderOperator;
  transaction: BuilderTokenTransferTransaction;
}): Promise<TransferTransaction> {
  const accountId = account.accountId;
  const tokenId = transaction.tokenId;

  const tx = new TransferTransaction()
    .setNodeAccountIds(nodeAccountIds)
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo)
    .addTokenTransfer(tokenId, accountId, transaction.amount.negated().toNumber())
    .addTokenTransfer(tokenId, transaction.recipient, transaction.amount.toNumber());

  if (transaction.maxFee) {
    tx.setMaxTransactionFee(Hbar.fromTinybars(transaction.maxFee.toNumber()));
  }

  return tx.freeze();
}

async function buildTokenAssociateTransaction({
  account,
  transaction,
}: {
  account: BuilderOperator;
  transaction: BuilderTokenAssociateTransaction;
}): Promise<TokenAssociateTransaction> {
  const accountId = account.accountId;

  const tx = new TokenAssociateTransaction()
    .setNodeAccountIds(nodeAccountIds)
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo)
    .setAccountId(accountId)
    .setTokenIds([transaction.tokenId]);

  if (transaction.maxFee) {
    tx.setMaxTransactionFee(Hbar.fromTinybars(transaction.maxFee.toNumber()));
  }

  return tx.freeze();
}

export async function craftTransaction(
  txIntent: TransactionIntent<HederaMemo>,
  customFees?: FeeEstimation,
) {
  const account = {
    accountId: txIntent.sender,
  };

  let tx;

  if (txIntent.type === HEDERA_TRANSACTION_MODES.TokenAssociate) {
    invariant(txIntent.asset.type !== "native", "hedera: invalid asset type");
    invariant("assetReference" in txIntent.asset, "hedera: assetReference is missing");

    tx = await buildTokenAssociateTransaction({
      account,
      transaction: {
        type: txIntent.type,
        tokenId: txIntent.asset.assetReference,
        memo: txIntent.memo.value,
        maxFee: customFees ? new BigNumber(customFees.value.toString()) : undefined,
      },
    });
  } else if (txIntent.type === HEDERA_TRANSACTION_MODES.Send && txIntent.asset.type !== "native") {
    invariant("assetReference" in txIntent.asset, "hedera: no assetReference in token transfer");

    const amount = new BigNumber(txIntent.amount.toString());

    tx = await buildUnsignedTokenTransaction({
      account,
      transaction: {
        type: txIntent.type,
        tokenId: txIntent.asset.assetReference,
        amount,
        recipient: txIntent.recipient,
        memo: txIntent.memo.value,
        maxFee: customFees ? new BigNumber(customFees.value.toString()) : undefined,
      },
    });
  } else {
    const amount = new BigNumber(txIntent.amount.toString());

    tx = await buildUnsignedCoinTransaction({
      account,
      transaction: {
        type: HEDERA_TRANSACTION_MODES.Send,
        amount,
        recipient: txIntent.recipient,
        memo: txIntent.memo.value,
        maxFee: customFees ? new BigNumber(customFees.value.toString()) : undefined,
      },
    });
  }

  const serializedTx = serializeTransaction(tx);

  return { tx, serializedTx };
}
