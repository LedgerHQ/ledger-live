import { BigNumber } from "bignumber.js";
import ElrondApi from "./apiCalls";
import {
  ElrondDelegation,
  ElrondTransferOptions,
  ESDTToken,
  Transaction,
} from "../types";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import { getEnv } from "../../../env";
import { encodeOperationId } from "../../../operation";
import {
  Account,
  Address,
  GasLimit,
  NetworkConfig,
  Nonce,
  ProxyProvider,
  Transaction as ElrondSdkTransaction,
  TransactionPayload,
} from "@elrondnetwork/erdjs/out";
const api = new ElrondApi(
  getEnv("ELROND_API_ENDPOINT"),
  getEnv("ELROND_DELEGATION_API_ENDPOINT")
);

const proxy = new ProxyProvider(getEnv("ELROND_API_ENDPOINT"));

/**
 * Get account balances and nonce
 */
export const getAccount = async (addr: string) => {
  const { balance, nonce } = await api.getAccountDetails(addr);
  const blockHeight = await api.getBlockchainBlockHeight();
  return {
    blockHeight,
    balance: new BigNumber(balance),
    nonce,
  };
};

export const getProviders = async (): Promise<any> => {
  const providers = await api.getProviders();
  return providers;
};

export const getNetworkConfig = async (): Promise<NetworkConfig> => {
  await NetworkConfig.getDefault().sync(proxy);

  return NetworkConfig.getDefault();
};

export const getAccountNonce = async (addr: string): Promise<Nonce> => {
  const address = new Address(addr);
  const account = new Account(address);

  await account.sync(proxy);

  return account.nonce;
};

/**
 * Returns true if account is the signer
 */
function isSender(transaction: Transaction, addr: string): boolean {
  return transaction.sender === addr;
}

/**
 * Map transaction to an Operation Type
 */
function getOperationType(
  transaction: Transaction,
  addr: string
): OperationType {
  if (transaction.mode !== "send") {
    switch (transaction.mode) {
      case "delegate":
        return "DELEGATE";
      case "unDelegate":
        return "UNDELEGATE";
      case "withdraw":
        return "WITHDRAW_UNBONDED";
      case "claimRewards":
        return "REWARD";
      case "reDelegateRewards":
        return "DELEGATE";
    }
  }
  return isSender(transaction, addr) ? "OUT" : "IN";
}

/**
 * Map transaction to a correct Operation Value (affecting account balance)
 */
function getOperationValue(
  transaction: Transaction,
  addr: string,
  tokenIdentifier?: string
): BigNumber {
  if (transaction.transfer === ElrondTransferOptions.esdt) {
    if (transaction.action) {
      let token1, token2;
      switch (transaction.action.name) {
        case "transfer":
          return new BigNumber(
            transaction.action.arguments.transfers[0].value ?? 0
          );
        case "swap":
          token1 = transaction.action.arguments.transfers[0];
          token2 = transaction.action.arguments.transfers[1];
          if (token1.token === tokenIdentifier) {
            return new BigNumber(token1.value);
          } else {
            return new BigNumber(token2.value);
          }
        default:
          return new BigNumber(transaction.tokenValue ?? 0);
      }
    }
  }

  if (!isSender(transaction, addr)) {
    return new BigNumber(transaction.value ?? 0);
  }

  return new BigNumber(transaction.value ?? 0).plus(transaction.fee ?? 0);
}

/**
 * Map the Elrond history transaction to a Ledger Live Operation
 */
function transactionToOperation(
  accountId: string,
  addr: string,
  transaction: Transaction,
  tokenIdentifier?: string
): Operation {
  const type = getOperationType(transaction, addr);
  return {
    id: encodeOperationId(accountId, transaction.txHash ?? "", type),
    accountId,
    fee: new BigNumber(transaction.fee || 0),
    value: getOperationValue(transaction, addr, tokenIdentifier),
    type,
    hash: transaction.txHash ?? "",
    blockHash: transaction.miniBlockHash,
    blockHeight: transaction.round,
    date: new Date(transaction.timestamp ? transaction.timestamp * 1000 : 0),
    extra: {},
    senders: [transaction.sender ?? ""],
    recipients: transaction.receiver ? [transaction.receiver] : [],
    transactionSequenceNumber: isSender(transaction, addr)
      ? transaction.nonce
      : undefined,
    hasFailed:
      !transaction.status ||
      transaction.status === "fail" ||
      transaction.status === "invalid",
  };
}

/**
 * Fetch operation list
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  startAt: number
): Promise<Operation[]> => {
  const rawTransactions = await api.getHistory(addr, startAt);
  if (!rawTransactions) return rawTransactions;
  return rawTransactions.map((transaction) =>
    transactionToOperation(accountId, addr, transaction)
  );
};

export const getAccountESDTTokens = async (
  address: string
): Promise<ESDTToken[]> => {
  return await api.getESDTTokensForAddress(address);
};

export const getAccountDelegations = async (
  address: string
): Promise<ElrondDelegation[]> => {
  return await api.getAccountDelegations(address);
};

export const hasESDTTokens = async (address: string): Promise<boolean> => {
  const tokensCount = await api.getESDTTokensCountForAddress(address);
  return tokensCount > 0;
};

export const getAccountESDTOperations = async (
  accountId: string,
  address: string,
  tokenIdentifier: string
): Promise<Operation[]> => {
  const accountESDTTransactions = await api.getESDTTransactionsForAddress(
    address,
    tokenIdentifier
  );

  return accountESDTTransactions.map((transaction) =>
    transactionToOperation(accountId, address, transaction, tokenIdentifier)
  );
};

/**
 * Obtain fees from blockchain
 */
export const getFees = async (t: Transaction): Promise<BigNumber> => {
  await NetworkConfig.getDefault().sync(proxy);

  const transaction = new ElrondSdkTransaction({
    data: new TransactionPayload(t.data),
    receiver: new Address(t.receiver),
    chainID: NetworkConfig.getDefault().ChainID,
    gasLimit: new GasLimit(t.gasLimit),
  });

  const feesStr = transaction.computeFee(NetworkConfig.getDefault()).toFixed();

  return new BigNumber(feesStr);
};

/**
 * Broadcast blob to blockchain
 */
export const broadcastTransaction = async (
  operation: Operation,
  signature: string
): Promise<string> => {
  return await api.submit(operation, signature);
};

export const decodeTransaction = (transaction: any): Transaction => {
  if (!transaction.action) {
    return transaction;
  }

  if (!transaction.action.category) {
    return transaction;
  }

  if (transaction.action.category !== "stake") {
    return transaction;
  }

  transaction.mode = transaction.action.name;

  return transaction;
};
