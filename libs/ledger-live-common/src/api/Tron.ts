import { BigNumber } from "bignumber.js";
import type {
  Transaction,
  TrongridTxInfo,
  SendTransactionData,
  SendTransactionDataSuccess,
  SmartContractTransactionData,
  FreezeTransactionData,
  UnfreezeTransactionData,
  NetworkInfo,
  BandwidthInfo,
  SuperRepresentative,
  SuperRepresentativeData,
  TronResources,
  TronTransactionInfo,
} from "../families/tron/types";
import {
  decode58Check,
  encode58Check,
  abiEncodeTrc20Transfer,
  formatTrongridTxResponse,
  formatTrongridTrc20TxResponse,
  hexToAscii,
  defaultTronResources,
} from "../families/tron/utils";
import { log } from "@ledgerhq/logs";
import { TronTransactionExpired } from "../errors";
import network from "../network";
import { promiseAllBatched } from "../promise";
import { makeLRUCache } from "../cache";
import { getEnv } from "../env";
import get from "lodash/get";
import drop from "lodash/drop";
import sumBy from "lodash/sumBy";
import take from "lodash/take";
import compact from "lodash/compact";
import { Account, SubAccount } from "@ledgerhq/types-live";

const getBaseApiUrl = () => getEnv("API_TRONGRID_PROXY");

async function post(url: string, body: Record<string, any>) {
  const { data } = await network({
    method: "POST",
    url,
    data: body,
  });

  // Ugly but trongrid send a 200 status event if there are errors
  if (data.Error) {
    log("tron-error", data.Error, {
      url,
      body,
    });
    throw new Error(data.Error);
  }

  return data;
}

async function fetch(url: string) {
  const { data } = await network({
    method: "GET",
    url,
  });

  // Ugly but trongrid send a 200 status event if there are errors
  if (data.Error) {
    log("tron-error", data.Error, {
      url,
    });
    throw new Error(data.Error);
  }

  return data;
}

export const freezeTronTransaction = async (
  a: Account,
  t: Transaction
): Promise<SendTransactionDataSuccess> => {
  const txData: FreezeTransactionData = {
    frozen_balance: t.amount.toNumber(),
    frozen_duration: t.duration || 3,
    resource: t.resource,
    owner_address: decode58Check(a.freshAddress),
    receiver_address: t.recipient ? decode58Check(t.recipient) : undefined,
  };
  const url = `${getBaseApiUrl()}/wallet/freezebalance`;
  const result = await post(url, txData);
  return result;
};

export const unfreezeTronTransaction = async (
  a: Account,
  t: Transaction
): Promise<SendTransactionDataSuccess> => {
  const txData: UnfreezeTransactionData = {
    resource: t.resource,
    owner_address: decode58Check(a.freshAddress),
    receiver_address: t.recipient ? decode58Check(t.recipient) : undefined,
  };
  const url = `${getBaseApiUrl()}/wallet/unfreezebalance`;
  const result = await post(url, txData);
  return result;
};

// Send trx or trc10/trc20 tokens
export const createTronTransaction = async (
  a: Account,
  t: Transaction,
  subAccount: SubAccount | null | undefined
): Promise<SendTransactionDataSuccess> => {
  const [tokenType, tokenId] =
    subAccount && subAccount.type === "TokenAccount"
      ? drop(subAccount.token.id.split("/"), 1)
      : [undefined, undefined];

  // trc20
  if (tokenType === "trc20" && tokenId) {
    const txData: SmartContractTransactionData = {
      function_selector: "transfer(address,uint256)",
      fee_limit: 50000000,
      call_value: 0,
      contract_address: decode58Check(tokenId),
      parameter: abiEncodeTrc20Transfer(decode58Check(t.recipient), t.amount),
      owner_address: decode58Check(a.freshAddress),
    };
    const url = `${getBaseApiUrl()}/wallet/triggersmartcontract`;
    const result = await post(url, txData);
    return result.transaction;
  } else {
    // trx/trc10
    const txData: SendTransactionData = {
      to_address: decode58Check(t.recipient),
      owner_address: decode58Check(a.freshAddress),
      amount: t.amount.toNumber(),
      asset_name: tokenId && Buffer.from(tokenId).toString("hex"),
    };
    const url = subAccount
      ? `${getBaseApiUrl()}/wallet/transferasset`
      : `${getBaseApiUrl()}/wallet/createtransaction`;
    const preparedTransaction = await post(url, txData);
    return preparedTransaction;
  }
};
export const broadcastTron = async (
  trxTransaction: SendTransactionDataSuccess
) => {
  const result = await post(
    `${getBaseApiUrl()}/wallet/broadcasttransaction`,
    trxTransaction
  );

  if (result.code === "TRANSACTION_EXPIRATION_ERROR") {
    throw new TronTransactionExpired();
  }

  return result;
};
export async function fetchTronAccount(addr: string) {
  try {
    const data = await fetch(`${getBaseApiUrl()}/v1/accounts/${addr}`);
    return data.data;
  } catch (e) {
    return [];
  }
}
export async function fetchCurrentBlockHeight() {
  const data = await fetch(`${getBaseApiUrl()}/wallet/getnowblock`);
  return data.block_header.raw_data.number;
}

// For the moment, fetching transaction info is the only way to get fees from a transaction
async function fetchTronTxDetail(txId: string): Promise<TronTransactionInfo> {
  const { fee, blockNumber, withdraw_amount, unfreeze_amount } = await fetch(
    `${getBaseApiUrl()}/wallet/gettransactioninfobyid?value=${encodeURIComponent(
      txId
    )}`
  );
  return {
    fee,
    blockNumber,
    withdraw_amount,
    unfreeze_amount,
  };
}

export async function fetchTronAccountTxs(
  addr: string,
  shouldFetchMoreTxs: (arg0: Record<string, any>[]) => boolean,
  cacheTransactionInfoById: Record<string, TronTransactionInfo>
): Promise<TrongridTxInfo[]> {
  const getTxs = async (url: string) =>
    fetch(url).then((resp) => {
      const nextUrl = get(resp, "meta.links.next");
      const resultsWithTxInfo = promiseAllBatched(
        3,
        resp.data || [],
        async (tx: any) => {
          // It happened that Trongrid API had some rollback
          // So they may not provide the fee on this api and we had to check detail.
          // It just a backward compatibility in case of
          const fee = get(
            tx,
            "ret[0].fee",
            get(tx, "detail.ret[0].fee", undefined)
          );
          const txID = tx.txID || tx.transaction_id;

          if (!txID || fee !== undefined) {
            return tx;
          }

          const detail =
            cacheTransactionInfoById[txID] || (await fetchTronTxDetail(txID));
          cacheTransactionInfoById[txID] = detail;
          return { ...tx, detail };
        }
      ).then((results) => ({
        results,
        nextUrl,
      }));
      return resultsWithTxInfo;
    });

  const getEntireTxs = async (initialUrl: string) => {
    let all: any[] = [];
    let url = initialUrl;

    while (url && shouldFetchMoreTxs(all)) {
      const { nextUrl, results } = await getTxs(url);
      url = nextUrl;
      all = all.concat(results);
    }

    return all;
  };

  const entireTxs = (
    await getEntireTxs(
      `${getBaseApiUrl()}/v1/accounts/${addr}/transactions?limit=100`
    )
  )
    .filter((tx) => {
      // custom smart contract tx has internal txs
      const hasInternalTxs =
        tx.txID &&
        tx.internal_transactions &&
        tx.internal_transactions.length > 0;
      // and also a duplicated malformed tx that we have to ignore
      const isDuplicated = tx.tx_id;
      const type = get(tx, "raw_data.contract[0].type", "");

      if (hasInternalTxs) {
        // log once
        log("tron-error", `unsupported transaction ${tx.txID}`);
      }

      return (
        !isDuplicated && !hasInternalTxs && type !== "TriggerSmartContract"
      );
    })
    .map((tx) => formatTrongridTxResponse(tx));
  // we need to fetch and filter trc20 transactions from another endpoint
  const entireTrc20Txs = (
    await getEntireTxs(
      `${getBaseApiUrl()}/v1/accounts/${addr}/transactions/trc20?get_detail=true`
    )
  ).map((tx) => formatTrongridTrc20TxResponse(tx));
  const txInfos: TrongridTxInfo[] = compact(
    entireTxs.concat(entireTrc20Txs)
  ).sort((a, b) => b.date.getTime() - a.date.getTime());
  return txInfos;
}
export const getContractUserEnergyRatioConsumption = async (
  address: string
): Promise<number> => {
  const result = await fetchTronContract(address);
  if (result) {
    const { consume_user_resource_percent } = result;
    return consume_user_resource_percent;
  }
  return 0;
};
export const fetchTronContract = async (
  addr: string
): Promise<Record<string, any> | undefined> => {
  try {
    const data = await post(`${getBaseApiUrl()}/wallet/getcontract`, {
      value: decode58Check(addr),
    });
    return Object.keys(data).length !== 0 ? data : undefined;
  } catch (e) {
    return undefined;
  }
};
export const getTronAccountNetwork = async (
  address: string
): Promise<NetworkInfo> => {
  const result = await fetch(
    `${getBaseApiUrl()}/wallet/getaccountresource?address=${encodeURIComponent(
      decode58Check(address)
    )}`
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
    const result = await post(`${getBaseApiUrl()}/wallet/validateaddress`, {
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
  async (addr: string): Promise<string | null | undefined> =>
    getAccountName(addr),
  (addr: string) => addr,
  {
    max: 300,
    ttl: 180 * 60 * 1000, // 3hours
  }
);
// cache for super representative brokerages (brokerage is unchanged over time)
const srBrokeragesCache = makeLRUCache(
  async (addr: string): Promise<number> => getBrokerage(addr),
  (addr: string) => addr,
  {
    max: 300,
    ttl: 180 * 60 * 1000, // 3hours
  }
);
export const getAccountName = async (
  addr: string
): Promise<string | null | undefined> => {
  const tronAcc = await fetchTronAccount(addr);
  const acc = tronAcc[0];
  const accountName: string | null | undefined =
    acc && acc.account_name ? hexToAscii(acc.account_name) : undefined;
  accountNamesCache.hydrate(addr, accountName); // put it in cache

  return accountName;
};
export const getBrokerage = async (addr: string): Promise<number> => {
  const { brokerage } = await fetch(
    `${getBaseApiUrl()}/wallet/getBrokerage?address=${encodeURIComponent(addr)}`
  );
  srBrokeragesCache.hydrate(addr, brokerage); // put it in cache

  return brokerage;
};
const superRepresentativesCache = makeLRUCache(
  async (): Promise<SuperRepresentative[]> => {
    const superRepresentatives = await fetchSuperRepresentatives();
    log(
      "tron/superRepresentatives",
      "loaded " + superRepresentatives.length + " super representatives"
    );
    return superRepresentatives;
  },
  () => "",
  {
    max: 300,
    ttl: 60 * 60 * 1000, // 1hour
  }
);
export const getTronSuperRepresentatives = async (): Promise<
  SuperRepresentative[]
> => {
  return await superRepresentativesCache();
};
export const hydrateSuperRepresentatives = (list: SuperRepresentative[]) => {
  log(
    "tron/superRepresentatives",
    "hydrate " + list.length + " super representatives"
  );
  superRepresentativesCache.hydrate("", list);
};

const fetchSuperRepresentatives = async (): Promise<SuperRepresentative[]> => {
  const result = await fetch(`${getBaseApiUrl()}/wallet/listwitnesses`);
  const sorted = result.witnesses.sort((a, b) => b.voteCount - a.voteCount);
  const superRepresentatives = await promiseAllBatched(
    3,
    sorted,
    async (w: any) => {
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
    }
  );
  hydrateSuperRepresentatives(superRepresentatives); // put it in cache

  return superRepresentatives;
};

export const getNextVotingDate = async (): Promise<Date> => {
  const { num } = await fetch(
    `${getBaseApiUrl()}/wallet/getnextmaintenancetime`
  );
  return new Date(num);
};
export const getTronSuperRepresentativeData = async (
  max: number | null | undefined
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
  a: Account,
  t: Transaction
): Promise<SendTransactionDataSuccess> => {
  const payload = {
    owner_address: decode58Check(a.freshAddress),
    votes: t.votes.map((v) => ({
      vote_address: decode58Check(v.address),
      vote_count: v.voteCount,
    })),
  };
  return await post(`${getBaseApiUrl()}/wallet/votewitnessaccount`, payload);
};
export const extractBandwidthInfo = (
  networkInfo: NetworkInfo | null | undefined
): BandwidthInfo => {
  // Calculate bandwidth info :
  if (networkInfo) {
    const { freeNetUsed, freeNetLimit, netUsed, netLimit } = networkInfo;
    return {
      freeUsed: freeNetUsed,
      freeLimit: freeNetLimit,
      gainedUsed: netUsed,
      gainedLimit: netLimit,
    };
  }

  return {
    freeUsed: new BigNumber(0),
    freeLimit: new BigNumber(0),
    gainedUsed: new BigNumber(0),
    gainedLimit: new BigNumber(0),
  };
};

export function getTronResources(): Promise<TronResources>;
export function getTronResources(
  acc: Record<string, any>,
  txs: TrongridTxInfo[],
  cacheTransactionInfoById: Record<string, TronTransactionInfo>
): Promise<TronResources>;
export async function getTronResources(
  acc?: Record<string, any>,
  txs?: TrongridTxInfo[],
  cacheTransactionInfoById: Record<string, TronTransactionInfo> = {}
): Promise<TronResources> {
  if (!acc) {
    return defaultTronResources;
  }
  const frozenBandwidth = get(acc, "frozen[0]", undefined);
  const frozenEnergy = get(
    acc,
    "account_resource.frozen_balance_for_energy",
    undefined
  );
  const delegatedFrozenBandwidth = get(
    acc,
    "delegated_frozen_balance_for_bandwidth",
    undefined
  );
  const delegatedFrozenEnergy = get(
    acc,
    "account_resource.delegated_frozen_balance_for_energy",
    undefined
  );
  const encodedAddress = encode58Check(acc.address);
  const tronNetworkInfo = await getTronAccountNetwork(encodedAddress);
  const unwithdrawnReward = await getUnwithdrawnReward(encodedAddress);
  const energy = tronNetworkInfo.energyLimit.minus(tronNetworkInfo.energyUsed);
  const bandwidth = extractBandwidthInfo(tronNetworkInfo);
  const frozen = {
    bandwidth: frozenBandwidth
      ? {
          amount: new BigNumber(frozenBandwidth.frozen_balance),
          expiredAt: new Date(frozenBandwidth.expire_time),
        }
      : undefined,
    energy: frozenEnergy
      ? {
          amount: new BigNumber(frozenEnergy.frozen_balance),
          expiredAt: new Date(frozenEnergy.expire_time),
        }
      : undefined,
  };
  const delegatedFrozen = {
    bandwidth: delegatedFrozenBandwidth
      ? {
          amount: new BigNumber(delegatedFrozenBandwidth),
        }
      : undefined,
    energy: delegatedFrozenEnergy
      ? {
          amount: new BigNumber(delegatedFrozenEnergy),
        }
      : undefined,
  };
  const tronPower = new BigNumber(get(frozen, "bandwidth.amount", 0))
    .plus(get(frozen, "energy.amount", 0))
    .plus(get(delegatedFrozen, "bandwidth.amount", 0))
    .plus(get(delegatedFrozen, "energy.amount", 0))
    .dividedBy(1000000)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toNumber();
  const votes = get(acc, "votes", []).map((v) => ({
    address: v.vote_address,
    voteCount: v.vote_count,
  }));
  const lastWithdrawnRewardDate = acc.latest_withdraw_time
    ? new Date(acc.latest_withdraw_time)
    : undefined;

  // TODO: rely on the account object when trongrid will provide this info.
  const getLastVotedDate = (txs: TrongridTxInfo[]): Date | null | undefined => {
    const lastOp = txs.find(({ type }) => type === "VoteWitnessContract");
    return lastOp ? lastOp.date : null;
  };
  const lastVotedDate = txs ? getLastVotedDate(txs) : undefined;

  return {
    energy,
    bandwidth,
    frozen,
    delegatedFrozen,
    votes,
    tronPower,
    unwithdrawnReward,
    lastWithdrawnRewardDate,
    lastVotedDate,
    cacheTransactionInfoById,
  };
}

export const getUnwithdrawnReward = async (
  addr: string
): Promise<BigNumber> => {
  try {
    const { reward = 0 } = await fetch(
      `${getBaseApiUrl()}/wallet/getReward?address=${encodeURIComponent(
        decode58Check(addr)
      )}`
    );
    return new BigNumber(reward);
  } catch (e) {
    return Promise.resolve(new BigNumber(0));
  }
};
export const claimRewardTronTransaction = async (
  account: Account
): Promise<SendTransactionDataSuccess> => {
  const url = `${getBaseApiUrl()}/wallet/withdrawbalance`;
  const data = {
    owner_address: decode58Check(account.freshAddress),
  };
  const result = await post(url, data);
  return result;
};
