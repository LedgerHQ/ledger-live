// @flow
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
  TronTransactionInfo
} from "../families/tron/types";
import type { Account, SubAccount } from "../types";
import {
  decode58Check,
  encode58Check,
  abiEncodeTrc20Transfer,
  formatTrongridTxResponse,
  hexToAscii
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

const baseApiUrl: string = getEnv("API_TRONGRID_PROXY");

async function post(url: string, body: Object) {
  const { data } = await network({
    method: "POST",
    url,
    data: body
  });

  // Ugly but trongrid send a 200 status event if there are errors
  if (data.Error) {
    log("tron-error", data.Error, { url, body });
    throw new Error(data.Error);
  }

  return data;
}

async function fetch(url: string) {
  const { data } = await network({
    method: "GET",
    url
  });

  // Ugly but trongrid send a 200 status event if there are errors
  if (data.Error) {
    log("tron-error", data.Error, { url });
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
    receiver_address: t.recipient ? decode58Check(t.recipient) : undefined
  };

  const url = `${baseApiUrl}/wallet/freezebalance`;

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
    receiver_address: t.recipient ? decode58Check(t.recipient) : undefined
  };

  const url = `${baseApiUrl}/wallet/unfreezebalance`;
  const result = await post(url, txData);

  return result;
};

// Send trx or trc10/trc20 tokens
export const createTronTransaction = async (
  a: Account,
  t: Transaction,
  subAccount: ?SubAccount
): Promise<SendTransactionDataSuccess> => {
  const [tokenType, tokenId] =
    subAccount && subAccount.type === "TokenAccount"
      ? drop(subAccount.token.id.split("/"), 1)
      : [undefined, undefined];

  // trc20
  if (tokenType === "trc20" && tokenId) {
    const txData: SmartContractTransactionData = {
      function_selector: "transfer(address,uint256)",
      fee_limit: 10000000,
      call_value: 0,
      contract_address: decode58Check(tokenId),
      parameter: abiEncodeTrc20Transfer(decode58Check(t.recipient), t.amount),
      owner_address: decode58Check(a.freshAddress)
    };

    const url = `${baseApiUrl}/wallet/triggersmartcontract`;

    const result = await post(url, txData);

    return result.transaction;
  } else {
    // trx/trc10

    const txData: SendTransactionData = {
      to_address: decode58Check(t.recipient),
      owner_address: decode58Check(a.freshAddress),
      amount: t.amount.toNumber(),
      asset_name: tokenId && Buffer.from(tokenId).toString("hex")
    };

    const url = subAccount
      ? `${baseApiUrl}/wallet/transferasset`
      : `${baseApiUrl}/wallet/createtransaction`;

    const preparedTransaction = await post(url, txData);

    return preparedTransaction;
  }
};

export const broadcastTron = async (
  trxTransaction: SendTransactionDataSuccess
) => {
  const result = await post(
    `${baseApiUrl}/wallet/broadcasttransaction`,
    trxTransaction
  );

  if (result.code === "TRANSACTION_EXPIRATION_ERROR") {
    throw new TronTransactionExpired();
  }

  return result;
};

export async function fetchTronAccount(addr: string) {
  try {
    const data = await fetch(`${baseApiUrl}/v1/accounts/${addr}`);
    return data.data;
  } catch (e) {
    return [];
  }
}

export async function fetchCurrentBlockHeight() {
  const data = await fetch(`${baseApiUrl}/wallet/getnowblock`);
  return data.block_header.raw_data.number;
}

// For the moment, fetching transaction info is the only way to get fees from a transaction
async function fetchTronTxDetail(txId: string): Promise<TronTransactionInfo> {
  const { fee, blockNumber, withdraw_amount, unfreeze_amount } = await fetch(
    `${baseApiUrl}/wallet/gettransactioninfobyid?value=${encodeURIComponent(
      txId
    )}`
  );
  return { fee, blockNumber, withdraw_amount, unfreeze_amount };
}

export async function fetchTronAccountTxs(
  addr: string,
  shouldFetchMoreTxs: (Object[]) => boolean,
  cacheTransactionInfoById: { [_: string]: TronTransactionInfo }
): Promise<TrongridTxInfo[]> {
  const getTxs = async (url: string) =>
    fetch(url).then(resp => {
      const nextUrl = get(resp, "meta.links.next");

      const resultsWithTxInfo = promiseAllBatched(
        3,
        resp.data || [],
        async tx => {
          if (!tx.txID) {
            return tx;
          }
          const detail =
            cacheTransactionInfoById[tx.txID] ||
            (await fetchTronTxDetail(tx.txID));
          cacheTransactionInfoById[tx.txID] = detail;
          return { ...tx, detail };
        }
      ).then(results => ({ results, nextUrl }));

      return resultsWithTxInfo;
    });

  const getEntireTxs = async (initialUrl: string) => {
    let all = [];
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
      `${baseApiUrl}/v1/accounts/${addr}/transactions?limit=100`
    )
  ).map(tx => formatTrongridTxResponse(tx));

  // we need to fetch and filter trc20 'IN' transactions from another endpoint
  const entireTrc20InTxs = (
    await getEntireTxs(`${baseApiUrl}/v1/accounts/${addr}/transactions/trc20`)
  )
    .filter(tx => tx.to === addr)
    .map(tx => formatTrongridTxResponse(tx, true));

  const txInfos: TrongridTxInfo[] = entireTxs
    .concat(entireTrc20InTxs)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return txInfos;
}

export const getTronAccountNetwork = async (
  address: string
): Promise<NetworkInfo> => {
  const result = await fetch(
    `${baseApiUrl}/wallet/getaccountresource?address=${encodeURIComponent(
      decode58Check(address)
    )}`
  );

  const {
    freeNetUsed = 0,
    freeNetLimit = 0,
    NetUsed = 0,
    NetLimit = 0,
    EnergyLimit = 0
  } = result;

  return {
    family: "tron",
    freeNetUsed: BigNumber(freeNetUsed),
    freeNetLimit: BigNumber(freeNetLimit),
    netUsed: BigNumber(NetUsed),
    netLimit: BigNumber(NetLimit),
    energyLimit: EnergyLimit ? BigNumber(EnergyLimit) : undefined
  };
};

export const validateAddress = async (address: string): Promise<boolean> => {
  try {
    const result = await post(`${baseApiUrl}/wallet/validateaddress`, {
      address: decode58Check(address)
    });
    return result.result || false;
  } catch (e) {
    // FIXME we should not silent errors!
    log("tron-error", "validateAddress fails with " + e.message, { address });
    return false;
  }
};

// cache for account names (name is unchanged over time)
const accountNamesCache = makeLRUCache(
  async (addr: string): Promise<?string> => getAccountName(addr),
  (addr: string) => addr,
  {
    max: 300,
    maxAge: 180 * 60 * 1000 // 3hours
  }
);

// cache for super representative brokerages (brokerage is unchanged over time)
const srBrokeragesCache = makeLRUCache(
  async (addr: string): Promise<number> => getBrokerage(addr),
  (addr: string) => addr,
  {
    max: 300,
    maxAge: 180 * 60 * 1000 // 3hours
  }
);

export const getAccountName = async (addr: string): Promise<?string> => {
  const tronAcc = await fetchTronAccount(addr);
  const acc = tronAcc[0];
  const accountName: ?string = acc.account_name
    ? hexToAscii(acc.account_name)
    : undefined;

  accountNamesCache.hydrate(addr, accountName); // put it in cache

  return accountName;
};

export const getBrokerage = async (addr: string): Promise<number> => {
  const { brokerage } = await fetch(
    `${baseApiUrl}/wallet/getBrokerage?address=${encodeURIComponent(addr)}`
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
    maxAge: 60 * 60 * 1000 // 1hour
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
  const result = await fetch(`${baseApiUrl}/wallet/listwitnesses`);
  const sorted = result.witnesses.sort((a, b) => b.voteCount - a.voteCount);

  const superRepresentatives = await promiseAllBatched(3, sorted, async w => {
    const encodedAddress = encode58Check(w.address);
    const accountName = await accountNamesCache(encodedAddress);
    const brokerage = await srBrokeragesCache(encodedAddress);
    return {
      ...w,
      address: encodedAddress,
      name: accountName,
      brokerage,
      voteCount: w.voteCount || 0,
      isJobs: w.isJobs || false
    };
  });

  hydrateSuperRepresentatives(superRepresentatives); // put it in cache

  return superRepresentatives;
};

export const getNextVotingDate = async (): Promise<Date> => {
  const { num } = await fetch(`${baseApiUrl}/wallet/getnextmaintenancetime`);
  return new Date(num);
};

export const getTronSuperRepresentativeData = async (
  max: ?number
): Promise<SuperRepresentativeData> => {
  const list = await getTronSuperRepresentatives();
  const nextVotingDate = await getNextVotingDate();

  return {
    list: max ? take(list, max) : list,
    totalVotes: sumBy(list, "voteCount"),
    nextVotingDate
  };
};

export const voteTronSuperRepresentatives = async (
  a: Account,
  t: Transaction
): Promise<SendTransactionDataSuccess> => {
  const payload = {
    owner_address: decode58Check(a.freshAddress),
    votes: t.votes.map(v => ({
      vote_address: decode58Check(v.address),
      vote_count: v.voteCount
    }))
  };

  return await post(`${baseApiUrl}/wallet/votewitnessaccount`, payload);
};

export const extractBandwidthInfo = (
  networkInfo: ?NetworkInfo
): BandwidthInfo => {
  // Calculate bandwidth info :
  if (networkInfo) {
    const { freeNetUsed, freeNetLimit, netUsed, netLimit } = networkInfo;

    return {
      freeUsed: freeNetUsed,
      freeLimit: freeNetLimit,
      gainedUsed: netUsed,
      gainedLimit: netLimit
    };
  }

  return {
    freeUsed: BigNumber(0),
    freeLimit: BigNumber(0),
    gainedUsed: BigNumber(0),
    gainedLimit: BigNumber(0)
  };
};

export const getTronResources = async (
  acc: Object,
  txs: TrongridTxInfo[],
  cacheTransactionInfoById: { [_: string]: TronTransactionInfo }
): Promise<TronResources> => {
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

  const energy = BigNumber(tronNetworkInfo.energyLimit || 0);
  const bandwidth = extractBandwidthInfo(tronNetworkInfo);

  const frozen = {
    bandwidth: frozenBandwidth
      ? {
          amount: BigNumber(frozenBandwidth.frozen_balance),
          expiredAt: new Date(frozenBandwidth.expire_time)
        }
      : undefined,
    energy: frozenEnergy
      ? {
          amount: BigNumber(frozenEnergy.frozen_balance),
          expiredAt: new Date(frozenEnergy.expire_time)
        }
      : undefined
  };

  const delegatedFrozen = {
    bandwidth: delegatedFrozenBandwidth
      ? { amount: BigNumber(delegatedFrozenBandwidth) }
      : undefined,
    energy: delegatedFrozenEnergy
      ? { amount: BigNumber(delegatedFrozenEnergy) }
      : undefined
  };

  const tronPower = BigNumber(get(frozen, "bandwidth.amount", 0))
    .plus(get(frozen, "energy.amount", 0))
    .plus(get(delegatedFrozen, "bandwidth.amount", 0))
    .plus(get(delegatedFrozen, "energy.amount", 0))
    .dividedBy(1000000)
    .decimalPlaces(3, BigNumber.ROUND_HALF_DOWN)
    .toNumber();

  const votes = get(acc, "votes", []).map(v => ({
    address: encode58Check(v.vote_address),
    voteCount: v.vote_count
  }));

  const lastWithdrawnRewardDate = acc.latest_withdraw_time
    ? new Date(acc.latest_withdraw_time)
    : undefined;

  // TODO: rely on the account object when trongrid will provide this info.
  const getLastVotedDate = (txs: TrongridTxInfo[]): ?Date => {
    const lastOp = txs.find(({ type }) => type === "VoteWitnessContract");
    return lastOp ? lastOp.date : null;
  };
  const lastVotedDate = getLastVotedDate(txs);

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
    cacheTransactionInfoById
  };
};

export const getUnwithdrawnReward = async (
  addr: string
): Promise<BigNumber> => {
  try {
    const { reward = 0 } = await fetch(
      `${baseApiUrl}/wallet/getReward?address=${encodeURIComponent(
        decode58Check(addr)
      )}`
    );
    return BigNumber(reward);
  } catch (e) {
    return Promise.resolve(BigNumber(0));
  }
};

export const claimRewardTronTransaction = async (
  account: Account
): Promise<SendTransactionDataSuccess> => {
  const url = `${baseApiUrl}/wallet/withdrawbalance`;
  const data = { owner_address: decode58Check(account.freshAddress) };
  const result = await post(url, data);
  return result;
};
