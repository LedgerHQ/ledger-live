import { stringify } from "querystring";
import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import network from "@ledgerhq/live-network";
import { hours, makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import compact from "lodash/compact";
import sumBy from "lodash/sumBy";
import take from "lodash/take";
import { TronWeb, providers } from "tronweb";
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
  TrongridTxInfo,
  TronResource,
  UnDelegateResourceTransactionData,
  UnFreezeTransactionData,
  Vote,
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
  BlockWithTransactionsAPI,
  ChainParameters,
  ChainParametersAPI,
  isTransactionTronAPI,
  MalformedTransactionTronAPI,
  TransactionInfoByBlockNumAPI,
  TransactionResponseTronAPI,
  TransactionTronAPI,
  Trc20API,
  TriggerConstantContractParams,
  TriggerConstantContractResponse,
} from "./types";
import { abiEncodeTrc20Transfer, hexToAscii } from "./utils";

const getBaseApiUrl = () => coinConfig.getCoinConfig().explorer.url;

function isValidNativeTx(tx: TransactionTronAPI): boolean {
  // tx_id indicates a malformed/duplicated entry from TronGrid — these must be excluded.
  // Transactions with internal_transactions are valid and should be included.
  return !tx.tx_id;
}

function isSuccessfulTriggerSmartContract(tx: TrongridTxInfo): boolean {
  return tx.type === "TriggerSmartContract" && !tx.hasFailed;
}

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

// The resource-staking builders below take plain addresses/amounts rather than a live-common
// `Account`/`Transaction` pair: `network/` may not import `@ledgerhq/types-live` (see the
// coin-modules restricted-import rule), and `logic/` calls these directly. Addresses are base58 in,
// and decoded here.
export const freezeTronTransaction = async (
  ownerAddress: string,
  amount: BigNumber,
  resource: TronResource | null | undefined,
): Promise<SendTransactionDataSuccess> => {
  const txData: FreezeTransactionData = {
    frozen_balance: amount.toNumber(),
    resource,
    owner_address: decode58Check(ownerAddress),
  };
  const url = `/wallet/freezebalancev2`;
  const result = await post(url, txData);

  return result;
};

export const unfreezeTronTransaction = async (
  ownerAddress: string,
  amount: BigNumber,
  resource: TronResource | null | undefined,
): Promise<SendTransactionDataSuccess> => {
  const txData: UnFreezeTransactionData = {
    owner_address: decode58Check(ownerAddress),
    resource,
    unfreeze_balance: amount.toNumber(),
  };
  const url = `/wallet/unfreezebalancev2`;
  const result = await post(url, txData);

  return result;
};

export const withdrawExpireUnfreezeTronTransaction = async (
  ownerAddress: string,
): Promise<SendTransactionDataSuccess> => {
  const txData: WithdrawExpireUnfreezeTransactionData = {
    owner_address: decode58Check(ownerAddress),
  };
  const url = `/wallet/withdrawexpireunfreeze`;
  const result = await post(url, txData);

  return result;
};

// Named parameters: owner and receiver are both base58 addresses, so a positional call site can
// swap them with no type error and silently undelegate from the wrong account.
export const unDelegateResourceTransaction = async ({
  ownerAddress,
  receiverAddress,
  amount,
  resource,
}: {
  ownerAddress: string;
  receiverAddress: string;
  amount: BigNumber;
  resource: TronResource | null | undefined;
}): Promise<SendTransactionDataSuccess> => {
  const txData: UnDelegateResourceTransactionData = {
    balance: amount.toNumber(),
    resource,
    owner_address: decode58Check(ownerAddress),
    receiver_address: decode58Check(receiverAddress),
  };

  const url = `/wallet/undelegateresource`;
  const result = await post(url, txData);

  return result;
};

// Named parameters for the same reason as `unDelegateResourceTransaction` above.
export const legacyUnfreezeTronTransaction = async ({
  ownerAddress,
  resource,
  receiverAddress,
}: {
  ownerAddress: string;
  resource: TronResource | null | undefined;
  receiverAddress?: string;
}): Promise<SendTransactionDataSuccess> => {
  const txData: LegacyUnfreezeTransactionData = {
    resource,
    owner_address: decode58Check(ownerAddress),
    receiver_address: receiverAddress ? decode58Check(receiverAddress) : undefined,
  };
  const url = `/wallet/unfreezebalance`;
  const result = await post(url, txData);
  return result;
};

export async function getDelegatedResource(
  ownerAddress: string,
  receiverAddress: string,
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
    fromAddress: decode58Check(ownerAddress),
    toAddress: decode58Check(receiverAddress),
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

export async function triggerConstantContract({
  ownerAddress,
  contractAddress,
  functionSelector,
  parameter,
}: TriggerConstantContractParams): Promise<TriggerConstantContractResponse> {
  return await post<unknown, TriggerConstantContractResponse>(`/wallet/triggerconstantcontract`, {
    owner_address: ownerAddress,
    contract_address: contractAddress,
    function_selector: functionSelector,
    parameter,
  });
}

const CHAIN_PARAMETER_KEYS = {
  energyFee: "getEnergyFee",
  transactionFee: "getTransactionFee",
  createAccountFee: "getCreateAccountFee",
  createNewAccountFeeInSystemContract: "getCreateNewAccountFeeInSystemContract",
} as const;

const FALLBACK_CHAIN_PARAMETERS: ChainParameters = {
  energyFee: 100,
  transactionFee: 1000,
  createAccountFee: 100_000,
  createNewAccountFeeInSystemContract: 1_000_000,
};

const fetchChainParameters = async (): Promise<ChainParameters> => {
  const data = await fetch<ChainParametersAPI>(`/wallet/getchainparameters`);
  const byKey = new Map(data.chainParameter.map(entry => [entry.key, entry.value]));
  const resolved = {} as ChainParameters;
  let key: keyof ChainParameters;
  for (key in CHAIN_PARAMETER_KEYS) {
    const value = byKey.get(CHAIN_PARAMETER_KEYS[key]);
    if (typeof value === "number") {
      resolved[key] = value;
    } else {
      log("tron/chainParameters", `missing ${CHAIN_PARAMETER_KEYS[key]}, using fallback`);
      resolved[key] = FALLBACK_CHAIN_PARAMETERS[key];
    }
  }
  return resolved;
};

export const getChainParameters = makeLRUCache(fetchChainParameters, getBaseApiUrl, hours(1, 8));

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
    fee_limit: customFees ?? DEFAULT_TRC20_FEES_LIMIT,
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

/** Default expiration of 10 minutes (in seconds) after crafting time. */
export const DEFAULT_EXPIRATION = 600;

async function extendExpiration(
  preparedTransaction: any,
  expiration?: number,
): Promise<SendTransactionDataSuccess> {
  const extension = expiration ?? DEFAULT_EXPIRATION;
  const nodeExpiration: number = preparedTransaction.raw_data.expiration;
  const minFinalExpiration = Date.now() + 3000;

  // Tron nodes may not be properly synced, returning an expiration date in the past.
  // We throw an error that encourages users to drop their transaction and re-create a new one.
  // https://github.com/tronprotocol/tronweb/blob/9f8b559377d9215a4f5360e8526c6e7197bf5a5b/src/lib/TransactionBuilder/TransactionBuilder.ts#L2449-L2450
  if (nodeExpiration + extension * 1000 <= minFinalExpiration) {
    log("tron/extendExpiration", "Invalid extension provided", {
      preparedTransaction,
      extensionInS: extension,
      extensionInMs: extension * 1000,
      minFinalExpiration,
    });

    throw new InvalidTransactionError();
  }

  const HttpProvider = providers.HttpProvider;
  const fullNode = new HttpProvider(getBaseApiUrl());
  const solidityNode = new HttpProvider(getBaseApiUrl());
  const eventServer = new HttpProvider(getBaseApiUrl());
  const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

  return tronWeb.transactionBuilder.extendExpiration(preparedTransaction, extension);
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
  // TronGrid answers 200 with an empty `data` array for an address that has never been activated, so
  // an empty result already means "no such account". Transport failures must therefore propagate:
  // swallowing them here would make a TronGrid blip indistinguishable from an inactive account, and
  // callers read that as a zero balance, absent staking resources, or a recipient that cannot
  // receive TRC-20.
  const data = await fetch(`/v1/accounts/${addr}`);
  return data.data ?? [];
}

export async function getLastBlock(): Promise<Block> {
  const data = await fetch(`/wallet/getnowblock`);
  return toBlock(data);
}

export async function getBlock(blockNumber: number): Promise<Block> {
  const data: BlockWithTransactionsAPI = await post(`/wallet/getblock`, {
    id_or_num: String(blockNumber),
    detail: false,
  });
  return toBlock(data);
}

export async function getBlockWithTransactions(
  blockNumber: number,
): Promise<BlockWithTransactionsAPI> {
  return post(`/wallet/getblock`, { id_or_num: String(blockNumber), detail: true });
}

function toBlock(data: BlockWithTransactionsAPI): Block {
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

export async function getTransactionInfoByBlockNum(
  blockNum: number,
): Promise<TransactionInfoByBlockNumAPI[]> {
  return post<{ num: number }, TransactionInfoByBlockNumAPI[]>(
    `/wallet/gettransactioninfobyblocknum`,
    { num: blockNum },
  );
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

const getTransactions = async (
  url: string,
): Promise<{
  results: Array<TransactionTronAPI | MalformedTransactionTronAPI>;
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
  const results = transactions.data ?? [];
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

export type TxPageResult = {
  txs: TrongridTxInfo[];
  hasNextPage: boolean;
};

export type FetchTxsPageParams = {
  limit: number;
  minTimestamp: number;
  maxTimestamp?: number;
  order: "asc" | "desc";
};

export type FetchTxsPageResult = {
  nativeTxs: TxPageResult;
  trc20Txs: TxPageResult;
};

async function fetchSinglePage<T>(
  url: string,
  getTxs: (url: string) => Promise<{ results: Array<T>; nextUrl?: string }>,
): Promise<{ results: Array<T>; hasNextPage: boolean }> {
  const { results, nextUrl } = await getTxs(url);
  return { results, hasNextPage: !!nextUrl };
}

export async function fetchTronAccountTxsPage(
  addr: string,
  params: FetchTxsPageParams,
): Promise<FetchTxsPageResult> {
  const maxTimestampParam =
    params.maxTimestamp !== undefined ? `&max_timestamp=${params.maxTimestamp}` : "";
  const queryParams = `limit=${params.limit}&min_timestamp=${params.minTimestamp}${maxTimestampParam}&order_by=block_timestamp,${params.order}`;

  const [nativeResult, trc20Result] = await Promise.all([
    fetchSinglePage<TransactionTronAPI | MalformedTransactionTronAPI>(
      `${getBaseApiUrl()}/v1/accounts/${addr}/transactions?${queryParams}`,
      getTransactions,
    ),
    fetchSinglePage<Trc20API>(
      `${getBaseApiUrl()}/v1/accounts/${addr}/transactions/trc20?${queryParams}&get_detail=true`,
      getTrc20,
    ),
  ]);

  const nativeTxsFormatted = await Promise.all(
    nativeResult.results
      .filter(isTransactionTronAPI)
      .filter(isValidNativeTx)
      .map(tx => formatTrongridTxResponse(tx, accountNamesCache)),
  );

  const trc20TxsFormatted = compact(trc20Result.results.map(formatTrongridTrc20TxResponse));
  const trc20TxIds = new Set(trc20TxsFormatted.map(t => t.txID));
  const nativeDeduped = compact(nativeTxsFormatted)
    .filter(tx => !trc20TxIds.has(tx.txID))
    .filter(tx => !isSuccessfulTriggerSmartContract(tx));

  return {
    nativeTxs: { txs: nativeDeduped, hasNextPage: nativeResult.hasNextPage },
    trc20Txs: { txs: trc20TxsFormatted, hasNextPage: trc20Result.hasNextPage },
  };
}

export async function fetchTronAccountTxs(
  addr: string,
  shouldFetchMoreTxs: FetchTxsStopPredicate,
  params: FetchParams,
): Promise<TrongridTxInfo[]> {
  const adjustedLimitPerCall = params.hintGlobalLimit
    ? Math.min(params.limitPerCall, params.hintGlobalLimit)
    : params.limitPerCall;
  const queryParams = `limit=${adjustedLimitPerCall}&min_timestamp=${params.minTimestamp}&order_by=block_timestamp,${params.order}`;
  const nativeTxs = await Promise.all(
    (
      await getAllTransactions<TransactionTronAPI | MalformedTransactionTronAPI>(
        `${getBaseApiUrl()}/v1/accounts/${addr}/transactions?${queryParams}`,
        shouldFetchMoreTxs,
        getTransactions,
      )
    )
      .filter(isTransactionTronAPI)
      .filter(isValidNativeTx)
      .map(tx => formatTrongridTxResponse(tx, accountNamesCache)),
  );

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

  const trc20Txs = compact(
    (await getTrc20TxsWithRetry(null, 3)).map(formatTrongridTrc20TxResponse),
  );
  const trc20TxIds = new Set(trc20Txs.map(t => t.txID));
  const nativeDeduped = compact(nativeTxs)
    .filter(tx => !trc20TxIds.has(tx.txID))
    .filter(tx => !isSuccessfulTriggerSmartContract(tx));

  const txInfos: TrongridTxInfo[] = nativeDeduped
    .concat(trc20Txs)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
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
  // An address that holds no contract comes back as an empty object, which is the `undefined` case
  // below. A transport failure is not evidence about the address, so it propagates rather than
  // being reported as "not a contract" — validation would otherwise reject a legitimate TRC-20 send.
  const data = await post(`/wallet/getcontract`, {
    value: decode58Check(addr),
  });
  return Object.keys(data).length !== 0 ? data : undefined;
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

// cache for account names (name is unchanged over time)
export const accountNamesCache = makeLRUCache(
  async (addr: string): Promise<string | null | undefined> => getAccountName(addr),
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
  const result = await fetch<{ witnesses: SuperRepresentative[] }>(`/wallet/listwitnesses`);
  const sorted = result.witnesses.sort((a, b) => b.voteCount - a.voteCount);
  const superRepresentatives = sorted.map(w => ({
    ...w,
    address: encode58Check(w.address),
    voteCount: w.voteCount || 0,
    isJobs: w.isJobs || false,
  }));
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
  ownerAddress: string,
  votes: Vote[],
): Promise<SendTransactionDataSuccess> => {
  const payload = {
    owner_address: decode58Check(ownerAddress),
    votes: votes.map(v => ({
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
  ownerAddress: string,
): Promise<SendTransactionDataSuccess> => {
  const url = `/wallet/withdrawbalance`;
  const data = {
    owner_address: decode58Check(ownerAddress),
  };
  const result = await post(url, data);
  return result;
};
