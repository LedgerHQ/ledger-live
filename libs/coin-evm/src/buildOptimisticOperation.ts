import eip55 from "eip55";
import BigNumber from "bignumber.js";
import { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import {
  encodeERC1155OperationId,
  encodeERC721OperationId,
} from "@ledgerhq/coin-framework/nft/nftOperationId";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { EvmNftTransaction, Transaction as EvmTransaction } from "./types";
import { getEstimatedFees, isNftTransaction } from "./logic";
import { toTransactionRaw } from "./transaction";

/**
 * Build an optimistic operation for the coin of the integration (e.g. Ether for Ethereum)
 */
export const buildOptimisticCoinOperation = (
  account: Account,
  transaction: EvmTransaction,
  transactionType?: OperationType,
): Operation => {
  const type = transactionType ?? "OUT";
  const estimatedFees = getEstimatedFees(transaction);
  const value = transaction.amount.plus(estimatedFees);

  // keys marked with a <-- will be updated by the broadcast method
  const operation: Operation = {
    id: encodeOperationId(account.id, "", type), // <--
    hash: "", // <--
    type,
    value,
    fee: estimatedFees,
    blockHash: null,
    blockHeight: null,
    senders: [eip55.encode(account.freshAddress)],
    recipients: [eip55.encode(transaction.recipient)],
    accountId: account.id,
    transactionSequenceNumber: transaction.nonce,
    subOperations: [],
    nftOperations: [],
    date: new Date(),
    extra: {},
    transactionRaw: toTransactionRaw(transaction), // to allow edit / cancel flows
  };

  return operation;
};

/**
 * Build an optimistic operation for an ERC20 transaction
 */
export const buildOptimisticTokenOperation = (
  account: Account,
  tokenAccount: TokenAccount,
  transaction: EvmTransaction,
): Operation => {
  const type = "OUT";
  const estimatedFees = getEstimatedFees(transaction);
  const value = transaction.useAllAmount ? tokenAccount.balance : transaction.amount;

  const coinOperation = buildOptimisticCoinOperation(
    account,
    {
      ...transaction,
      recipient: tokenAccount.token.contractAddress,
      amount: new BigNumber(0),
    },
    "FEES",
  );
  // keys marked with a <-- will be updated by the broadcast method
  const operation: Operation = {
    ...coinOperation,
    subOperations: [
      {
        id: encodeOperationId(tokenAccount.id, "", type), // <--
        hash: "", // <--
        type,
        value,
        fee: estimatedFees,
        blockHash: null,
        blockHeight: null,
        senders: [eip55.encode(account.freshAddress)],
        recipients: [eip55.encode(transaction.recipient)],
        accountId: tokenAccount.id,
        transactionSequenceNumber: transaction.nonce,
        date: new Date(),
        extra: {},
        contract: tokenAccount.token.contractAddress,
        transactionRaw: toTransactionRaw(transaction),
      },
    ],
  };

  return operation;
};

/**
 * Build an optimistic operation for an ERC721 or ERC1155 transaction
 */
export const buildOptimisticNftOperation = (
  account: Account,
  transaction: EvmNftTransaction & EvmTransaction,
): Operation => {
  const type = "NFT_OUT";
  const estimatedFees = getEstimatedFees(transaction);
  const { nft } = transaction;
  const value = nft.quantity;

  const coinOperation = buildOptimisticCoinOperation(
    account,
    {
      ...transaction,
      recipient: nft.contract,
      amount: new BigNumber(0),
    },
    "FEES",
  );

  const nftId = encodeNftId(account.id, nft.contract, nft.tokenId, account.currency.id);
  const nftOpId =
    transaction.mode === "erc721"
      ? encodeERC721OperationId(nftId, "", type, 0)
      : encodeERC1155OperationId(nftId, "", type, 0);

  // keys marked with a <-- will be updated by the broadcast method
  const operation: Operation = {
    ...coinOperation,
    nftOperations: [
      {
        id: nftOpId, // <--
        hash: "", // <--
        type,
        value,
        fee: estimatedFees,
        blockHash: null,
        blockHeight: null,
        senders: [eip55.encode(account.freshAddress)],
        recipients: [eip55.encode(transaction.recipient)],
        accountId: account.id,
        transactionSequenceNumber: transaction.nonce,
        date: new Date(),
        extra: {},
        contract: nft.contract,
        standard: transaction.mode.toUpperCase(),
        tokenId: nft.tokenId,
        transactionRaw: toTransactionRaw(transaction),
      },
    ],
  };

  return operation;
};

/**
 * Create a temporary operation to use until it's confirmed by the blockchain
 */
export const buildOptimisticOperation = (
  account: Account,
  transaction: EvmTransaction,
): Operation => {
  if (isNftTransaction(transaction)) {
    return buildOptimisticNftOperation(account, transaction);
  }

  const subAccount = findSubAccountById(account, transaction?.subAccountId || "");
  const isTokenTransaction = subAccount?.type === "TokenAccount";

  return isTokenTransaction
    ? buildOptimisticTokenOperation(account, subAccount, transaction)
    : buildOptimisticCoinOperation(account, transaction);
};

export default buildOptimisticOperation;
