import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getCurrentNearPreloadData } from "./preload-data";

/**
 * How long after the account's own transaction a rise of its balance is taken for that
 * transaction's gas refund. The refund receipt runs a few blocks after the transaction, but the
 * sync that sees it may come one background cycle later.
 */
export const GAS_REFUND_WINDOW_MS = 15 * 60 * 1000;

/** A transaction holds at most 300 Tgas. */
const MAX_PREPAID_GAS = 300_000_000_000_000n;

/**
 * The most a transaction can get back: its gas is bought at `max(gas price, min_gas_purchase_price)`
 * and burnt at the gas price, the difference refunded. Both prices are the ones `preload()`
 * reports, or their fallbacks.
 */
const maxRefundPerTransaction = (): bigint => {
  const { gasPrice, minGasPurchasePrice } = getCurrentNearPreloadData();
  return MAX_PREPAID_GAS * BigInt(BigNumber.max(gasPrice, minGasPurchasePrice).toFixed(0));
};

/**
 * Whether a rise of the account's liquid balance is the gas refund of its own recent transactions:
 * it comes in a later block than the transaction, so it moves the balance with no new operation.
 * Bounded by what those transactions can get back, so a deposit above it is still read.
 */
export const isGasRefund = (
  increase: bigint,
  operations: readonly Operation[],
  address: string,
  now: number,
): boolean => {
  if (increase <= 0n) return false;
  // Counted by transaction: one may be stored as several rows (a provisional row, a self-send).
  const recentOwn = new Set(
    operations
      .filter(
        operation =>
          operation.type !== "IN" &&
          operation.senders.includes(address) &&
          now - new Date(operation.date).getTime() < GAS_REFUND_WINDOW_MS,
      )
      .map(({ hash }) => hash),
  );
  return increase <= BigInt(recentOwn.size) * maxRefundPerTransaction();
};
