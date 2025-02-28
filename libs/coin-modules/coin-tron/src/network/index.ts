import { hours, makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { log } from "@ledgerhq/logs";
import { Account, SubAccount, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import compact from "lodash/compact";
import drop from "lodash/drop";
import sumBy from "lodash/sumBy";
import take from "lodash/take";
import TronWeb from "tronweb";
import { TronTransactionExpired } from "../types/errors";
import coinConfig from "../config";
import { abiEncodeTrc20Transfer, hexToAscii } from "./utils";
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
  TronResource,
  TronTransactionInfo,
  TrongridTxInfo,
  UnDelegateResourceTransactionData,
  UnFreezeTransactionData,
  WithdrawExpireUnfreezeTransactionData,
} from "../types";
import {
  decode58Check,
  encode58Check,
  formatTrongridTrc20TxResponse,
  formatTrongridTxResponse,
} from "./format";
import {
  AccountTronAPI,
  isMalformedTransactionTronAPI,
  isTransactionTronAPI,
  MalformedTransactionTronAPI,
  TransactionResponseTronAPI,
  TransactionTronAPI,
  Trc20API,
} from "./types";
import { stringify } from "querystring";

const getBaseApiUrl = () => coinConfig.getCoinConfig().explorer.url;

async function post<T, U extends object = any>(endPoint: string, body: T): Promise<U> {
  const { data } = await network<U, T>({
    method: "POST",
    url: `${getBaseApiUrl()}${endPoint}`,
    data: body,
  });

  // Ugly but trongrid send a 200 status event if there are errors
  if ("Error" in data) {
    log("tron-error", stringify(data.Error as any), {
      endPoint,
      body,
    });
    throw new Error(stringify(data.Error as any));
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

// Send trx or trc10/trc20 tokens
export const createTronTransaction = async (
  account: Account,
  transaction: Transaction,
  subAccount: SubAccount | null | undefined,
): Promise<SendTransactionDataSuccess> => {
  const [tokenType, tokenId] =
    subAccount && subAccount.type === "TokenAccount"
      ? drop(subAccount.token.id.split("/"), 1)
      : [undefined, undefined];

  // trc20
  if (tokenType === "trc20" && tokenId) {
    const tokenContractAddress = (subAccount as TokenAccount).token.contractAddress;
    const txData: SmartContractTransactionData = {
      function_selector: "transfer(address,uint256)",
      fee_limit: 50000000,
      call_value: 0,
      contract_address: decode58Check(tokenContractAddress),
      parameter: abiEncodeTrc20Transfer(decode58Check(transaction.recipient), transaction.amount),
      owner_address: decode58Check(account.freshAddress),
    };
    const url = `/wallet/triggersmartcontract`;
    const { transaction: preparedTransaction } = await post(url, txData);
    return extendTronTxExpirationTimeBy10mn(preparedTransaction);
  } else {
    // trx/trc10
    const txData: SendTransactionData = {
      to_address: decode58Check(transaction.recipient),
      owner_address: decode58Check(account.freshAddress),
      amount: transaction.amount.toNumber(),
      asset_name: tokenId && Buffer.from(tokenId).toString("hex"),
    };
    const url = subAccount ? `/wallet/transferasset` : `/wallet/createtransaction`;
    const preparedTransaction = await post(url, txData);
    // for the ledger Vault we need to increase the expiration
    return extendTronTxExpirationTimeBy10mn(preparedTransaction);
  }
};

function extendTronTxExpirationTimeBy10mn(
  preparedTransaction: any,
): Promise<SendTransactionDataSuccess> {
  const VAULT_EXPIRATION_TIME = 600;
  const HttpProvider = TronWeb.providers.HttpProvider;
  const fullNode = new HttpProvider(getBaseApiUrl());
  const solidityNode = new HttpProvider(getBaseApiUrl());
  const eventServer = new HttpProvider(getBaseApiUrl());
  const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);
  //FIXME: test it and rewrite it
  return tronWeb.transactionBuilder.extendExpiration(
    preparedTransaction,
    VAULT_EXPIRATION_TIME,
  ) as unknown as Promise<SendTransactionDataSuccess>;
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
      throw new Error(result.message);
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

export async function fetchTronAccount(addr: string): Promise<AccountTronAPI[]> {
  try {
    const data = await fetch(`/v1/accounts/${addr}`);
    return data.data;
  } catch (e) {
    return [];
  }
}

export async function getAccount(address: string) {
  return await post("/wallet/getaccount", {
    address,
    visible: true,
  });
}

export async function fetchCurrentBlockHeight() {
  const data = await fetch(`/wallet/getnowblock`);
  return data.block_header.raw_data.number;
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

export async function fetchTronAccountTxs(
  addr: string,
  shouldFetchMoreTxs: (
    txs: Array<TransactionTronAPI | Trc20API | MalformedTransactionTronAPI>,
  ) => boolean,
  cacheTransactionInfoById: Record<string, TronTransactionInfo>,
): Promise<TrongridTxInfo[]> {
  const entireTxs = (
    await getAllTransactions<
      (TransactionTronAPI & { detail?: TronTransactionInfo }) | MalformedTransactionTronAPI
    >(
      `${getBaseApiUrl()}/v1/accounts/${addr}/transactions?limit=100`,
      shouldFetchMoreTxs,
      getTransactions(cacheTransactionInfoById),
    )
  )
    .filter((tx): tx is TransactionTronAPI => isTransactionTronAPI(tx))
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
  const entireTrc20Txs = (
    await getAllTransactions<Trc20API>(
      `${getBaseApiUrl()}/v1/accounts/${addr}/transactions/trc20?get_detail=true`,
      shouldFetchMoreTxs,
      getTrc20,
    )
  ).map(tx => formatTrongridTrc20TxResponse(tx));

  const txInfos: TrongridTxInfo[] = compact(entireTxs.concat(entireTrc20Txs)).sort(
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
  } catch (e) {
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
  } catch (e) {
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
