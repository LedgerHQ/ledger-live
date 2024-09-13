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
} from "../types";

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
