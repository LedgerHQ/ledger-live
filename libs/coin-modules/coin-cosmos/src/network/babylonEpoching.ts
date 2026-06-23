import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { CosmosDelegation, CosmosRedelegation, CosmosUnbonding } from "../types";

// Babylon's x/epoching module queues wrapped staking msgs until the last block of the
// epoch (~1h), so they are invisible on the standard staking endpoints until then, even
// though MsgWrappedDelegate locks the funds at enqueue time. These helpers fetch the
// current epoch's queue and merge it into the staking positions.

export type QueuedStakingMessage =
  | {
      type: "delegate" | "undelegate";
      delegatorAddress: string;
      validatorAddress: string;
      amount: BigNumber;
      denom: string;
    }
  | {
      type: "redelegate";
      delegatorAddress: string;
      validatorSrcAddress: string;
      validatorDstAddress: string;
      amount: BigNumber;
      denom: string;
    };

type CurrentEpochResponse = {
  current_epoch: string;
  epoch_boundary: string;
};

type EpochMessagesResponse = {
  msgs: {
    tx_id: string;
    msg_id: string;
    block_height: string;
    block_time: string;
    // inner staking msg in gogoproto text format, e.g.
    // delegator_address:"bbn1..." validator_address:"bbnvaloper1..." amount:<denom:"ubbn" amount:"398688" >
    msg: string;
    // inner (unwrapped) msg type, e.g. "cosmos.staking.v1beta1.MsgDelegate"
    msg_type: string;
  }[];
  pagination: { next_key: string | null; total: string };
};

const delegatorAddressRegex = /(?:^|\s)delegator_address:\s*"([a-z0-9]+)"/;
const validatorAddressRegex = /(?:^|\s)validator_address:\s*"([a-z0-9]+)"/;
const validatorSrcAddressRegex = /(?:^|\s)validator_src_address:\s*"([a-z0-9]+)"/;
const validatorDstAddressRegex = /(?:^|\s)validator_dst_address:\s*"([a-z0-9]+)"/;
const amountRegex =
  /(?:^|\s)amount:\s*[<{]\s*denom:\s*"([a-zA-Z0-9/\-._]+)"\s+amount:\s*"(\d+)"\s*[>}]/;

export const parseQueuedMessage = (
  msgType: string,
  msgText: string,
): QueuedStakingMessage | undefined => {
  const isUndelegate = msgType.endsWith("MsgUndelegate");
  const isRedelegate = msgType.endsWith("MsgBeginRedelegate");
  const isDelegate = msgType.endsWith("MsgDelegate");
  if (!isDelegate && !isUndelegate && !isRedelegate) {
    return undefined;
  }

  // a known staking msg_type that fails to match below means the gogoproto-text format
  // drifted — warn instead of returning a silent undefined that would under-count positions
  const onParseFailure = (): undefined => {
    log("warn", "babylon epoching: failed to parse known staking msg", { msgType });
    return undefined;
  };

  const delegatorMatch = delegatorAddressRegex.exec(msgText);
  const amountMatch = amountRegex.exec(msgText);
  if (!delegatorMatch || !amountMatch) {
    return onParseFailure();
  }
  const base = {
    delegatorAddress: delegatorMatch[1],
    denom: amountMatch[1],
    amount: new BigNumber(amountMatch[2]),
  };

  if (isRedelegate) {
    const srcMatch = validatorSrcAddressRegex.exec(msgText);
    const dstMatch = validatorDstAddressRegex.exec(msgText);
    if (!srcMatch || !dstMatch) {
      return onParseFailure();
    }
    return {
      type: "redelegate",
      validatorSrcAddress: srcMatch[1],
      validatorDstAddress: dstMatch[1],
      ...base,
    };
  }

  const validatorMatch = validatorAddressRegex.exec(msgText);
  if (!validatorMatch) {
    return onParseFailure();
  }
  return {
    type: isUndelegate ? "undelegate" : "delegate",
    validatorAddress: validatorMatch[1],
    ...base,
  };
};

const EPOCH_MSGS_PAGE_LIMIT = 200;
const EPOCH_MSGS_MAX_PAGES = 10;
const BABYLON_BLOCK_TIME_MS = 10_000;

export const fetchQueuedStakingMessages = async (
  endpoint: string,
  address: string,
  denom: string,
): Promise<{ messages: QueuedStakingMessage[]; epochBoundary: number } | null> => {
  try {
    const getCurrentEpoch = async (): Promise<CurrentEpochResponse> => {
      const { data } = await network<CurrentEpochResponse>({
        method: "GET",
        // epoching routes are versioned v1, unlike the chain's v1beta1 cosmos routes
        url: `${endpoint}/babylon/epoching/v1/current_epoch`,
      });
      return data;
    };

    const { current_epoch: currentEpoch, epoch_boundary: epochBoundary } = await getCurrentEpoch();

    const queued: EpochMessagesResponse["msgs"] = [];
    let nextKey: string | null | undefined;
    let pages = 0;
    do {
      const { data } = await network<EpochMessagesResponse>({
        method: "GET",
        url:
          `${endpoint}/babylon/epoching/v1/epochs/${currentEpoch}/messages` +
          `?pagination.limit=${EPOCH_MSGS_PAGE_LIMIT}` +
          (nextKey ? `&pagination.key=${encodeURIComponent(nextKey)}` : ""),
      });
      queued.push(...(data.msgs ?? []));
      nextKey = data.pagination?.next_key;
      pages += 1;
    } while (nextKey && pages < EPOCH_MSGS_MAX_PAGES);

    if (nextKey) {
      // merging a partial queue would under-count positions; skip the enrichment entirely
      // rather than surface a wrong subset (fail-open, like the catch below)
      log("warn", "babylon epoching: pagination cap reached, skipping queue merge");
      return null;
    }

    // an epoch rollover between the reads above would make the queue inconsistent with
    // the rest of the account data (msgs executed but still listed) — skip this sync
    const { current_epoch: epochAfter } = await getCurrentEpoch();
    if (epochAfter !== currentEpoch) {
      return null;
    }

    const messages = queued
      .map(m => parseQueuedMessage(m.msg_type, m.msg))
      .filter((m): m is QueuedStakingMessage => m !== undefined)
      .filter(m => m.delegatorAddress === address && m.denom === denom);

    return { messages, epochBoundary: Number.parseInt(epochBoundary, 10) };
  } catch (e) {
    // fail open: pending positions are an enrichment, an epoching endpoint failure
    // must not break the whole babylon sync
    log("warn", "babylon epoching: could not fetch queued staking messages", { e });
    return null;
  }
};

export const mergeQueuedMessages = (
  resources: {
    delegations: CosmosDelegation[];
    redelegations: CosmosRedelegation[];
    unbondings: CosmosUnbonding[];
  },
  messages: QueuedStakingMessage[],
  params: { blockHeight: number; epochBoundary: number; unbondingPeriodDays: number },
): {
  delegations: CosmosDelegation[];
  redelegations: CosmosRedelegation[];
  unbondings: CosmosUnbonding[];
} => {
  const delegations = resources.delegations.map(d => ({ ...d }));
  const redelegations = [...resources.redelegations];
  const unbondings = [...resources.unbondings];

  const estimatedEpochEndMs =
    Math.max(0, params.epochBoundary - params.blockHeight) * BABYLON_BLOCK_TIME_MS;
  const completionDate = new Date(
    Date.now() + estimatedEpochEndMs + params.unbondingPeriodDays * 86_400_000,
  );

  const addToDelegation = (validatorAddress: string, amount: BigNumber) => {
    const existing = delegations.find(d => d.validatorAddress === validatorAddress);
    if (existing) {
      existing.amount = existing.amount.plus(amount);
    } else {
      delegations.push({
        validatorAddress,
        amount,
        pendingRewards: new BigNumber(0),
        status: "bonded",
      });
    }
  };

  // clamping to the current delegation keeps the merge balance-neutral even when the
  // queue holds more undelegations than the delegation can cover (the chain will fail
  // the excess ones at epoch end)
  const removeFromDelegation = (validatorAddress: string, amount: BigNumber): BigNumber => {
    const existing = delegations.find(d => d.validatorAddress === validatorAddress);
    if (!existing) {
      return new BigNumber(0);
    }
    const moved = BigNumber.min(amount, existing.amount);
    existing.amount = existing.amount.minus(moved);
    return moved;
  };

  for (const message of messages) {
    switch (message.type) {
      case "delegate":
        addToDelegation(message.validatorAddress, message.amount);
        break;
      case "undelegate": {
        const moved = removeFromDelegation(message.validatorAddress, message.amount);
        if (moved.gt(0)) {
          unbondings.push({
            validatorAddress: message.validatorAddress,
            amount: moved,
            completionDate,
          });
        }
        break;
      }
      case "redelegate": {
        const moved = removeFromDelegation(message.validatorSrcAddress, message.amount);
        if (moved.gt(0)) {
          addToDelegation(message.validatorDstAddress, moved);
          redelegations.push({
            validatorSrcAddress: message.validatorSrcAddress,
            validatorDstAddress: message.validatorDstAddress,
            amount: moved,
            completionDate,
          });
        }
        break;
      }
    }
  }

  return {
    delegations: delegations.filter(d => d.amount.gt(0)),
    redelegations,
    unbondings,
  };
};
