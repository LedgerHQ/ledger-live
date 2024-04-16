import bs58check from "bs58check";
import { BigNumber } from "bignumber.js";
import get from "lodash/get";
import { log } from "@ledgerhq/logs";
import { extractBandwidthInfo } from "./api";
import type {
  Transaction,
  TronOperationMode,
  TrongridTxInfo,
  TrongridExtraTxInfo,
  TronResources,
  TronOperation,
} from "./types";
import type { Account, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

export const decode58Check = (base58: string): string =>
  Buffer.from(bs58check.decode(base58)).toString("hex");

export const encode58Check = (hex: string): string => bs58check.encode(Buffer.from(hex, "hex"));

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

export const formatTrongridTrc20TxResponse = (
  tx: Record<string, any>,
): TrongridTxInfo | null | undefined => {
  try {
    const { from, to, block_timestamp, detail, value, transaction_id, token_info } = tx;
    const type = "TriggerSmartContract";
    const txID = transaction_id;
    const date = new Date(block_timestamp);
    const tokenId = get(token_info, "address", undefined);
    const formattedValue = value ? new BigNumber(value) : new BigNumber(0);
    const fee = get(detail, "ret[0].fee", detail && detail.fee ? detail.fee : undefined);
    const blockHeight = detail ? detail.blockNumber : undefined;
    return {
      txID,
      date,
      type,
      tokenId,
      from,
      to,
      blockHeight,
      value: formattedValue,
      fee: new BigNumber(fee || 0),
      hasFailed: false, // trc20 txs are succeeded if returned by trongrid,
    };
  } catch (e) {
    log("tron-error", "could not parse transaction", tx);
    return undefined;
  }
};

export const formatTrongridTxResponse = (
  tx: Record<string, any>,
): TrongridTxInfo | null | undefined => {
  try {
    const { txID, block_timestamp, detail, blockNumber, unfreeze_amount, withdraw_amount } = tx;
    const date = new Date(block_timestamp);
    const type = get(tx, "raw_data.contract[0].type", "");
    const {
      amount,
      asset_name,
      owner_address,
      to_address,
      contract_address,
      quant,
      frozen_balance,
      votes,
      unfreeze_balance,
      balance,
      receiver_address,
    } = get(tx, "raw_data.contract[0].parameter.value", {});
    const hasFailed = get(tx, "ret[0].contractRet", "SUCCESS") !== "SUCCESS";
    const tokenId =
      type === "TransferAssetContract"
        ? asset_name
        : type === "TriggerSmartContract" && contract_address
        ? encode58Check(contract_address)
        : undefined;
    const from = encode58Check(owner_address);
    const to = to_address ? encode58Check(to_address) : undefined;

    const getValue = (): BigNumber => {
      switch (type) {
        case "WithdrawBalanceContract":
          return new BigNumber(withdraw_amount || detail.withdraw_amount || 0);

        case "ExchangeTransactionContract":
          return new BigNumber(quant || 0);

        default:
          return amount ? new BigNumber(amount) : new BigNumber(0);
      }
    };

    const value = getValue();
    const fee = get(tx, "ret[0].fee", detail && detail.fee ? detail.fee : undefined);
    const blockHeight = blockNumber || detail?.blockNumber;
    const txInfo: TrongridTxInfo = {
      txID,
      date,
      type,
      tokenId,
      from,
      to,
      value: !value.isNaN() ? value : new BigNumber(0),
      fee: new BigNumber(fee || 0),
      blockHeight,
      hasFailed,
    };

    const getExtra = (): TrongridExtraTxInfo | null | undefined => {
      switch (type) {
        case "VoteWitnessContract":
          return {
            votes: votes.map(v => ({
              address: encode58Check(v.vote_address),
              voteCount: v.vote_count,
            })),
          };

        case "FreezeBalanceContract":
        case "FreezeBalanceV2Contract":
          return {
            frozenAmount: new BigNumber(frozen_balance),
          };

        case "UnfreezeBalanceV2Contract":
          return {
            unfreezeAmount: new BigNumber(unfreeze_balance),
          };

        case "UnDelegateResourceContract":
          return {
            unDelegatedAmount: new BigNumber(balance),
            receiverAddress: encode58Check(receiver_address),
          };

        case "UnfreezeBalanceContract":
          return {
            unfreezeAmount: new BigNumber(unfreeze_amount || detail.unfreeze_amount),
          };

        default:
          return undefined;
      }
    };

    const extra = getExtra();

    if (extra) {
      txInfo.extra = extra;
    }

    return txInfo;
  } catch (e) {
    log("tron-error", "could not parse transaction", tx);
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
