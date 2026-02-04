import type { Balance, Operation, Stake, Validator } from "@ledgerhq/coin-framework/api/types";

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
  // Check if it's a BigNumber-like object with integerValue method
  if (typeof value === "object" && "integerValue" in (value as object)) {
    const bn = value as { integerValue: () => { toFixed: () => string } };
    return BigInt(bn.integerValue().toFixed());
  }
  // Handle string or number
  if (typeof value === "string" || typeof value === "number") {
    return BigInt(value);
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

  // Get fee from either fee or fees field, default to 0
  const feeValue = raw.fee ?? raw.fees;
  const fees = toBigInt(feeValue);

  // Detect ESDT transfer via transfer field (ADR-004, Subtask 1.1)
  const isEsdt = raw.transfer === MultiversXTransferOptions.esdt;

  // Get value based on asset type (Subtask 1.3, 1.5)
  // For ESDT: use tokenValue field
  // For EGLD: use value field
  const value = isEsdt ? BigInt(raw.tokenValue ?? "0") : toBigInt(raw.value);

  // Get block height from round field
  const height = raw.round ?? raw.blockHeight ?? 0;

  // Get timestamp, default to epoch if missing
  const timestamp = raw.timestamp ?? 0;
  const date = new Date(timestamp * 1000);

  // Determine if transaction failed
  const failed = raw.status !== "success";

  // Build asset based on transfer type (Subtask 1.2, 1.4)
  // Note: For ESDT, if tokenIdentifier is missing, we default to empty string.
  // This is a fallback for malformed data - the operation will still be recorded
  // but the token won't be identifiable.
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
  // MultiversX returns an undelegated list with a remaining time:
  // - seconds > 0: still unbonding (pending)
  // - seconds === 0: unbonding complete (withdrawable)
  //
  // NOTE: Some APIs also expose an aggregated `userUnBondable`. To avoid double counting
  // withdrawable stake, we:
  // - sum pending amounts from the list
  // - compute withdrawable as the max of (userUnBondable, completed amounts from list)
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

  // Total amount = active stake + rewards + pending undelegations + withdrawable
  const amount = amountDeposited + amountRewarded + pendingUndelegationsAmount + withdrawableAmount;

  return {
    uid: `${address}-${delegation.contract}`,
    address,
    delegate: delegation.contract,
    state,
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

  // Safely convert totalActiveStake to bigint, handling invalid strings
  let balance: bigint;
  try {
    balance = BigInt(provider.totalActiveStake || "0");
  } catch {
    // If conversion fails (e.g., non-numeric string), default to 0
    balance = 0n;
  }

  // Safely calculate APY, handling NaN, Infinity, null, or undefined
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
  // If aprValue is invalid, apy remains undefined (optional field)

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
