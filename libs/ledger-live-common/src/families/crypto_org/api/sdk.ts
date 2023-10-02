import { utils } from "@crypto-org-chain/chain-jslib";
import network from "@ledgerhq/live-network/network";
import type { OperationType } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import { encodeOperationId } from "../../../operation";
import { getCroSdk, isTestNet } from "../logic";
import { CryptoOrgOperation } from "../types";
import {
  CryptoOrgAccountTransaction,
  CryptoOrgAccountTransactionTypeEnum,
  CryptoOrgAmount,
  CryptoOrgCurrency,
  CryptoOrgMsgSendContent,
  CryptoOrgTestnetCurrency,
} from "./sdk.types";
const PAGINATION_LIMIT = 200;
const instances = {};

/**
 * Get CroClient
 */
export async function getClient(currencyId: string) {
  if (instances[currencyId]) {
    return instances[currencyId];
  }

  const crypto_org_rpc_url = isTestNet(currencyId)
    ? getEnv("CRYPTO_ORG_TESTNET_RPC_URL")
    : getEnv("CRYPTO_ORG_RPC_URL");
  instances[currencyId] = await getCroSdk(currencyId).CroClient.connect(crypto_org_rpc_url);
  return instances[currencyId];
}

/**
 * Extract only the cro amount from list of currencies
 */
export const getCroAmount = (amounts: CryptoOrgAmount[], currencyId: string) => {
  const cryptoOrgCurrency = isTestNet(currencyId) ? CryptoOrgTestnetCurrency : CryptoOrgCurrency;
  return amounts.reduce(
    (result, current) =>
      current.denom === cryptoOrgCurrency ? result.plus(new BigNumber(current.amount)) : result,
    new BigNumber(0),
  );
};

/**
 * Get account balances
 */
export const getAccount = async (addr: string, currencyId: string) => {
  const client = await getClient(currencyId);
  const { header } = await client.getBlock();
  const crypto_org_indexer = isTestNet(currencyId)
    ? getEnv("CRYPTO_ORG_TESTNET_INDEXER")
    : getEnv("CRYPTO_ORG_INDEXER");
  let balance = new BigNumber(0);
  let bondedBalance = new BigNumber(0);
  let redelegatingBalance = new BigNumber(0);
  let unbondingBalance = new BigNumber(0);
  let commissions = new BigNumber(0);
  let data;

  try {
    const response = await network({
      method: "GET",
      url: `${crypto_org_indexer}/api/v1/accounts/${addr}`,
    });
    data = response.data;
  } catch (error: any) {
    if (error?.status !== 404) {
      throw error;
    }
  }

  if (data) {
    balance = getCroAmount(data.result.balance, currencyId);
    bondedBalance = getCroAmount(data.result.bondedBalance, currencyId);
    redelegatingBalance = getCroAmount(data.result.redelegatingBalance, currencyId);
    unbondingBalance = getCroAmount(data.result.unbondingBalance, currencyId);
    commissions = getCroAmount(data.result.commissions, currencyId);
  }

  return {
    blockHeight: header.height,
    balance: new BigNumber(balance),
    bondedBalance: new BigNumber(bondedBalance),
    redelegatingBalance: new BigNumber(redelegatingBalance),
    unbondingBalance: new BigNumber(unbondingBalance),
    commissions: new BigNumber(commissions),
  };
};

/**
 * Get account information for sending transactions
 */
export const getAccountParams = async (addr: string, currencyId: string) => {
  const client = await getClient(currencyId);
  const { accountNumber, sequence } = await client.getAccount(addr);
  return {
    accountNumber: accountNumber ?? 0,
    sequence: sequence ?? 0,
  };
};

/**
 * Returns true if account is the signer
 */
function isSender(transaction: CryptoOrgMsgSendContent, addr: string): boolean {
  return transaction.fromAddress === addr;
}

/**
 * Map transaction to an Operation Type
 */
function getOperationType(
  messageSendContent: CryptoOrgMsgSendContent,
  addr: string,
): OperationType {
  return isSender(messageSendContent, addr) ? "OUT" : "IN";
}

/**
 * Map transaction to a correct Operation Value (affecting account balance)
 */
function getOperationValue(
  messageSendContent: CryptoOrgMsgSendContent,
  currencyId: string,
): BigNumber {
  return getCroAmount(messageSendContent.amount, currencyId);
}

/**
 * Map the send history transaction to a Ledger Live Operation
 */
function convertSendTransactionToOperation(
  accountId: string,
  addr: string,
  messageSendContent: CryptoOrgMsgSendContent,
  transaction: CryptoOrgAccountTransaction,
  currencyId: string,
  memo: string,
): CryptoOrgOperation {
  const type = getOperationType(messageSendContent, addr);
  return {
    id: encodeOperationId(accountId, messageSendContent.txHash, type),
    accountId,
    fee: new BigNumber(getCroAmount(transaction.fee, currencyId)),
    value: getOperationValue(messageSendContent, currencyId),
    type,
    hash: messageSendContent.txHash,
    blockHash: transaction.blockHash,
    blockHeight: transaction.blockHeight,
    date: new Date(transaction.blockTime),
    senders: [messageSendContent.fromAddress],
    recipients: [messageSendContent.toAddress],
    hasFailed: !transaction.success,
    extra: { memo },
  };
}

/**
 * Fetch operation list
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  startAt: number,
  currencyId: string,
): Promise<CryptoOrgOperation[]> => {
  const rawTransactions: CryptoOrgOperation[] = [];
  const crypto_org_indexer = isTestNet(currencyId)
    ? getEnv("CRYPTO_ORG_TESTNET_INDEXER")
    : getEnv("CRYPTO_ORG_INDEXER");
  const { data } = await network({
    method: "GET",
    url: `${crypto_org_indexer}/api/v1/accounts/${addr}/transactions?pagination=offset&page=${
      startAt + 1
    }&limit=${PAGINATION_LIMIT}`,
  });
  const accountTransactions: CryptoOrgAccountTransaction[] = data.result;

  for (let i = 0; i < accountTransactions.length; i++) {
    const msgs = accountTransactions[i].messages;
    const memo = accountTransactions[i].memo;
    const memoTransaction = memo || "";

    for (let j = 0; j < msgs.length; j++) {
      const msgType: string = msgs[j].type;
      if (msgType.includes(CryptoOrgAccountTransactionTypeEnum.MsgSend)) {
        const msgSend: CryptoOrgMsgSendContent = msgs[j].content;
        rawTransactions.push(
          convertSendTransactionToOperation(
            accountId,
            addr,
            msgSend,
            accountTransactions[i],
            currencyId,
            memoTransaction,
          ),
        );
      }
    }
  }

  return rawTransactions;
};

/**
 * Broadcast blob to blockchain
 */
export const broadcastTransaction = async (blob: string, currencyId: string) => {
  const client = await getClient(currencyId);
  const broadcastResponse = await client.broadcastTx(
    utils.Bytes.fromHexString(blob).toUint8Array(),
  );
  return broadcastResponse;
};
