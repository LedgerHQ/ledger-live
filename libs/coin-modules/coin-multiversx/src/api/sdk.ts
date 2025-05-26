import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { inferSubOperations } from "@ledgerhq/coin-framework/serialization/index";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import type { OperationType, SignedOperation, TokenAccount } from "@ledgerhq/types-live";
import {
  Address,
  ApiNetworkProvider,
  INetworkConfig,
  INonce,
  Transaction as MultiversXSdkTransaction,
  TransactionPayload,
} from "@multiversx/sdk-core";
import { BigNumber } from "bignumber.js";
import {
  CHAIN_ID,
  GAS_PER_DATA_BYTE,
  GAS_PRICE,
  GAS_PRICE_MODIFIER,
  MIN_GAS_LIMIT,
  MULTIVERSX_STAKING_POOL,
} from "../constants";
import {
  ESDTToken,
  MultiversXApiTransaction,
  MultiversXDelegation,
  MultiversXOperation,
  MultiversXProvider,
  MultiversXTransactionOperation,
  MultiversXTransferOptions,
  Transaction,
} from "../types";
import { BinaryUtils } from "../utils/binary.utils";
import MultiversXApi from "./apiCalls";
import { MultiversXAccount } from "./dtos/multiversx-account";
const api = new MultiversXApi(
  getEnv("MULTIVERSX_API_ENDPOINT"),
  getEnv("MULTIVERSX_DELEGATION_API_ENDPOINT"),
);

const networkConfig = { clientName: "ledger-live" };
const proxy = new ApiNetworkProvider(getEnv("MULTIVERSX_API_ENDPOINT"), networkConfig);

/**
 * Get account balances and nonce
 */
export const getAccount = async (addr: string): Promise<MultiversXAccount> => {
  const { balance, nonce, isGuarded } = await api.getAccountDetails(addr);
  const blockHeight = await api.getBlockchainBlockHeight();

  const account = new MultiversXAccount(new BigNumber(balance), nonce, isGuarded, blockHeight);
  return account;
};

export const getProviders = async (): Promise<MultiversXProvider[]> => {
  const providers = await api.getProviders();
  return providers;
};

export const getNetworkConfig = async (): Promise<INetworkConfig> => {
  return await proxy.getNetworkConfig();
};

export const getAccountNonce = async (addr: string): Promise<INonce> => {
  const address = new Address(addr);

  const account = await proxy.getAccount(address);

  return account.nonce;
};

/**
 * Returns true if account is the signer
 */
function isSender(transaction: MultiversXApiTransaction, addr: string): boolean {
  return transaction.sender === addr;
}

function isSelfSend(transaction: MultiversXApiTransaction): boolean {
  return (
    !!transaction.sender && !!transaction.receiver && transaction.sender === transaction.receiver
  );
}

/**
 * Map transaction to an Operation Type
 */
function getEGLDOperationType(transaction: MultiversXApiTransaction, addr: string): OperationType {
  if (transaction.action && transaction.action.category == "stake") {
    const stakeAction = transaction.action.name;
    switch (stakeAction) {
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
  return isSender(transaction, addr)
    ? transaction.transfer === MultiversXTransferOptions.esdt
      ? "FEES"
      : "OUT"
    : "IN";
}

function getESDTOperationValue(
  transaction: MultiversXApiTransaction,
  tokenIdentifier?: string,
): BigNumber {
  const hasFailed =
    !transaction.status || transaction.status === "fail" || transaction.status === "invalid";

  if (!transaction.action || hasFailed) {
    return new BigNumber(0);
  }
  let token1, token2;
  switch (transaction.action.name) {
    case "transfer":
      return new BigNumber(transaction.action.arguments.transfers[0].value ?? 0);
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

function getStakingAmount(transaction: MultiversXApiTransaction, address: string): BigNumber {
  const operation: MultiversXTransactionOperation | undefined = transaction.operations?.find(
    ({ sender, receiver, action, type }) =>
      action == "transfer" &&
      type == "egld" &&
      sender == transaction.receiver &&
      (receiver == address || receiver == MULTIVERSX_STAKING_POOL),
  );

  let dataDecoded;
  switch (transaction.mode) {
    case "send":
      return new BigNumber(0);
    case "delegate":
      return new BigNumber(transaction.value ?? 0);
    case "unDelegate":
      dataDecoded = BinaryUtils.base64Decode(transaction.data ?? "");
      return new BigNumber(`0x${dataDecoded.split("@")[1]}`);
    case "reDelegateRewards":
    case "claimRewards":
    case "withdraw":
    default:
      return new BigNumber(operation?.value ?? new BigNumber(0));
  }
}

/**
 * Map transaction to a correct Operation Value (affecting account balance)
 */
function getEGLDOperationValue(transaction: MultiversXApiTransaction, address: string): BigNumber {
  if (transaction.mode === "send") {
    if (transaction.transfer === MultiversXTransferOptions.esdt) {
      // Only fees paid in EGLD for token transactions
      return isSender(transaction, address) && transaction.fee
        ? new BigNumber(transaction.fee)
        : new BigNumber(0);
    } else {
      return isSender(transaction, address)
        ? isSelfSend(transaction)
          ? new BigNumber(transaction.fee ?? 0) // Self-send, only fees are paid
          : new BigNumber(transaction.value ?? 0).plus(transaction.fee ?? 0) // The sender pays the amount and the fees
        : new BigNumber(transaction.value ?? 0); // The recipient gets the amount
    }
  } else {
    // Operation value for staking transactions are just the fees, plus possible rewards
    // Other amounts are put in extra.amount
    return new BigNumber(transaction.fee ?? 0);
  }
}

/**
 * Map the MultiversX history transaction to a Ledger Live Operation
 */
function transactionToEGLDOperation(
  accountId: string,
  addr: string,
  transaction: MultiversXApiTransaction,
  subAccounts: TokenAccount[],
): MultiversXOperation {
  const type = getEGLDOperationType(transaction, addr);
  const fee = new BigNumber(transaction.fee ?? 0);
  const hasFailed =
    !transaction.status || transaction.status === "fail" || transaction.status === "invalid";

  const delegationAmount = getStakingAmount(transaction, addr);

  const value = hasFailed
    ? isSender(transaction, addr)
      ? fee
      : new BigNumber(0)
    : transaction.mode === "claimRewards"
      ? delegationAmount.minus(fee)
      : getEGLDOperationValue(transaction, addr);

  const operation: MultiversXOperation = {
    id: encodeOperationId(accountId, transaction.txHash ?? "", type),
    accountId,
    fee,
    value,
    type,
    hash: transaction.txHash ?? "",
    blockHash: transaction.miniBlockHash,
    blockHeight: transaction.round,
    date: new Date(transaction.timestamp ? transaction.timestamp * 1000 : 0),
    extra: {
      amount: delegationAmount,
    },
    senders: (type == "OUT" || type == "IN") && transaction.sender ? [transaction.sender] : [],
    recipients:
      (type == "OUT" || type == "IN") && transaction.receiver ? [transaction.receiver] : [],
    transactionSequenceNumber: isSender(transaction, addr) ? transaction.nonce : undefined,
    hasFailed,
  };

  const subOperations = subAccounts
    ? inferSubOperations(transaction.txHash ?? "", subAccounts)
    : undefined;

  if (subOperations) {
    operation.subOperations = subOperations;
  }

  let contract: string | undefined = undefined;
  if (transaction.receiver) {
    const isReceiverSmartContract = Address.newFromBech32(transaction.receiver).isSmartContract();

    contract = isReceiverSmartContract ? transaction.receiver : undefined;
  }

  if (contract) {
    operation.contract = contract;
  }

  return operation;
}

const getESDTOperationType = (
  transaction: MultiversXApiTransaction,
  address: string,
): OperationType => {
  return isSender(transaction, address) ? "OUT" : "IN";
};

const transactionToESDTOperation = (
  tokenAccountId: string,
  addr: string,
  transaction: MultiversXApiTransaction,
  tokenIdentifier?: string,
): MultiversXOperation => {
  const type = getESDTOperationType(transaction, addr);
  const value = getESDTOperationValue(transaction, tokenIdentifier);
  const fee = new BigNumber(transaction.fee ?? 0);
  const senders: string[] = transaction.sender ? [transaction.sender] : [];
  const recipients: string[] = transaction.receiver ? [transaction.receiver] : [];
  const hash = transaction.txHash ?? "";
  const blockHeight = transaction.round;
  const date = new Date(transaction.timestamp ? transaction.timestamp * 1000 : 0);

  return {
    id: encodeOperationId(tokenAccountId, hash, type),
    accountId: tokenAccountId,
    hash,
    date,
    type,
    value,
    fee,
    senders,
    recipients,
    blockHeight,
    blockHash: transaction.miniBlockHash,
    extra: {},
  };
};

/**
 * Fetch operation list
 */
export const getEGLDOperations = async (
  accountId: string,
  addr: string,
  startAt: number,
  subAccounts: TokenAccount[],
): Promise<MultiversXOperation[]> => {
  const rawTransactions = await api.getHistory(addr, startAt);
  if (!rawTransactions) return rawTransactions;
  return rawTransactions.map(transaction =>
    transactionToEGLDOperation(accountId, addr, transaction, subAccounts),
  );
};

export const getAccountESDTTokens = async (address: string): Promise<ESDTToken[]> => {
  return await api.getESDTTokensForAddress(address);
};

export const getAccountDelegations = async (address: string): Promise<MultiversXDelegation[]> => {
  return await api.getAccountDelegations(address);
};

export const hasESDTTokens = async (address: string): Promise<boolean> => {
  const tokensCount = await api.getESDTTokensCountForAddress(address);
  return tokensCount > 0;
};

export const getESDTOperations = async (
  tokenAccountId: string,
  address: string,
  tokenIdentifier: string,
  startAt: number,
): Promise<MultiversXOperation[]> => {
  const accountESDTTransactions = await api.getESDTTransactionsForAddress(
    address,
    tokenIdentifier,
    startAt,
  );

  return accountESDTTransactions.map(transaction =>
    transactionToESDTOperation(tokenAccountId, address, transaction, tokenIdentifier),
  );
};

/**
 * Obtain fees from blockchain
 */
export const getFees = async (t: Transaction): Promise<BigNumber> => {
  const networkConfig: INetworkConfig = {
    MinGasLimit: MIN_GAS_LIMIT,
    GasPerDataByte: GAS_PER_DATA_BYTE,
    GasPriceModifier: GAS_PRICE_MODIFIER,
    ChainID: CHAIN_ID,
  };

  const transaction = new MultiversXSdkTransaction({
    data: TransactionPayload.fromEncoded(t.data?.trim()),
    receiver: new Address(getAbandonSeedAddress("elrond")),
    chainID: CHAIN_ID,
    gasPrice: GAS_PRICE,
    gasLimit: t.gasLimit ?? networkConfig.MinGasLimit,
    sender: Address.empty(),
  });

  const feesStr = transaction.computeFee(networkConfig).toFixed();

  return new BigNumber(feesStr);
};

/**
 * Broadcast blob to blockchain
 */
export const broadcastTransaction = async (signedOperation: SignedOperation): Promise<string> => {
  return await api.submit(signedOperation);
};
