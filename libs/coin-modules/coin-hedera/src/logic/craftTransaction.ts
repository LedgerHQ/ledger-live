import BigNumber from "bignumber.js";
import {
  FeeEstimation,
  IncorrectTypeError,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { HederaMemo } from "../types";
import { isHederaTransactionType } from "../logic";
import {
  AccountId,
  Hbar,
  TokenAssociateTransaction,
  TransactionId,
  TransferTransaction,
} from "@hashgraph/sdk";
import { HEDERA_OPERATION_TYPES } from "../constants";
import invariant from "invariant";

// https://github.com/LedgerHQ/ledger-live/pull/72/commits/1e942687d4301660e43e0c4b5419fcfa2733b290
const nodeAccountIds: AccountId[] = [new AccountId(3)];

interface BuilderOperator {
  accountId: string;
}

interface BuilderCommonTransactionFields {
  maxFee: BigNumber | undefined;
  memo: string | undefined;
}

interface BuilderCoinTransferTransaction extends BuilderCommonTransactionFields {
  type: HEDERA_OPERATION_TYPES.CryptoTransfer;
  amount: BigNumber;
  recipient: string;
}

interface BuilderTokenTransferTransaction extends BuilderCommonTransactionFields {
  type: HEDERA_OPERATION_TYPES.TokenTransfer;
  tokenId: string;
  amount: BigNumber;
  recipient: string;
}

interface BuilderTokenAssociateTransaction extends BuilderCommonTransactionFields {
  type: HEDERA_OPERATION_TYPES.TokenAssociate;
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

  return new TransferTransaction()
    .setNodeAccountIds(nodeAccountIds)
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo ?? "")
    .addHbarTransfer(accountId, hbarAmount.negated())
    .addHbarTransfer(transaction.recipient, hbarAmount)
    .freeze();
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

  return new TransferTransaction()
    .setNodeAccountIds(nodeAccountIds)
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo ?? "")
    .addTokenTransfer(tokenId, accountId, transaction.amount.negated().toNumber())
    .addTokenTransfer(tokenId, transaction.recipient, transaction.amount.toNumber())
    .freeze();
}

async function buildTokenAssociateTransaction({
  account,
  transaction,
}: {
  account: BuilderOperator;
  transaction: BuilderTokenAssociateTransaction;
}): Promise<TokenAssociateTransaction> {
  const accountId = account.accountId;

  return new TokenAssociateTransaction()
    .setNodeAccountIds(nodeAccountIds)
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo ?? "")
    .setAccountId(accountId)
    .setTokenIds([transaction.tokenId])
    .freeze();
}

export async function craftTransaction(
  txIntent: TransactionIntent<HederaMemo>,
  customFees?: FeeEstimation,
) {
  if (!isHederaTransactionType(txIntent.type)) {
    throw new IncorrectTypeError(`unsupported hedera tx type - ${txIntent.type}`);
  }

  const account = {
    accountId: txIntent.sender,
  };

  let tx;

  if (txIntent.type === HEDERA_OPERATION_TYPES.TokenAssociate) {
    invariant(txIntent.asset.type === "token", "hedera: invalid asset type");
    invariant(!!txIntent.asset.assetReference, "hedera: assetReference is missing");

    tx = await buildTokenAssociateTransaction({
      account,
      transaction: {
        type: txIntent.type,
        tokenId: txIntent.asset.assetReference,
        memo: txIntent.memo?.toString(),
        maxFee: customFees ? new BigNumber(customFees.value.toString()) : undefined,
      },
    });
  } else if (txIntent.type === HEDERA_OPERATION_TYPES.TokenTransfer) {
    invariant(txIntent.asset.type === "token", "hedera: invalid asset type");
    invariant(!!txIntent.asset.assetReference, "hedera: assetReference is missing");

    tx = await buildUnsignedTokenTransaction({
      account,
      transaction: {
        type: txIntent.type,
        tokenId: txIntent.asset.assetReference,
        amount: new BigNumber(txIntent.amount.toString()),
        recipient: txIntent.recipient,
        memo: txIntent.memo?.toString(),
        maxFee: customFees ? new BigNumber(customFees.value.toString()) : undefined,
      },
    });
  } else {
    tx = await buildUnsignedCoinTransaction({
      account,
      transaction: {
        type: txIntent.type,
        amount: new BigNumber(txIntent.amount.toString()),
        recipient: txIntent.recipient,
        memo: txIntent.memo?.toString(),
        maxFee: customFees ? new BigNumber(customFees.value.toString()) : undefined,
      },
    });
  }

  const serializedTx = Buffer.from(tx.toBytes()).toString("hex");

  return { tx, serializedTx };
}
