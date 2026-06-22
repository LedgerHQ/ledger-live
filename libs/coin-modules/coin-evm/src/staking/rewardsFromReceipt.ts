import { log } from "@ledgerhq/logs";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { STAKING_CONTRACTS } from "./contracts";
import type { RewardsEventDecoder } from "../types/staking";
import type { LogWithAddress } from "../network/node/types";

/** Max in-flight receipt fetches, to avoid hammering the RPC node during sync. */
const RECEIPT_FETCH_CONCURRENCY = 4;

/** Fetches the logs of a tx receipt, or null when the receipt is unavailable. */
export type ReceiptFetcher = (
  hash: string,
) => Promise<{ logs: ReadonlyArray<LogWithAddress> } | null>;

/** Reads the `index`-th 32-byte word of an ABI-encoded `data` blob as a bigint. */
function readDataWord(data: string, index: number): bigint {
  const hex = data.startsWith("0x") ? data.slice(2) : data;
  const start = index * 64;
  const word = hex.slice(start, start + 64);
  if (word.length < 64) {
    return 0n;
  }
  return BigInt(`0x${word}`);
}

/** True when a 32-byte left-padded address topic refers to `address`. */
function topicMatchesAddress(topic: string, address: string): boolean {
  const target = address.toLowerCase().replace(/^0x/, "");
  return topic.toLowerCase().endsWith(target);
}

/**
 * Sums the reward amount carried by the receipt logs matching `decoder`,
 * scaled to wei. Pure (no network) so it can be unit-tested with fixtures.
 */
export function sumRewardFromReceiptLogs(
  logs: ReadonlyArray<LogWithAddress>,
  decoder: RewardsEventDecoder,
  delegator: string | undefined,
): bigint {
  const contract = decoder.contractAddress.toLowerCase();
  const topic0 = decoder.topic0.toLowerCase();

  let total = 0n;
  for (const { address, topics, data } of logs) {
    if (address.toLowerCase() !== contract) {
      continue;
    }
    if ((topics[0] ?? "").toLowerCase() !== topic0) {
      continue;
    }
    if (delegator) {
      const delegatorTopic = topics[decoder.delegatorTopicIndex];
      if (typeof delegatorTopic !== "string" || !topicMatchesAddress(delegatorTopic, delegator)) {
        continue;
      }
    }
    total += readDataWord(data, decoder.amountWordIndex);
  }
  return total * decoder.scale;
}

/**
 * Patches the `value` of REWARD operations in place by reading the reward amount
 * from each tx's receipt logs. Claim/compound txs send 0 native value, so without
 * this the amount shows as 0 in history and operation details. No-op for currencies
 * without a `rewardsEventDecoder`. Per-op failures are logged and leave the operation
 * untouched (amount falls back to 0) rather than blocking sync.
 */
export async function enrichRewardOperationsValue(
  currencyId: string,
  operations: Operation[],
  getReceipt: ReceiptFetcher,
): Promise<void> {
  const decoder = STAKING_CONTRACTS[currencyId]?.rewardsEventDecoder;
  if (!decoder) {
    return;
  }

  const rewardOps = operations.filter(op => op.type === "REWARD" && op.value.isZero());
  if (!rewardOps.length) {
    return;
  }

  await promiseAllBatched(RECEIPT_FETCH_CONCURRENCY, rewardOps, async op => {
    try {
      const receipt = await getReceipt(op.hash);
      if (!receipt) {
        return;
      }
      const amount = sumRewardFromReceiptLogs(receipt.logs, decoder, op.senders[0]);
      if (amount > 0n) {
        op.value = new BigNumber(amount.toString());
      }
    } catch (e) {
      log("coin-evm/staking", "enrichRewardOperationsValue: receipt fetch/decode failed", {
        hash: op.hash,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });
}
