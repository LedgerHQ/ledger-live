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
  TronResources
} from "../families/tron/types";
import type { Account, SubAccount, Operation } from "../types";
import {
  decode58Check,
  encode58Check,
  abiEncodeTrc20Transfer,
  formatTrongridTxResponse,
  hexToAscii
} from "../families/tron/utils";
import { log } from "@ledgerhq/logs";
import network from "../network";
import { retry } from "../promise";
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
  if (data.Error) throw new Error(data.Error);

  return data;
}

async function fetch(url: string) {
  const { data } = await network({
    method: "GET",
    url
  });

  // Ugly but trongrid send a 200 status event if there are errors
  if (data.Error) throw new Error(data.Error);

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

// For the moment, fetching transaction info is the only way to get fees from a transaction
async function fetchTronTxDetail(txId: string) {
  return await post(`${baseApiUrl}/wallet/gettransactioninfobyid`, {
    value: txId
  });
}

export async function fetchTronAccountTxs(
  addr: string,
  shouldFetchMoreTxs: (Operation[]) => boolean
): Promise<TrongridTxInfo[]> {
  const getTxs = async (url: string) =>
    fetch(url).then(resp => {
      const nextUrl = get(resp, "meta.links.next");

      const resultsWithTxInfo = Promise.all(
        (resp.data || []).map(tx => {
          const fetchedTxDetail = fetchTronTxDetail(tx.txID);
          return fetchedTxDetail.then(detail => ({ ...tx, detail }));
        })
      ).then(results => ({ results, nextUrl }));

      return resultsWithTxInfo;
    });

  const getEntireTxs = async (url: string) => {
    const response = await getTxs(url);

    if (shouldFetchMoreTxs(response.results) && response.nextUrl) {
      const nextResponse = await getEntireTxs(response.nextUrl);
      return {
        results: response.results.concat(nextResponse.results),
        nextUrl: nextResponse.nextUrl
      };
    } else {
      return response;
    }
  };

  const entireTxs = (
    await getEntireTxs(`${baseApiUrl}/v1/accounts/${addr}/transactions`)
  ).results.map(tx => formatTrongridTxResponse(tx));

  // we need to fetch and filter trc20 'IN' transactions from another endpoint
  const entireTrc20InTxs = (
    await getEntireTxs(`${baseApiUrl}/v1/accounts/${addr}/transactions/trc20`)
  ).results
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
  const result = await post(`${baseApiUrl}/wallet/getaccountresource`, {
    address: decode58Check(address)
  });
  return result;
};

export const validateAddress = async (address: string): Promise<boolean> => {
  try {
    const result = await post(`${baseApiUrl}/wallet/validateaddress`, {
      address: decode58Check(address)
    });

    return result.result || false;
  } catch (e) {
    // dont throw anything
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
  const { brokerage } = await post(`${baseApiUrl}/wallet/getBrokerage`, {
    address: addr
  });

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
  try {
    const result = await post(`${baseApiUrl}/wallet/listwitnesses`, {});
    const sorted = result.witnesses.sort((a, b) => b.voteCount - a.voteCount);

    const superRepresentatives = await Promise.all(
      sorted.map(w => {
        const encodedAddress = encode58Check(w.address);

        // we neeed to retry because trongrid returns '408 Request Timeout' sometimes
        // in case of mutiple fetch in parallell
        const doGetAccountName = retry(() => accountNamesCache(encodedAddress));
        const doGetBrokerage = retry(() => srBrokeragesCache(encodedAddress));

        return doGetAccountName.then(accountName =>
          doGetBrokerage.then(brokerage => ({
            ...w,
            address: encodedAddress,
            name: accountName,
            brokerage,
            voteCount: w.voteCount || 0,
            isJobs: w.isJobs || false
          }))
        );
      })
    );

    hydrateSuperRepresentatives(superRepresentatives); // put it in cache

    return superRepresentatives;
  } catch (e) {
    throw new Error(
      "Unexpected error occured when calling fetchSuperRepresentatives"
    );
  }
};

export const getNextVotingDate = async (): Promise<Date> => {
  const { num } = await post(`${baseApiUrl}/wallet/getnextmaintenancetime`);
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
    const {
      freeNetUsed = 0,
      freeNetLimit = 0,
      NetUsed = 0,
      NetLimit = 0
    } = networkInfo;

    return {
      freeUsed: freeNetUsed,
      freeLimit: freeNetLimit,
      gainedUsed: NetUsed,
      gainedLimit: NetLimit
    };
  }

  return { freeUsed: 0, freeLimit: 0, gainedUsed: 0, gainedLimit: 0 };
};

export const getTronResources = async (
  acc: Object,
  txs: TrongridTxInfo[]
): Promise<TronResources> => {
  try {
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

    const lastDelegatedFrozenBandwidthOp = txs.find(
      t =>
        t.type === "FreezeBalanceContract" && t.to && t.resource === "BANDWIDTH"
    );

    const lastDelegatedFrozenEnergyOp = txs.find(
      t => t.type === "FreezeBalanceContract" && t.to && t.resource === "ENERGY"
    );

    const encodedAddress = encode58Check(acc.address);

    const tronNetworkInfo = await getTronAccountNetwork(encodedAddress);
    const unwithdrawnReward = await getUnwithdrawnReward(encodedAddress);

    const energy = tronNetworkInfo.EnergyLimit || 0;
    const bandwidth = extractBandwidthInfo(tronNetworkInfo);
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

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
      bandwidth:
        delegatedFrozenBandwidth && lastDelegatedFrozenBandwidthOp
          ? {
              amount: BigNumber(delegatedFrozenBandwidth),
              expiredAt: new Date(
                lastDelegatedFrozenBandwidthOp.date.getTime() + threeDaysInMs
              ) // + 3 days
            }
          : undefined,
      energy:
        delegatedFrozenEnergy && lastDelegatedFrozenEnergyOp
          ? {
              amount: BigNumber(delegatedFrozenEnergy),
              expiredAt: new Date(
                lastDelegatedFrozenEnergyOp.date.getTime() + threeDaysInMs
              ) // + 3 days
            }
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

    return {
      energy,
      bandwidth,
      frozen,
      delegatedFrozen,
      votes,
      tronPower,
      unwithdrawnReward
    };
  } catch (e) {
    throw new Error("Unexpected error occured when calling getTronResources");
  }
};

export const getUnwithdrawnReward = async (addr: string): Promise<number> => {
  try {
    const { reward = 0 } = await post(`${baseApiUrl}/wallet/getReward`, {
      address: decode58Check(addr)
    });
    return reward;
  } catch (e) {
    return Promise.resolve(0);
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
