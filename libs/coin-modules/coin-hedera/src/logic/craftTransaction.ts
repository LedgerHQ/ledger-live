import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  AccountId,
  AccountUpdateTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Hbar,
  TokenAssociateTransaction,
  TransactionId,
  TransferTransaction,
} from "@hashgraph/sdk";
import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { DEFAULT_GAS_LIMIT, HEDERA_TRANSACTION_MODES } from "../constants";
import { rpcClient } from "../network/rpc";
import type { HederaMemo, HederaTxData } from "../types";
import { hasSpecificIntentData, serializeTransaction } from "./utils";

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

interface BuilderHTSTokenTransferTransaction extends BuilderCommonTransactionFields {
  type: HEDERA_TRANSACTION_MODES.Send;
  tokenAddress: string;
  amount: BigNumber;
  recipient: string;
}

interface BuilderERC20TokenTransferTransaction extends BuilderCommonTransactionFields {
  type: HEDERA_TRANSACTION_MODES.Send;
  tokenAddress: string;
  amount: BigNumber;
  recipient: string;
  gasLimit: BigNumber;
}

interface BuilderTokenAssociateTransaction extends BuilderCommonTransactionFields {
  type: HEDERA_TRANSACTION_MODES.TokenAssociate;
  tokenId: string;
}

interface BuilderUpdateAccountTransaction extends BuilderCommonTransactionFields {
  type:
    | HEDERA_TRANSACTION_MODES.Delegate
    | HEDERA_TRANSACTION_MODES.Undelegate
    | HEDERA_TRANSACTION_MODES.Redelegate;
  stakingNodeId: number | null | undefined;
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
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo)
    .addHbarTransfer(accountId, hbarAmount.negated())
    .addHbarTransfer(transaction.recipient, hbarAmount);

  if (transaction.maxFee) {
    tx.setMaxTransactionFee(Hbar.fromTinybars(transaction.maxFee.toNumber()));
  }

  return tx.freezeWith(rpcClient.getInstance());
}

async function buildUnsignedHTSTokenTransaction({
  account,
  transaction,
}: {
  account: BuilderOperator;
  transaction: BuilderHTSTokenTransferTransaction;
}): Promise<TransferTransaction> {
  const accountId = account.accountId;
  const tokenId = transaction.tokenAddress;

  const tx = new TransferTransaction()
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo)
    .addTokenTransfer(tokenId, accountId, transaction.amount.negated().toNumber())
    .addTokenTransfer(tokenId, transaction.recipient, transaction.amount.toNumber());

  if (transaction.maxFee) {
    tx.setMaxTransactionFee(Hbar.fromTinybars(transaction.maxFee.toNumber()));
  }

  return tx.freezeWith(rpcClient.getInstance());
}

async function buildUnsignedERC20TokenTransaction({
  account,
  transaction,
}: {
  account: BuilderOperator;
  transaction: BuilderERC20TokenTransferTransaction;
}): Promise<ContractExecuteTransaction> {
  const accountId = AccountId.fromString(account.accountId);
  const contractId = ContractId.fromEvmAddress(0, 0, transaction.tokenAddress);
  const recipientEvmAddress = AccountId.fromString(transaction.recipient).toSolidityAddress();
  const gas = transaction.gasLimit.toNumber();

  // create function parameters for ERC20 transfer function
  // transfer(address to, uint256 amount) returns (bool)
  const functionParameters = new ContractFunctionParameters()
    .addAddress(recipientEvmAddress)
    .addUint256(transaction.amount.toNumber());

  const tx = new ContractExecuteTransaction()
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo ?? "")
    .setContractId(contractId)
    .setGas(gas)
    .setFunction("transfer", functionParameters);

  if (transaction.maxFee) {
    tx.setMaxTransactionFee(Hbar.fromTinybars(transaction.maxFee.toNumber()));
  }

  return tx.freezeWith(rpcClient.getInstance());
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
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo)
    .setAccountId(accountId)
    .setTokenIds([transaction.tokenId]);

  if (transaction.maxFee) {
    tx.setMaxTransactionFee(Hbar.fromTinybars(transaction.maxFee.toNumber()));
  }

  return tx.freezeWith(rpcClient.getInstance());
}

async function buildUnsignedUpdateAccountTransaction({
  account,
  transaction,
}: {
  account: BuilderOperator;
  transaction: BuilderUpdateAccountTransaction;
}): Promise<AccountUpdateTransaction> {
  const accountId = account.accountId;

  const tx = new AccountUpdateTransaction()
    .setTransactionId(TransactionId.generate(accountId))
    .setTransactionMemo(transaction.memo ?? "")
    .setAccountId(accountId);

  if (transaction.maxFee) {
    tx.setMaxTransactionFee(Hbar.fromTinybars(transaction.maxFee.toNumber()));
  }

  if (typeof transaction.stakingNodeId === "number") {
    tx.setStakedNodeId(transaction.stakingNodeId);
  }

  if (transaction.stakingNodeId === null) {
    tx.clearStakedNodeId();
  }

  return tx.freezeWith(rpcClient.getInstance());
}

export async function craftTransaction(
  txIntent: TransactionIntent<HederaMemo, HederaTxData>,
  customFees?: FeeEstimation,
) {
  const account = { accountId: txIntent.sender };
  const maxFee = customFees ? new BigNumber(customFees.value.toString()) : undefined;

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
        maxFee,
      },
    });
  } else if (txIntent.type === HEDERA_TRANSACTION_MODES.Send && txIntent.asset.type === "hts") {
    invariant("assetReference" in txIntent.asset, "hedera: no assetReference in token transfer");

    const amount = new BigNumber(txIntent.amount.toString());

    tx = await buildUnsignedHTSTokenTransaction({
      account,
      transaction: {
        type: txIntent.type,
        tokenAddress: txIntent.asset.assetReference,
        amount,
        recipient: txIntent.recipient,
        memo: txIntent.memo.value,
        maxFee,
      },
    });
  } else if (txIntent.type === HEDERA_TRANSACTION_MODES.Send && txIntent.asset.type === "erc20") {
    invariant("assetReference" in txIntent.asset, "hedera: no assetReference in token transfer");

    const amount = new BigNumber(txIntent.amount.toString());
    const gasLimit = hasSpecificIntentData(txIntent, "erc20")
      ? new BigNumber(txIntent.data.gasLimit.toString())
      : DEFAULT_GAS_LIMIT;

    tx = await buildUnsignedERC20TokenTransaction({
      account,
      transaction: {
        type: txIntent.type,
        tokenAddress: txIntent.asset.assetReference,
        amount,
        recipient: txIntent.recipient,
        memo: txIntent.memo.value,
        maxFee,
        gasLimit,
      },
    });
  } else if (
    txIntent.type === HEDERA_TRANSACTION_MODES.Redelegate ||
    txIntent.type === HEDERA_TRANSACTION_MODES.Undelegate ||
    txIntent.type === HEDERA_TRANSACTION_MODES.Delegate
  ) {
    const stakingNodeId = hasSpecificIntentData(txIntent, "staking")
      ? txIntent.data.stakingNodeId
      : undefined;

    tx = await buildUnsignedUpdateAccountTransaction({
      account,
      transaction: {
        type: txIntent.type,
        memo: txIntent.memo.value,
        maxFee,
        stakingNodeId,
      },
    });
  }
  // HEDERA_TRANSACTION_MODES.ClaimRewards is just a coin transfer that triggers staking rewards claim
  else {
    const amount = new BigNumber(txIntent.amount.toString());

    tx = await buildUnsignedCoinTransaction({
      account,
      transaction: {
        type: HEDERA_TRANSACTION_MODES.Send,
        amount,
        recipient: txIntent.recipient,
        memo: txIntent.memo.value,
        maxFee,
      },
    });
  }

  const serializedTx = serializeTransaction(tx);

  return { tx, serializedTx };
}
