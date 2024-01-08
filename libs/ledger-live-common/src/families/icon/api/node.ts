import { BigNumber } from "bignumber.js";
import IconService from "icon-sdk-js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "../../../operation";
import { getAccountBalance, getApiUrl, getHistory, getLatestBlockHeight } from "./indexer";
import { isTestnet } from "../logic";
import { GOVERNANCE_SCORE_ADDRESS, IISS_SCORE_ADDRESS, STEP_LIMIT } from "../constants";
import { APITransaction } from "./api-type";

const { HttpProvider } = IconService;
const { IconBuilder, IconAmount } = IconService;
const iconUnit = IconAmount.Unit.ICX.toString();
/**
 * Get account balances and nonce
 */
export const getAccount = async (addr: string, currency: CryptoCurrency) => {
  const url = getApiUrl(currency);
  const balance = await getAccountBalance(addr, url);
  const blockHeight = await getLatestBlockHeight(url);
  return {
    blockHeight: Number(blockHeight) || undefined,
    balance: new BigNumber(balance).decimalPlaces(2),
    nonce: 0,
  };
};

/**
 * Returns true if account is the signer
 */
function isSender(transaction: APITransaction, addr: string): boolean {
  return transaction.from_address === addr;
}

/**
 * Returns Testnet RPC URL if the current currency is testnet
 *
 * @param {currency} CryptoCurrency
 */
export function getRpcUrl(currency: CryptoCurrency): string {
  let rpcUrl = getEnv("ICON_NODE_ENDPOINT");
  if (isTestnet(currency)) {
    rpcUrl = getEnv("ICON_TESTNET_NODE_ENDPOINT");
  }
  return rpcUrl;
}

/**
 * Map transaction to an Operation Type
 */
function getOperationType(transaction: APITransaction, addr: string): OperationType {
  return isSender(transaction, addr) ? "OUT" : "IN";
}

/**
 * Map transaction to a correct Operation Value (affecting account balance)
 */
function getOperationValue(transaction: APITransaction, addr: string): BigNumber {
  return isSender(transaction, addr)
    ? new BigNumber(transaction.value_decimal ?? 0).plus(transaction.transaction_fee ?? 0)
    : new BigNumber(transaction.value_decimal ?? 0);
}

/**
 * Map the ICON history transaction to a Ledger Live Operation
 */
function transactionToOperation(
  accountId: string,
  addr: string,
  transaction: APITransaction,
): Operation {
  const type = getOperationType(transaction, addr);
  transaction.transaction_fee = new BigNumber(
    IconAmount.fromLoop((transaction.transaction_fee || 0).toString(), iconUnit),
  );
  return {
    id: encodeOperationId(accountId, transaction.hash ?? "", type),
    accountId,
    fee: transaction.transaction_fee,
    value: getOperationValue(transaction, addr),
    type,
    hash: transaction.hash ?? "",
    blockHash: null,
    blockHeight: transaction.block_number,
    date: new Date(transaction.block_timestamp ? transaction.block_timestamp / 1000 : 0),
    senders: [transaction.from_address ?? ""],
    recipients: transaction.to_address ? [transaction.to_address] : [],
    extra: {},
    transactionSequenceNumber: isSender(transaction, addr) ? transaction.nonce : undefined,
    hasFailed: transaction.status !== "0x1",
  };
}

/**
 * Fetch operation list
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  skip: number,
  currency: CryptoCurrency,
): Promise<Operation[]> => {
  const url = getApiUrl(currency);
  const rawTransactions = await getHistory(addr, skip, url);
  if (!rawTransactions) return rawTransactions;
  return rawTransactions.map(transaction => transactionToOperation(accountId, addr, transaction));
};

/**
 * Broadcast blob to blockchain
 */
export const broadcastTransaction = async (transaction, currency) => {
  const { hash } = await submit(transaction, currency);
  // Transaction hash is likely to be returned
  return { hash };
};

export const submit = async (txObj, currency) => {
  const rpcURL = getRpcUrl(currency);

  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);

  const signedTransaction: any = {
    getProperties: () => txObj.rawData,
    getSignature: () => txObj.signature,
  };

  const response = await iconService.sendTransaction(signedTransaction).execute();
  return {
    hash: response,
  };
};

/**
 * Obtain fees from blockchain
 */
export const getFees = async (unsigned, account): Promise<BigNumber> => {
  const rpcURL = getRpcUrl(account.currency);
  // d mean debug, only get estimate step with debug enpoint
  const debugRpcUrl = rpcURL + "d";
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
  const stepPriceTx = txBuilder.to(GOVERNANCE_SCORE_ADDRESS).method("getStepPrice").build();
  let res;
  try {
    res = await iconService.call(stepPriceTx).execute();
  } catch (error) {
    // TODO: handle show log
  }
  return new BigNumber(IconAmount.fromLoop(res || 10000000000, iconUnit));
};

export const getDelegation = async (address, currency) => {
  const rpcURL = getRpcUrl(currency);
  const httpProvider = new HttpProvider(rpcURL);
  const iconService = new IconService(httpProvider);
  const delegationTx: any = new IconBuilder.CallBuilder()
    .to(IISS_SCORE_ADDRESS)
    .method("getDelegation")
    .params({
      address,
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
    delegations:
      res?.delegations.map(item => {
        return { ...item, value: new BigNumber(IconAmount.fromLoop(item.value || 0, iconUnit)) };
      }) || [],
    totalDelegated: new BigNumber(IconAmount.fromLoop(res?.totalDelegated || 0, iconUnit)),
    votingPower: new BigNumber(IconAmount.fromLoop(res?.votingPower || 0, iconUnit)),
  };
};
