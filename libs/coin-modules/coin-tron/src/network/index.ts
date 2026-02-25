import { stringify } from "querystring";
import network from "@ledgerhq/live-network";
import { hours, makeLRUCache } from "@ledgerhq/live-network/cache";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { log } from "@ledgerhq/logs";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import compact from "lodash/compact";
import drop from "lodash/drop";
import sumBy from "lodash/sumBy";
import take from "lodash/take";
import TronWeb from "tronweb";
import coinConfig from "../config";
import type {
  FreezeTransactionData,
  LegacyUnfreezeTransactionData,
  NetworkInfo,
  SendTransactionData,
  SendTransactionDataSuccess,
  SmartContractTransactionData,
  SuperRepresentative,
  SuperRepresentativeData,
  Transaction,
  TrongridTxInfo,
  TronResource,
  TronTransactionInfo,
  UnDelegateResourceTransactionData,
  UnFreezeTransactionData,
  WithdrawExpireUnfreezeTransactionData,
} from "../types";
import { TronTransactionExpired } from "../types/errors";
import {
  decode58Check,
  encode58Check,
  formatTrongridTrc20TxResponse,
  formatTrongridTxResponse,
} from "./format";
import {
  AccountTronAPI,
  Block,
  isMalformedTransactionTronAPI,
  isTransactionTronAPI,
  MalformedTransactionTronAPI,
  TransactionResponseTronAPI,
  TransactionTronAPI,
  Trc20API,
} from "./types";
import { abiEncodeTrc20Transfer, hexToAscii } from "./utils";

const getBaseApiUrl = () => coinConfig.getCoinConfig().explorer.url;

export async function post<T, U extends object = any>(endPoint: string, body: T): Promise<U> {
  const { data } = await network<U, T>({
    method: "POST",
    url: `${getBaseApiUrl()}${endPoint}`,
    data: body,
  });

  // Ugly but trongrid send a 200 status event if there are errors
  if ("Error" in data) {
    const error = data.Error as any;
    const message = stringify(error);
    const nonEmptyMessage = message === "" ? error.toString() : message;
    log("tron-error", nonEmptyMessage, { endPoint, body });
    throw new Error(nonEmptyMessage);
  }

  return data;
}

async function fetch<T extends object = any>(endPoint: string): Promise<T> {
  return fetchWithBaseUrl<T>(`${getBaseApiUrl()}${endPoint}`);
}

async function fetchWithBaseUrl<T extends object = any>(url: string): Promise<T> {
  const { data } = await network<T>({ url });

  // Ugly but trongrid send a 200 status event if there are errors
  if ("Error" in data) {
    log("tron-error", stringify(data.Error as any), {
      url,
    });
    throw new Error(stringify(data.Error as any));
  }

  return data;
}

export const freezeTronTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<SendTransactionDataSuccess> => {
  const txData: FreezeTransactionData = {
    frozen_balance: transaction.amount.toNumber(),
    resource: transaction.resource,
    owner_address: decode58Check(account.freshAddress),
  };
  const url = `/wallet/freezebalancev2`;
  const result = await post(url, txData);

  return result;
};

export const unfreezeTronTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<SendTransactionDataSuccess> => {
  const txData: UnFreezeTransactionData = {
    owner_address: decode58Check(account.freshAddress),
    resource: transaction.resource,
    unfreeze_balance: transaction.amount.toNumber(),
  };
  const url = `/wallet/unfreezebalancev2`;
  const result = await post(url, txData);

  return result;
};

export const withdrawExpireUnfreezeTronTransaction = async (
  account: Account,
  _transaction: Transaction,
): Promise<SendTransactionDataSuccess> => {
  const txData: WithdrawExpireUnfreezeTransactionData = {
    owner_address: decode58Check(account.freshAddress),
  };
  const url = `/wallet/withdrawexpireunfreeze`;
  const result = await post(url, txData);

  return result;
};

export const unDelegateResourceTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<SendTransactionDataSuccess> => {
  const txData: UnDelegateResourceTransactionData = {
    balance: transaction.amount.toNumber(),
    resource: transaction.resource,
    owner_address: decode58Check(account.freshAddress),
    receiver_address: decode58Check(transaction.recipient),
  };

  const url = `/wallet/undelegateresource`;
  const result = await post(url, txData);

  return result;
};

export const legacyUnfreezeTronTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<SendTransactionDataSuccess> => {
  const txData: LegacyUnfreezeTransactionData = {
    resource: transaction.resource,
    owner_address: decode58Check(account.freshAddress),
    receiver_address: transaction.recipient ? decode58Check(transaction.recipient) : undefined,
  };
  const url = `/wallet/unfreezebalance`;
  const result = await post(url, txData);
  return result;
};

export async function getDelegatedResource(
  account: Account,
  transaction: Transaction,
  resource: TronResource,
): Promise<BigNumber> {
  const url = `/wallet/getdelegatedresourcev2`;

  const {
    delegatedResource = [],
  }: {
    delegatedResource?: {
      frozen_balance_for_bandwidth: number;
      frozen_balance_for_energy: number;
    }[];
  } = await post(url, {
    fromAddress: decode58Check(account.freshAddress),
    toAddress: decode58Check(transaction.recipient),
  });

  const { frozen_balance_for_bandwidth, frozen_balance_for_energy } = delegatedResource.reduce(
    (accum, cur) => {
      if (cur.frozen_balance_for_bandwidth) {
        accum.frozen_balance_for_bandwidth += cur.frozen_balance_for_bandwidth;
      }
      if (cur.frozen_balance_for_energy) {
        accum.frozen_balance_for_energy += cur.frozen_balance_for_energy;
      }
      return accum;
    },
    { frozen_balance_for_bandwidth: 0, frozen_balance_for_energy: 0 },
  );

  const amount =
    resource === "BANDWIDTH" ? frozen_balance_for_bandwidth : frozen_balance_for_energy;

  return new BigNumber(amount);
}

export const DEFAULT_TRC20_FEES_LIMIT = 50000000;

export async function craftTrc20Transaction(
  tokenAddress: string,
  recipientAddress: string,
  senderAddress: string,
  amount: BigNumber,
  customFees?: number,
  expiration?: number,
): Promise<SendTransactionDataSuccess> {
  const txData: SmartContractTransactionData = {
    function_selector: "transfer(address,uint256)",
    fee_limit: customFees ? customFees : DEFAULT_TRC20_FEES_LIMIT,
    call_value: 0,
    contract_address: decode58Check(tokenAddress),
    parameter: abiEncodeTrc20Transfer(recipientAddress, new BigNumber(amount.toString())),
    owner_address: senderAddress,
  };
  const url = `/wallet/triggersmartcontract`;
  const { transaction: preparedTransaction } = await post(url, txData);
  return await extendExpiration(preparedTransaction, expiration);
}

export async function craftStandardTransaction(
  tokenAddress: string | undefined,
  recipientAddress: string,
  senderAddress: string,
  amount: BigNumber,
  isTransferAsset: boolean,
  memo?: string,
  expiration?: number,
): Promise<SendTransactionDataSuccess> {
  const url = isTransferAsset ? `/wallet/transferasset` : `/wallet/createtransaction`;
  const txData: SendTransactionData = {
    to_address: recipientAddress,
    owner_address: senderAddress,
    amount: Number(amount),
    asset_name: tokenAddress && Buffer.from(tokenAddress).toString("hex"),
    extra_data: memo && Buffer.from(memo).toString("hex"),
  };
  const preparedTransaction = await post(url, txData);
  return await extendExpiration(preparedTransaction, expiration);
}

const getTokenInfo = (subAccount: TokenAccount | null | undefined): string[] | undefined[] => {
  const tokenInfo =
    subAccount && subAccount.type === "TokenAccount"
      ? drop(subAccount.token.id.split("/"), 1)
      : [undefined, undefined];
  return tokenInfo;
};

// Send trx or trc10/trc20 tokens
export const createTronTransaction = async (
  account: Account,
  transaction: Transaction,
  subAccount: TokenAccount | null | undefined,
): Promise<SendTransactionDataSuccess> => {
  const [tokenType, tokenId] = getTokenInfo(subAccount);

  const decodeRecipient = decode58Check(transaction.recipient);
  const decodeSender = decode58Check(account.freshAddress);
  // trc20
  if (tokenType === "trc20" && tokenId) {
    const tokenContractAddress = (subAccount as TokenAccount).token.contractAddress;
    return craftTrc20Transaction(
      tokenContractAddress,
      decodeRecipient,
      decodeSender,
      transaction.amount,
    );
  } else {
    const isTransferAsset = subAccount ? true : false;
    return craftStandardTransaction(
      tokenId,
      decodeRecipient,
      decodeSender,
      transaction.amount,
      isTransferAsset,
    );
  }
};

/** Default expiration of 10 minutes (in seconds) after crafting time. */
export const DEFAULT_EXPIRATION = 600;

async function extendExpiration(
  preparedTransaction: any,
  expiration?: number,
): Promise<SendTransactionDataSuccess> {
  const HttpProvider = TronWeb.providers.HttpProvider;
  const fullNode = new HttpProvider(getBaseApiUrl());
  const solidityNode = new HttpProvider(getBaseApiUrl());
  const eventServer = new HttpProvider(getBaseApiUrl());
  const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);
  const extension = expiration ?? DEFAULT_EXPIRATION;
  try {
    return (await tronWeb.transactionBuilder.extendExpiration(
      preparedTransaction,
      extension,
    )) as unknown as Promise<SendTransactionDataSuccess>;
  } catch (err) {
    const message = err instanceof Error ? err.message : typeof err === "string" ? err : "";
    if (message === "Invalid extension provided") {
      // https://github.com/tronprotocol/tronweb/blob/2da130f4a295b9e9bd45361c15b5ca9d689cfa65/src/lib/transactionBuilder.js#L2929
      log("tron/extendExpiration", message, {
        preparedTransaction,
        extensionInS: extension,
        extensionInMs: extension * 1000,
        minFinalExpiration: Date.now() + 3000,
      });
    }
    throw err;
  }
}

type BroadcastSuccessResponseTronAPI = { result: true; txid: string };
type BroadcastErrorResponseTronAPI = {
  result?: boolean;
  txid: string;
  code: string;
  message: string;
};
type BroadcastResponseTronAPI = BroadcastSuccessResponseTronAPI | BroadcastErrorResponseTronAPI;
/**
 * @see https://github.com/tronprotocol/java-tron/blob/develop/framework/src/main/java/org/tron/core/services/http/BroadcastServlet.java
 * @param trxTransaction
 * @returns Transaction ID
 */
export const broadcastTron = async (
  trxTransaction: SendTransactionDataSuccess & { signature: string[] },
): Promise<string> => {
  const result: BroadcastResponseTronAPI = await post(
    "/wallet/broadcasttransaction",
    trxTransaction,
  );

  if (result.result !== true) {
    if (result.code === "TRANSACTION_EXPIRATION_ERROR") {
      throw new TronTransactionExpired();
    } else {
      throw new Error(`${result.code}: ${result.message}`);
    }
  }

  return result.txid;
};

type TronGridBroadcastResponse = {
  result: boolean;
  code: string;
  txid: string;
  message: string;
  transaction: {
    raw_data: Record<string, unknown>;
    signature: string[];
  };
};
export const broadcastHexTron = async (rawTransaction: string): Promise<string> => {
  const result = await post<{ transaction: string }, TronGridBroadcastResponse>(
    `/wallet/broadcasthex`,
    { transaction: rawTransaction },
  );

  if (!result.result) {
    throw Error(`Broadcast failed due to ${result.code}`);
  }

  return result.txid;
};

/**
 * {@link https://github.com/tronprotocol/java-tron/blob/develop/framework/src/main/java/org/tron/core/services/http/GetAccountServlet.java | Tron Framework}
 */
export async function fetchTronAccount(addr: string): Promise<AccountTronAPI[]> {
  try {
    const data = await fetch(`/v1/accounts/${addr}`);
    return data.data;
  } catch {
    return [];
  }
}

export async function getLastBlock(): Promise<Block> {
  const data = await fetch(`/wallet/getnowblock`);
  return toBlock(data);
}

export async function getBlock(blockNumber: number): Promise<Block> {
  const data = await fetch(`/wallet/getblock?id_or_num=${encodeURIComponent(blockNumber)}`);
  const ret = toBlock(data);
  if (!ret.height) {
    ret.height = blockNumber;
  }
  return ret;
}

function toBlock(data: any): Block {
  // some old blocks doesn't have a timestamp
  const timestamp = data.block_header.raw_data.timestamp;
  const ret: Block = {
    height: data.block_header.raw_data.number,
    hash: data.blockID,
  };
  if (timestamp) {
    ret.time = new Date(timestamp);
  }
  return ret;
}

// For the moment, fetching transaction info is the only way to get fees from a transaction
// Export for test purpose only
export async function fetchTronTxDetail(txId: string): Promise<TronTransactionInfo> {
  const { fee, blockNumber, withdraw_amount, unfreeze_amount } = await fetch(
    `/wallet/gettransactioninfobyid?value=${encodeURIComponent(txId)}`,
  );
  return {
    fee,
    blockNumber,
    withdraw_amount,
    unfreeze_amount,
  };
}

async function getAllTransactions<T>(
  initialUrl: string,
  shouldFetchMoreTxs: (txs: T[]) => boolean,
  getTxs: (url: string) => Promise<{
    results: Array<T>;
    nextUrl?: string;
  }>,
) {
  let all: Array<T> = [];
  let url: string | undefined = initialUrl;
  while (url && shouldFetchMoreTxs(all)) {
    const { nextUrl, results } = await getTxs(url);
    url = nextUrl;
    all = all.concat(results);
  }

  return all;
}

const getTransactions =
  (cacheTransactionInfoById: Record<string, TronTransactionInfo>) =>
  async (
    url: string,
  ): Promise<{
    results: Array<
      (TransactionTronAPI & { detail?: TronTransactionInfo }) | MalformedTransactionTronAPI
    >;
    nextUrl?: string;
  }> => {
    const transactions =
      await fetchWithBaseUrl<
        TransactionResponseTronAPI<TransactionTronAPI | MalformedTransactionTronAPI>
      >(url);
    const nextUrl = transactions.meta.links?.next?.replace(
      /https:\/\/api(\.[a-z]*)?.trongrid.io/,
      getBaseApiUrl(),
    );
    const results = await promiseAllBatched(3, transactions.data || [], async tx => {
      if (isMalformedTransactionTronAPI(tx)) {
        return tx;
      }
      const txID = tx.txID;

      const detail = cacheTransactionInfoById[txID] || (await fetchTronTxDetail(txID));
      cacheTransactionInfoById[txID] = detail;
      return { ...tx, detail };
    });

    return {
      results,
      nextUrl,
    };
  };

const getTrc20 = async (
  url: string,
): Promise<{
  results: Array<Trc20API>;
  nextUrl?: string;
}> => {
  const transactions = await fetchWithBaseUrl<TransactionResponseTronAPI<Trc20API>>(url);

  return {
    results: transactions.data,
    nextUrl: transactions.meta.links?.next?.replace(
      /https:\/\/api(\.[a-z]*)?.trongrid.io/,
      getBaseApiUrl(),
    ),
  };
};

export type FetchTxsStopPredicate = (
  txs: Array<TransactionTronAPI | Trc20API | MalformedTransactionTronAPI>,
) => boolean;

export type FetchParams = {
  /** The maximum number of transactions to fetch per call. */
  limitPerCall: number;
  /** Hint about the number of transactions to be fetched in total (hint to optimize `limitPerCall`) */
  hintGlobalLimit?: number;
  minTimestamp: number;
  order: "asc" | "desc";
};

export const defaultFetchParams: FetchParams = {
  limitPerCall: 100,
  minTimestamp: 0,
  order: "desc",
} as const;

export async function fetchTronAccountTxs(
  addr: string,
  shouldFetchMoreTxs: FetchTxsStopPredicate,
  cacheTransactionInfoById: Record<string, TronTransactionInfo>,
  params: FetchParams,
): Promise<TrongridTxInfo[]> {
  const adjustedLimitPerCall = params.hintGlobalLimit
    ? Math.min(params.limitPerCall, params.hintGlobalLimit)
    : params.limitPerCall;
  const queryParams = `limit=${adjustedLimitPerCall}&min_timestamp=${params.minTimestamp}&order_by=block_timestamp,${params.order}`;
  const nativeTxs = (
    await getAllTransactions<
      (TransactionTronAPI & { detail?: TronTransactionInfo }) | MalformedTransactionTronAPI
    >(
      `${getBaseApiUrl()}/v1/accounts/${addr}/transactions?${queryParams}`,
      shouldFetchMoreTxs,
      getTransactions(cacheTransactionInfoById),
    )
  )
    .filter(isTransactionTronAPI)
    .filter(tx => {
      // custom smart contract tx has internal txs
      const hasInternalTxs =
        tx.txID && tx.internal_transactions && tx.internal_transactions.length > 0;
      // and also a duplicated malformed tx that we have to ignore
      const isDuplicated = tx.tx_id;
      const type = tx.raw_data.contract[0].type;

      if (hasInternalTxs) {
        // log once
        log("tron-error", `unsupported transaction ${tx.txID}`);
      }

      return !isDuplicated && !hasInternalTxs && type !== "TriggerSmartContract";
    })
    .map(tx => formatTrongridTxResponse(tx));

  // we need to fetch and filter trc20 transactions from another endpoint
  // doc https://developers.tron.network/reference/get-trc20-transaction-info-by-account-address

  const callTrc20Endpoint = async () =>
    await getAllTransactions<Trc20API>(
      `${getBaseApiUrl()}/v1/accounts/${addr}/transactions/trc20?${queryParams}&get_detail=true`,
      shouldFetchMoreTxs,
      getTrc20,
    );

  type Acc = {
    txs: Trc20API[];
    invalids: number[];
  };

  function isValid(tx: Trc20API): boolean {
    const ret = tx?.detail?.ret;
    return Array.isArray(ret) && ret.length > 0;
  }

  function getInvalidTxIndexes(txs: Trc20API[]): number[] {
    const invalids: number[] = [];
    for (let i = 0; i < txs.length; i++) {
      if (!isValid(txs[i])) {
        invalids.push(i);
      }
    }
    txs.filter(tx => !isValid(tx)).map((_tx, index) => index);
    return invalids;
  }

  function assert(predicate: boolean, message: string) {
    if (!predicate) {
      throw new Error(message);
    }
  }

  // Merge the two results
  function mergeAccs(acc1: Acc, acc2: Acc): Acc {
    assert(acc1.txs.length === acc2.txs.length, "accs should have the same length");
    const accRet: Acc = { txs: acc1.txs, invalids: [] };
    acc1.invalids.forEach(invalidIndex => {
      acc2.invalids.includes(invalidIndex)
        ? accRet.invalids.push(invalidIndex)
        : (accRet.txs[invalidIndex] = acc2.txs[invalidIndex]);
    });
    return accRet;
  }

  // see LIVE-18992 for an explanation to why we need this
  async function getTrc20TxsWithRetry(acc: Acc | null, times: number): Promise<Trc20API[]> {
    assert(
      times > 0,
      "getTrc20TxsWithRetry: couldn't fetch trc20 transactions after several attempts",
    );
    const ret = await callTrc20Endpoint();
    const thisAcc: Acc = {
      txs: ret,
      invalids: getInvalidTxIndexes(ret),
    };
    const newAcc = acc ? mergeAccs(acc, thisAcc) : thisAcc;
    if (newAcc.invalids.length === 0) {
      return newAcc.txs;
    } else {
      log(
        "coin-tron",
        `getTrc20TxsWithRetry: got ${newAcc.invalids.length} invalid trc20 transactions, retrying...`,
      );
      return await getTrc20TxsWithRetry(newAcc, times - 1);
    }
  }

  const trc20Txs = (await getTrc20TxsWithRetry(null, 3)).map(formatTrongridTrc20TxResponse);

  const txInfos: TrongridTxInfo[] = compact(nativeTxs.concat(trc20Txs)).sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
  return txInfos;
}

export const getContractUserEnergyRatioConsumption = async (address: string): Promise<number> => {
  const result = await fetchTronContract(address);
  if (result) {
    const { consume_user_resource_percent } = result;
    return consume_user_resource_percent;
  }
  return 0;
};

export const fetchTronContract = async (addr: string): Promise<Record<string, any> | undefined> => {
  try {
    const data = await post(`/wallet/getcontract`, {
      value: decode58Check(addr),
    });
    return Object.keys(data).length !== 0 ? data : undefined;
  } catch {
    return undefined;
  }
};

export const getTronAccountNetwork = async (address: string): Promise<NetworkInfo> => {
  const result = await fetch(
    `/wallet/getaccountresource?address=${encodeURIComponent(decode58Check(address))}`,
  );
  const {
    freeNetUsed = 0,
    freeNetLimit = 0,
    NetUsed = 0,
    NetLimit = 0,
    EnergyUsed = 0,
    EnergyLimit = 0,
  } = result;
  return {
    family: "tron",
    freeNetUsed: new BigNumber(freeNetUsed),
    freeNetLimit: new BigNumber(freeNetLimit),
    netUsed: new BigNumber(NetUsed),
    netLimit: new BigNumber(NetLimit),
    energyUsed: new BigNumber(EnergyUsed),
    energyLimit: new BigNumber(EnergyLimit),
  };
};

export const validateAddress = async (address: string): Promise<boolean> => {
  try {
    const result = await post(`/wallet/validateaddress`, {
      address: decode58Check(address),
    });
    return result.result || false;
  } catch (e: any) {
    // FIXME we should not silent errors!
    log("tron-error", "validateAddress fails with " + e.message, {
      address,
    });
    return false;
  }
};

// cache for account names (name is unchanged over time)
const accountNamesCache = makeLRUCache(
  async (addr: string): Promise<string | null | undefined> => getAccountName(addr),
  (addr: string) => addr,
  hours(3, 300),
);

// cache for super representative brokerages (brokerage is unchanged over time)
const srBrokeragesCache = makeLRUCache(
  async (addr: string): Promise<number> => getBrokerage(addr),
  (addr: string) => addr,
  hours(3, 300),
);

export const getAccountName = async (addr: string): Promise<string | null | undefined> => {
  const tronAcc = await fetchTronAccount(addr);
  const acc = tronAcc[0];
  const accountName: string | null | undefined =
    acc && acc.account_name ? hexToAscii(acc.account_name) : undefined;
  accountNamesCache.hydrate(addr, accountName); // put it in cache

  return accountName;
};

export const getBrokerage = async (addr: string): Promise<number> => {
  const { brokerage } = await fetch(`/wallet/getBrokerage?address=${encodeURIComponent(addr)}`);
  srBrokeragesCache.hydrate(addr, brokerage); // put it in cache

  return brokerage;
};

const superRepresentativesCache = makeLRUCache(
  async (): Promise<SuperRepresentative[]> => {
    const superRepresentatives = await fetchSuperRepresentatives();
    log(
      "tron/superRepresentatives",
      "loaded " + superRepresentatives.length + " super representatives",
    );
    return superRepresentatives;
  },
  () => "",
  hours(1, 300),
);

export const getTronSuperRepresentatives = async (): Promise<SuperRepresentative[]> => {
  return await superRepresentativesCache();
};

export const hydrateSuperRepresentatives = (list: SuperRepresentative[]) => {
  log("tron/superRepresentatives", "hydrate " + list.length + " super representatives");
  superRepresentativesCache.hydrate("", list);
};

const fetchSuperRepresentatives = async (): Promise<SuperRepresentative[]> => {
  const result = await fetch(`/wallet/listwitnesses`);
  const sorted = result.witnesses.sort((a: any, b: any) => b.voteCount - a.voteCount);
  const superRepresentatives = await promiseAllBatched(3, sorted, async (w: any) => {
    const encodedAddress = encode58Check(w.address);
    const accountName = await accountNamesCache(encodedAddress);
    const brokerage = await srBrokeragesCache(encodedAddress);
    return {
      ...w,
      address: encodedAddress,
      name: accountName,
      brokerage,
      voteCount: w.voteCount || 0,
      isJobs: w.isJobs || false,
    };
  });
  hydrateSuperRepresentatives(superRepresentatives); // put it in cache

  return superRepresentatives;
};

export const getNextVotingDate = async (): Promise<Date> => {
  const { num } = await fetch(`/wallet/getnextmaintenancetime`);
  return new Date(num);
};

export const getTronSuperRepresentativeData = async (
  max: number | null | undefined,
): Promise<SuperRepresentativeData> => {
  const list = await getTronSuperRepresentatives();
  const nextVotingDate = await getNextVotingDate();
  return {
    list: max ? take(list, max) : list,
    totalVotes: sumBy(list, "voteCount"),
    nextVotingDate,
  };
};

export const voteTronSuperRepresentatives = async (
  account: Account,
  transaction: Transaction,
): Promise<SendTransactionDataSuccess> => {
  const payload = {
    owner_address: decode58Check(account.freshAddress),
    votes: transaction.votes.map(v => ({
      vote_address: decode58Check(v.address),
      vote_count: v.voteCount,
    })),
  };
  return await post(`/wallet/votewitnessaccount`, payload);
};

export const getUnwithdrawnReward = async (addr: string): Promise<BigNumber> => {
  try {
    const { reward = 0 } = await fetch(
      `/wallet/getReward?address=${encodeURIComponent(decode58Check(addr))}`,
    );
    return new BigNumber(reward);
  } catch {
    return Promise.resolve(new BigNumber(0));
  }
};

export const claimRewardTronTransaction = async (
  account: Account,
): Promise<SendTransactionDataSuccess> => {
  const url = `/wallet/withdrawbalance`;
  const data = {
    owner_address: decode58Check(account.freshAddress),
  };
  const result = await post(url, data);
  return result;
};
