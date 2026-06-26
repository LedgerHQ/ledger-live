import type {
  Balance,
  Operation,
  Stake,
  StakeAction,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";

import { mapDelegationState } from "./stateMapping";

import type {
  ESDTToken,
  MultiversXApiTransaction,
  MultiversXDelegation,
  MultiversXProvider,
} from "../types";
import { MultiversXTransferOptions } from "../types";

/**
 * Maps raw balance string to standardized Balance object.
 * @param balance - Balance string from API (in smallest units)
 * @returns Balance with native asset type
 */
export function mapToBalance(balance: string): Balance {
  return {
    value: BigInt(balance),
    asset: { type: "native" },
  };
}

/**
 * Maps ESDT token to standardized Balance object.
 * @param token - ESDT token from API with identifier, name, and balance
 * @returns Balance with esdt asset type and token identifier as assetReference
 */
export function mapToEsdtBalance(token: ESDTToken): Balance {
  return {
    value: BigInt(token.balance),
    asset: {
      type: "esdt",
      assetReference: token.identifier,
      name: token.name,
    },
  };
}

/**
 * Safely converts a value to bigint.
 * Handles BigNumber, string, number, and undefined.
 * @param value - Value that may be BigNumber, string, number, or undefined
 * @returns bigint representation of the value
 */
function toBigInt(value: unknown): bigint {
  if (value === undefined || value === null) {
    return 0n;
  }
  if (typeof value === "object" && "integerValue" in (value as object)) {
    const bn = value as { integerValue?: () => { toFixed: () => string } };
    if (typeof bn.integerValue === "function") {
      try {
        return BigInt(bn.integerValue().toFixed());
      } catch {
        return 0n;
      }
    }
    return 0n;
  }
  if (typeof value === "string" || typeof value === "number") {
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
  return 0n;
}

/**
 * Maps MultiversX API transaction to standardized Operation object.
 * Handles both native EGLD transfers and ESDT token transfers.
 * @param raw - Raw transaction data from MultiversX explorer API
 * @param address - The account address for determining IN/OUT operation type
 * @returns Operation object with native or esdt asset type
 */
export function mapToOperation(raw: MultiversXApiTransaction, address: string): Operation {
  // Determine operation type based on sender/receiver
  const isSender = raw.sender === address;
  const type = isSender ? "OUT" : "IN";

  const feeValue = raw.fee ?? raw.fees;
  const fees = toBigInt(feeValue);

  const isEsdt = raw.transfer === MultiversXTransferOptions.esdt;

  const value = isEsdt ? BigInt(raw.tokenValue ?? "0") : toBigInt(raw.value);

  const height = raw.round ?? raw.blockHeight ?? 0;

  const timestamp = raw.timestamp ?? 0;
  const date = new Date(timestamp * 1000);

  const failed = raw.status !== undefined && raw.status !== "success";

  const tokenIdentifier = raw.tokenIdentifier ?? "";
  const asset = isEsdt
    ? { type: "esdt" as const, assetReference: tokenIdentifier }
    : { type: "native" as const };

  return {
    id: raw.txHash ?? "",
    type,
    value,
    asset,
    senders: raw.sender ? [raw.sender] : [],
    recipients: raw.receiver ? [raw.receiver] : [],
    tx: {
      hash: raw.txHash ?? "",
      block: {
        height,
        time: date,
        hash: raw.blockHash ?? "",
      },
      fees,
      date,
      failed,
    },
  };
}

/**
 * Maps MultiversX delegation to standardized Stake object.
 *
 * Uses mapDelegationState for state determination based on delegation fields.
 * Total amount includes: active stake + rewards + undelegating + withdrawable.
 *
 * @param delegation - Raw delegation data from MultiversX API
 * @param address - The owner account address
 * @returns Stake object conforming to Alpaca API interface
 */
export function mapToStake(delegation: MultiversXDelegation, address: string): Stake {
  const state = mapDelegationState(delegation);

  const amountDeposited = BigInt(delegation.userActiveStake);
  const amountRewarded = BigInt(delegation.claimableRewards);

  // Calculate undelegations amounts.
  const undelegations = delegation.userUndelegatedList || [];
  const pendingUndelegationsAmount = undelegations.reduce((sum, item) => {
    if (item.seconds > 0) return sum + BigInt(item.amount);
    return sum;
  }, 0n);

  const completedUndelegationsAmount = undelegations.reduce((sum, item) => {
    if (item.seconds === 0) return sum + BigInt(item.amount);
    return sum;
  }, 0n);

  const withdrawableFromField = BigInt(delegation.userUnBondable || "0");
  const withdrawableAmount =
    withdrawableFromField > completedUndelegationsAmount
      ? withdrawableFromField
      : completedUndelegationsAmount;

  const amount = amountDeposited + amountRewarded + pendingUndelegationsAmount + withdrawableAmount;

  const actions: StakeAction[] = [];
  if (amountDeposited > 0n) {
    actions.push("delegate", "undelegate");
  }
  if (amountRewarded > 0n) {
    actions.push("claim_reward", "redelegate");
  }
  if (withdrawableAmount > 0n) {
    actions.push("withdraw");
  }

  return {
    uid: `${address}-${delegation.contract}`,
    address,
    delegate: delegation.contract,
    state,
    actions,
    asset: { type: "native" },
    amount,
    amountDeposited,
    amountRewarded,
    details: {
      userUnBondable: delegation.userUnBondable,
      userUndelegatedList: delegation.userUndelegatedList,
    },
  };
}

/**
 * Maps a MultiversX provider to an Alpaca Validator.
 * @param provider - The MultiversX provider from the delegation API
 * @returns A standardized Validator object
 */
export function mapToValidator(provider: MultiversXProvider): Validator {
  const identityName = provider.identity?.name?.trim();
  const name = identityName ? identityName : provider.contract;

  let balance: bigint;
  try {
    balance = BigInt(provider.totalActiveStake || "0");
  } catch {
    balance = 0n;
  }

  let apy: number | undefined;
  if (
    provider.aprValue !== null &&
    provider.aprValue !== undefined &&
    typeof provider.aprValue === "number" &&
    !Number.isNaN(provider.aprValue) &&
    Number.isFinite(provider.aprValue)
  ) {
    apy = provider.aprValue / 100;
  }

  return {
    address: provider.contract,
    name,
    description: provider.identity?.description || undefined,
    url: provider.identity?.url || undefined,
    logo: provider.identity?.avatar || undefined,
    balance,
    commissionRate: provider.serviceFee || undefined,
    apy,
  };
}
