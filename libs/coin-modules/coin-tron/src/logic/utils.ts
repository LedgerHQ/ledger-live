import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Account, OperationType } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type {
  BandwidthInfo,
  NetworkInfo,
  Transaction,
  TrongridTxInfo,
  TronOperation,
  TronOperationMode,
  TronResources,
  UnFrozenInfo,
} from "../types";
import get from "lodash/get";

// see: https://solidity.readthedocs.io/en/v0.6.1/abi-spec.html#function-selector-and-argument-encoding
export const abiEncodeTrc20Transfer = (address: string, amount: BigNumber): string => {
  const encodedAddress = address.padStart(64, "0");
  const hexAmount = amount.toNumber().toString(16); // convert to hexadecimal

  const encodedAmount = hexAmount.padStart(64, "0");
  return encodedAddress.concat(encodedAmount);
};

export const hexToAscii = (hex: string): string => Buffer.from(hex, "hex").toString("ascii");

const parentTx = [
  "TransferContract",
  "VoteWitnessContract",
  "WithdrawBalanceContract",
  "ExchangeTransactionContract",
  "FreezeBalanceV2Contract",
  "UnfreezeBalanceV2Contract",
  "WithdrawExpireUnfreezeContract",
  "UnDelegateResourceContract",
  "FreezeBalanceContract",
  "UnfreezeBalanceContract",
  "ContractApproval",
];

export const isParentTx = (tx: TrongridTxInfo): boolean => parentTx.includes(tx.type);

// This is an estimation, there is no endpoint to calculate the real size of a block before broadcasting it.
export const getEstimatedBlockSize = (a: Account, t: Transaction): BigNumber => {
  switch (t.mode) {
    case "send": {
      const subAccount =
        t.subAccountId && a.subAccounts ? a.subAccounts.find(sa => sa.id === t.subAccountId) : null;

      if (subAccount && subAccount.type === "TokenAccount") {
        if (subAccount.token.tokenType === "trc10") return new BigNumber(285);
        if (subAccount.token.tokenType === "trc20") return new BigNumber(350);
      }

      return new BigNumber(270);
    }

    case "freeze":
    case "unfreeze":
    case "claimReward":
    case "withdrawExpireUnfreeze":
    case "unDelegateResource":
    case "legacyUnfreeze":
      return new BigNumber(260);

    case "vote":
      return new BigNumber(290 + t.votes.length * 19);

    default:
      return new BigNumber(0);
  }
};

export const getOperationTypefromMode = (mode: TronOperationMode): OperationType => {
  switch (mode) {
    case "send":
      return "OUT";

    case "freeze":
      return "FREEZE";

    case "unfreeze":
      return "UNFREEZE";

    case "vote":
      return "VOTE";

    case "claimReward":
      return "REWARD";

    case "withdrawExpireUnfreeze":
      return "WITHDRAW_EXPIRE_UNFREEZE";

    case "unDelegateResource":
      return "UNDELEGATE_RESOURCE";

    case "legacyUnfreeze":
      return "LEGACY_UNFREEZE";

    default:
      return "OUT";
  }
};

const getOperationType = (
  tx: TrongridTxInfo,
  accountAddr: string,
): OperationType | null | undefined => {
  switch (tx.type) {
    case "TransferContract":
    case "TransferAssetContract":
    case "TriggerSmartContract":
      return tx.from === accountAddr ? "OUT" : "IN";

    case "ContractApproval":
      return "APPROVE";

    case "ExchangeTransactionContract":
      return "OUT";

    case "VoteWitnessContract":
      return "VOTE";

    case "WithdrawBalanceContract":
      return "REWARD";

    case "FreezeBalanceContract":
    case "FreezeBalanceV2Contract":
      return "FREEZE";

    case "UnfreezeBalanceV2Contract":
      return "UNFREEZE";

    case "WithdrawExpireUnfreezeContract":
      return "WITHDRAW_EXPIRE_UNFREEZE";

    case "UnDelegateResourceContract":
      return "UNDELEGATE_RESOURCE";

    case "UnfreezeBalanceContract":
      return "LEGACY_UNFREEZE";

    default:
      return undefined;
  }
};

export const txInfoToOperation = (
  id: string,
  address: string,
  tx: TrongridTxInfo,
): TronOperation | null | undefined => {
  const {
    txID,
    date,
    from,
    to,
    type,
    value = new BigNumber(0),
    fee = new BigNumber(0),
    blockHeight,
    extra = {},
    hasFailed,
  } = tx;
  const hash = txID;
  const operationType = getOperationType(tx, address);

  if (operationType) {
    return {
      id: encodeOperationId(id, hash, operationType),
      hash,
      type: operationType,
      value: operationType === "OUT" && type === "TransferContract" ? value.plus(fee) : value,
      // fee is not charged in TRC tokens
      fee: fee,
      blockHeight,
      blockHash: null,
      accountId: id,
      senders: [from],
      recipients: to ? [to] : [],
      date,
      extra,
      hasFailed,
    };
  }

  return undefined;
};

export const extractBandwidthInfo = (
  networkInfo: NetworkInfo | null | undefined,
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

export const defaultTronResources: TronResources = {
  frozen: {
    bandwidth: undefined,
    energy: undefined,
  },
  unFrozen: {
    bandwidth: undefined,
    energy: undefined,
  },
  delegatedFrozen: {
    bandwidth: undefined,
    energy: undefined,
  },
  legacyFrozen: {
    bandwidth: undefined,
    energy: undefined,
  },
  votes: [],
  tronPower: 0,
  energy: new BigNumber(0),
  bandwidth: extractBandwidthInfo(null),
  unwithdrawnReward: new BigNumber(0),
  lastWithdrawnRewardDate: undefined,
  lastVotedDate: undefined,
  cacheTransactionInfoById: {},
};

type AccountInfo = {
  account_resource?: {
    delegated_frozenV2_balance_for_energy?: number;
    frozen_balance_for_energy?: {
      frozen_balance: number;
      expire_time: number;
    };
  };
  delegated_frozenV2_balance_for_bandwidth?: number;
  frozen?: {
    frozen_balance: number;
    expire_time: number;
  }[];
  frozenV2?: {
    type?: "ENERGY" | "TRON_POWER" | string;
    amount?: number;
  }[];
  latest_withdraw_time?: number;
  unfrozenV2?: {
    type?: "ENERGY" | string;
    unfreeze_amount: number;
    unfreeze_expire_time: number;
  }[];
  votes?: {
    vote_address: string;
    vote_count: number;
  }[];
};
export function getTronResources(
  acc?: AccountInfo,
): Omit<
  TronResources,
  "energy" | "bandwidth" | "unwithdrawnReward" | "lastVotedDate" | "cacheTransactionInfoById"
> {
  if (!acc) {
    return defaultTronResources;
  }

  const delegatedFrozenBandwidth = get(acc, "delegated_frozenV2_balance_for_bandwidth", undefined);
  const delegatedFrozenEnergy = get(
    acc,
    "account_resource.delegated_frozenV2_balance_for_energy",
    undefined,
  );

  const frozenBalances: { type?: string; amount?: number }[] = get(acc, "frozenV2", []);

  const legacyFrozenBandwidth = get(acc, "frozen[0]", undefined);
  const legacyFrozenEnergy = get(acc, "account_resource.frozen_balance_for_energy", undefined);

  const legacyFrozen = {
    bandwidth: legacyFrozenBandwidth
      ? {
          amount: new BigNumber(legacyFrozenBandwidth.frozen_balance),
          expiredAt: new Date(legacyFrozenBandwidth.expire_time),
        }
      : undefined,
    energy: legacyFrozenEnergy
      ? {
          amount: new BigNumber(legacyFrozenEnergy.frozen_balance),
          expiredAt: new Date(legacyFrozenEnergy.expire_time),
        }
      : undefined,
  };

  const { frozenEnergy, frozenBandwidth } = frozenBalances.reduce(
    (accum, cur) => {
      const amount = new BigNumber(cur?.amount ?? 0);
      if (cur.type === "ENERGY") {
        accum.frozenEnergy = accum.frozenEnergy.plus(amount);
      } else if (cur.type === undefined) {
        accum.frozenBandwidth = accum.frozenBandwidth.plus(amount);
      }
      return accum;
    },
    {
      frozenEnergy: new BigNumber(0),
      frozenBandwidth: new BigNumber(0),
    },
  );

  const unFrozenBalances: {
    type?: string;
    unfreeze_amount: number;
    unfreeze_expire_time: number;
  }[] = get(acc, "unfrozenV2", []);

  const unFrozen: { bandwidth: UnFrozenInfo[]; energy: UnFrozenInfo[] } = unFrozenBalances
    ? unFrozenBalances.reduce(
        (accum, cur) => {
          if (cur && cur.type === "ENERGY") {
            accum.energy.push({
              amount: new BigNumber(cur.unfreeze_amount),
              expireTime: new Date(cur.unfreeze_expire_time),
            });
          } else if (cur) {
            accum.bandwidth.push({
              amount: new BigNumber(cur.unfreeze_amount),
              expireTime: new Date(cur.unfreeze_expire_time),
            });
          }
          return accum;
        },
        { bandwidth: [] as UnFrozenInfo[], energy: [] as UnFrozenInfo[] },
      )
    : { bandwidth: [], energy: [] };

  const frozen = {
    bandwidth: frozenBandwidth.isGreaterThan(0)
      ? {
          amount: frozenBandwidth,
        }
      : undefined,
    energy: frozenEnergy.isGreaterThan(0)
      ? {
          amount: frozenEnergy,
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
    .plus(get(legacyFrozen, "energy.amount", 0))
    .plus(get(legacyFrozen, "bandwidth.amount", 0))
    .dividedBy(1_000_000)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toNumber();

  const votes = get(acc, "votes", []).map((v: any) => ({
    address: v.vote_address,
    voteCount: v.vote_count,
  }));

  const lastWithdrawnRewardDate = acc.latest_withdraw_time
    ? new Date(acc.latest_withdraw_time)
    : undefined;

  return {
    frozen,
    unFrozen,
    delegatedFrozen,
    legacyFrozen,
    votes,
    tronPower,
    lastWithdrawnRewardDate,
  };
}
