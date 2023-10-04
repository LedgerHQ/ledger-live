import { BigNumber } from "bignumber.js";
import IconService from "icon-sdk-js";
import type { PRep, Transaction } from "../types";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "../../../operation";
import {
  getAccountDetails,
  getHistory,
  submit,
  getLatestBlock,
} from "./apiCalls";
import { formatPRepData, getRpcUrl } from "../logic";
import { GOVERNANCE_SCORE_ADDRESS, IISS_SCORE_ADDRESS, I_SCORE_UNIT, STEP_LIMIT } from "../constants";
const { HttpProvider } = IconService;
const { IconBuilder, IconAmount } = IconService;
const iconUnit = IconAmount.Unit.ICX.toString();
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
  return transaction.from_address === addr;
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
    ? new BigNumber(transaction.amount ?? 0).plus(transaction.transaction_fee ?? 0)
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
    id: encodeOperationId(accountId, transaction.hash ?? "", type),
    accountId,
    fee: new BigNumber(transaction.transaction_fee || 0),
    value: getOperationValue(transaction, addr),
    type,
    hash: transaction.hash ?? "",
    blockHash: null,
    blockHeight: transaction.block_number,
    date: new Date(transaction.block_timestamp ? transaction.block_timestamp : 0),
    senders: [transaction.from_address ?? ""],
    recipients: transaction.to_address ? [transaction.to_address] : [],
    extra:{
      method: transaction.method,
      data: transaction.data,
      txType: transaction.transaction_type
    },
    transactionSequenceNumber: isSender(transaction, addr)
      ? transaction.nonce
      : undefined,
    hasFailed: transaction.status !== '0x1',
  };
}

/**
 * Fetch operation list
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  skip: number,
  url: string
): Promise<Operation[]> => {
  const rawTransactions = await getHistory(addr, skip, url);
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
  /* eslint-disable no-useless-escape */
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
    // TODO: handle show log
  }
  return new BigNumber(res || STEP_LIMIT);
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
    // TODO: handle show log
  }
  return new BigNumber(
    IconAmount.fromLoop(res || 10000000000, iconUnit)
  );
};


/**
 * Get step price from governance contract
 */
export const getPreps = async (currency): Promise<PRep[]> => {
  const rpcURL = getRpcUrl(currency);
  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);
  const prepTx: any = new IconBuilder.CallBuilder()
    .to(IISS_SCORE_ADDRESS)
    .method("getPReps")
    .build();


  let preps: PRep[] = [];
  try {
    const res = await iconService.call(prepTx).execute();
    if (res?.preps) {
      for (let pr of res?.preps) {
        const prepFormatted = formatPRepData(pr);
        preps.push(prepFormatted);
      }
    }
  } catch (error) {
    // TODO: handle show log
    console.log(error);
  }
  return preps;
};

export const getDelegation = async (address, currency) => {
  const rpcURL = getRpcUrl(currency);
  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);
  const delegationTx: any = new IconBuilder.CallBuilder()
    .to(IISS_SCORE_ADDRESS)
    .method("getDelegation")
    .params({
      address
    })
    .build();

  let res;

  try {
    res = await iconService.call(delegationTx).execute();
  } catch (error) {
    // TODO: handle show log
    console.log(error);
  }
  return {
    delegations: res?.delegations.map(item => { return { ...item, value: new BigNumber(IconAmount.fromLoop(item.value || 0, iconUnit)) }; }) || [],
    totalDelegated: new BigNumber(IconAmount.fromLoop(res?.totalDelegated || 0, iconUnit)),
    votingPower: new BigNumber(IconAmount.fromLoop(res?.votingPower || 0, iconUnit))
  };
};

export const getPrep = async (prepAddress, currency): Promise<PRep> => {
  const rpcURL = getRpcUrl(currency);
  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);
  const prepTx: any = new IconBuilder.CallBuilder()
    .to(IISS_SCORE_ADDRESS)
    .method("getPRep")
    .params({ address: prepAddress })
    .build();

  let res;
  try {
    res = await iconService.call(prepTx).execute();
    if (res) {
      res = formatPRepData(res);
    }
  } catch (error) {
    // TODO: handle show log
    console.log(error);
  }
  return res;
};

export const getIScore = async (address, currency) => {
  const rpcURL = getRpcUrl(currency);
  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);
  const prepTx: any = new IconBuilder.CallBuilder()
    .to(IISS_SCORE_ADDRESS)
    .method("queryIScore")
    .params({ address })
    .build();

  let res;
  try {
    res = await iconService.call(prepTx).execute();
  } catch (error) {
    // TODO: handle show log
    console.log(error);
  }
  return new BigNumber(IconAmount.fromLoop(res?.estimatedICX || 0, iconUnit));
};

export const getStake = async (address, currency) => {
  const rpcURL = getRpcUrl(currency);
  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);
  const prepTx: any = new IconBuilder.CallBuilder()
    .to(IISS_SCORE_ADDRESS)
    .method("getStake")
    .params({ address })
    .build();

  let res;
  let unstake = new BigNumber(0);
  try {
    res = await iconService.call(prepTx).execute();
    if (res?.unstakes) {
      const unstakes = res?.unstakes;
      for (let item of unstakes) {
        const value =BigNumber(IconAmount.fromLoop(item.unstake || 0, iconUnit))
        unstake = unstake.plus(value);
      }
    }
  } catch (error) {
    // TODO: handle show log
    console.log(error);
  }
  return { ...res, unstake };
};

