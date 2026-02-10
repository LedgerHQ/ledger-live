import type {
  Block,
  BlockInfo,
  Cursor,
  Page,
  Validator,
  Stake,
  Reward,
  FeeEstimation,
  Operation,
  Pagination,
  CraftedTransaction,
  TransactionIntent,
  MemoNotSupported,
  Balance,
  TransactionValidation,
} from "@ledgerhq/coin-framework/api/index";
import { isSendTransactionIntent } from "@ledgerhq/coin-framework/utils";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
  validateIntent,
  getSequence as logicGetSequence,
  Methods,
} from "../logic";
import { convertAddressEthToFil } from "../network/addresses";
import { encodeTxnParams, generateTokenTxnParams } from "../erc20/tokenAccounts";
import type { FilecoinApi, FilecoinApiConfig } from "./types";
import type {
  ListOperationsOptions,
  FilecoinFeeEstimation,
  CraftTransactionInput,
} from "../types/model";
import BigNumber from "bignumber.js";

/**
 * Create a Filecoin API instance.
 *
 * @param _config - Optional configuration (currently unused, uses env vars)
 * @returns FilecoinApi instance implementing the Alpaca API interface
 */
export function createApi(_config?: FilecoinApiConfig): FilecoinApi {
  return {
    broadcast,
    combine,
    craftTransaction: craft,
    craftRawTransaction,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations: operations,
    validateIntent: validate,
    getSequence,
    getBlock,
    getBlockInfo,
    getStakes,
    getRewards,
    getValidators,
  };
}

async function craft(
  transactionIntent: TransactionIntent<MemoNotSupported>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!isSendTransactionIntent(transactionIntent)) {
    throw new Error("Only send transaction intent is supported");
  }

  // Get nonce/sequence
  const nonce = await getSequence(transactionIntent.sender);

  // Get fees if not provided
  const fees = (customFees as FilecoinFeeEstimation) ?? (await estimate(transactionIntent));

  // Determine if token transfer (use asset.assetReference for contract address)
  const tokenContractAddress =
    transactionIntent.asset?.type === "erc20" ? transactionIntent.asset.assetReference : undefined;

  const input: CraftTransactionInput = {
    sender: transactionIntent.sender,
    recipient: transactionIntent.recipient,
    amount: transactionIntent.amount,
    nonce: Number(nonce),
  };

  if (fees.parameters?.gasFeeCap !== undefined) {
    input.gasFeeCap = fees.parameters.gasFeeCap;
  }
  if (fees.parameters?.gasPremium !== undefined) {
    input.gasPremium = fees.parameters.gasPremium;
  }
  if (fees.parameters?.gasLimit !== undefined) {
    input.gasLimit = fees.parameters.gasLimit;
  }
  if (tokenContractAddress !== undefined) {
    input.tokenContractAddress = tokenContractAddress;
  }

  return craftTransaction(input);
}

async function craftRawTransaction(): Promise<CraftedTransaction> {
  throw new Error("craftRawTransaction is not supported for Filecoin");
}

async function estimate(
  transactionIntent: TransactionIntent<MemoNotSupported>,
): Promise<FilecoinFeeEstimation> {
  // Get token contract from asset.assetReference
  const tokenContractAddress =
    transactionIntent.asset?.type === "erc20" ? transactionIntent.asset.assetReference : undefined;

  // For token transfers, encode params for fee estimation
  let params: string | undefined;
  if (tokenContractAddress) {
    const abiEncodedParams = generateTokenTxnParams(
      transactionIntent.recipient,
      new BigNumber(transactionIntent.amount.toString()),
    );
    params = encodeTxnParams(abiEncodedParams);
  }

  // Convert contract address to f-format if it's a 0x address (API requires f-format)
  const toAddress = tokenContractAddress
    ? convertAddressEthToFil(tokenContractAddress)
    : transactionIntent.recipient;

  return estimateFees(
    transactionIntent.sender,
    toAddress,
    transactionIntent.amount,
    tokenContractAddress ? Methods.InvokeEVM : Methods.Transfer,
    params,
  );
}

async function validate(
  transactionIntent: TransactionIntent<MemoNotSupported>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  return validateIntent(transactionIntent, balances, customFees as FilecoinFeeEstimation);
}

async function operations(address: string, pagination: Pagination): Promise<[Operation[], string]> {
  const options: ListOperationsOptions = {
    minHeight: pagination.minHeight,
    order: pagination.order ?? "asc",
  };

  if (pagination.limit !== undefined) {
    options.limit = pagination.limit;
  }
  if (pagination.lastPagingToken !== undefined) {
    options.token = pagination.lastPagingToken;
  }

  return listOperations(address, options);
}

async function getSequence(address: string): Promise<bigint> {
  return logicGetSequence(address);
}

async function getBlock(_height: number): Promise<Block> {
  throw new Error("getBlock is not supported for Filecoin");
}

async function getBlockInfo(_height: number): Promise<BlockInfo> {
  throw new Error("getBlockInfo is not supported for Filecoin");
}

async function getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
  throw new Error("getStakes is not supported for Filecoin");
}

async function getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
  throw new Error("getRewards is not supported for Filecoin");
}

async function getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
  throw new Error("getValidators is not supported for Filecoin");
}

// Re-export HTTP client functions for backward compatibility
export * from "../network/api";
export type { FilecoinApi, FilecoinApiConfig } from "./types";
