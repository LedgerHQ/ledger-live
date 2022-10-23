import { BigNumber } from "bignumber.js";
import IconService from "icon-sdk-js";
import type { Transaction } from "../types";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "../../../operation";
import {
  getAccountDetails,
  getHistory,
  submit,
  getLatestBlock,
} from "./apiCalls";
import { getRpcUrl } from "../logic";
import { GOVERNANCE_SCORE_ADDRESS } from "../constants";
const { HttpProvider } = IconService;
const { IconBuilder, IconAmount } = IconService;

/**
 * Get account balances and nonce
 */
export const getAccount = async (addr: string, url: string) => {
  const { balance } = await getAccountDetails(addr, url);
  const blockHeight = await getLatestBlock(url);
  return {
    blockHeight: Number(blockHeight) || undefined,
    balance: new BigNumber(balance),
    additionalBalance: 0,
    nonce: 0,
  };
};

/**
 * Returns true if account is the signer
 */
function isSender(transaction: Transaction, addr: string): boolean {
  return transaction.fromAddr === addr;
}

/**
 * Map transaction to an Operation Type
 */
function getOperationType(
  transaction: Transaction,
  addr: string
): OperationType {
  return isSender(transaction, addr) ? "OUT" : "IN";
}

/**
 * Map transaction to a correct Operation Value (affecting account balance)
 */
function getOperationValue(transaction: Transaction, addr: string): BigNumber {
  return isSender(transaction, addr)
    ? new BigNumber(transaction.amount ?? 0).plus(transaction.fee ?? 0)
    : new BigNumber(transaction.amount ?? 0);
}

/**
 * Map the ICON history transaction to a Ledger Live Operation
 */
function transactionToOperation(
  accountId: string,
  addr: string,
  transaction: Transaction
): Operation {
  const type = getOperationType(transaction, addr);
  return {
    id: encodeOperationId(accountId, transaction.txHash ?? "", type),
    accountId,
    fee: new BigNumber(transaction.fee || 0),
    value: getOperationValue(transaction, addr),
    type,
    hash: transaction.txHash ?? "",
    blockHash: null,
    blockHeight: transaction.height,
    date: new Date(transaction.createDate ? transaction.createDate : 0),
    extra: {
      errorMsg: transaction.errorMsg,
      dataType: transaction.dataType,
      targetContractAddr: transaction.targetContractAddr,
      txType: transaction.txType,
      id: transaction.id,
    },
    senders: [transaction.fromAddr ?? ""],
    recipients: transaction.toAddr ? [transaction.toAddr] : [],
    transactionSequenceNumber: isSender(transaction, addr)
      ? transaction.nonce
      : undefined,
    hasFailed: transaction.state === 0,
  };
}

/**
 * Fetch operation list
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  startAt: number,
  url: string
): Promise<Operation[]> => {
  const rawTransactions = await getHistory(addr, startAt, url);
  if (!rawTransactions) return rawTransactions;
  return rawTransactions.map((transaction) =>
    transactionToOperation(accountId, addr, transaction)
  );
};

/**
 * Broadcast blob to blockchain
 */
export const broadcastTransaction = async (transaction, currency) => {
  const { hash } = await submit(transaction, currency);
  // Transaction hash is likely to be returned
  return { hash };
};

/**
 * Obtain fees from blockchain
 */
export const getFees = async (unsigned, account): Promise<BigNumber> => {
  const rpcURL = getRpcUrl(account.currency);
  const debugRpcUrl = rpcURL
    .split(/\/([^\/]+)$/)
    .slice(0, 2)
    .join("/debug/");
  const httpProvider = new HttpProvider(debugRpcUrl);
  const iconService = new IconService(httpProvider);
  let res;
  try {
    res = await iconService.estimateStep(unsigned).execute();
  } catch (error) {
  //  console.log(error)
  }
  return new BigNumber(res || 0);
};

/**
 * Get step price from governance contract
 */
export const getStepPrice = async (account): Promise<BigNumber> => {
  const rpcURL = getRpcUrl(account.currency);
  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);
  const txBuilder: any = new IconBuilder.CallBuilder();
  const stepPriceTx = txBuilder
    .to(GOVERNANCE_SCORE_ADDRESS)
    .method("getStepPrice")
    .build();
  let res;
  try {
    res = await iconService.call(stepPriceTx).execute();
  } catch (error) {
  //  console.log(error)
  }
  return new BigNumber(
    IconAmount.fromLoop(res || 10000000000, IconAmount.Unit.ICX.toString())
  );
};
