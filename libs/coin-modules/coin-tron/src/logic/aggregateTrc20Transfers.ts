import BigNumber from "bignumber.js";
import { inferOperationType } from "../network/trongrid/trongrid-adapters";
import { TrongridTxInfo } from "../types";

const SUMMED_TYPES = new Set(["IN", "OUT"]);

/**
 * Sums the TRC20 transfers of one token in one direction within a transaction into one record:
 * their token operations would share one id. The fee is not summed, every record repeats it.
 * Approvals, transfers of no clear direction and records without a token address pass through.
 */
export function aggregateTrc20Transfers(
  txs: TrongridTxInfo[],
  userAddress: string,
): TrongridTxInfo[] {
  const groups = new Map<string, TrongridTxInfo[]>();
  const result: TrongridTxInfo[][] = [];

  for (const tx of txs) {
    const type =
      tx.tokenType === "trc20" && tx.tokenAddress ? inferOperationType(tx, userAddress) : undefined;
    if (type === undefined || !SUMMED_TYPES.has(type)) {
      result.push([tx]);
      continue;
    }
    const key = `${tx.txID}:${tx.tokenAddress}:${type}`;
    const group = groups.get(key);
    if (group) {
      group.push(tx);
    } else {
      const newGroup = [tx];
      groups.set(key, newGroup);
      result.push(newGroup);
    }
  }

  return result.map(group => (group.length === 1 ? group[0] : sumGroup(group)));
}

function sumGroup(group: TrongridTxInfo[]): TrongridTxInfo {
  return {
    ...group[0],
    value: group.reduce((sum, tx) => sum.plus(tx.value ?? 0), new BigNumber(0)),
    senders: uniqueSorted(group.map(tx => tx.from)),
    recipients: uniqueSorted(group.flatMap(tx => (tx.to ? [tx.to] : []))),
  };
}

function uniqueSorted(addresses: string[]): string[] {
  return [...new Set(addresses)].sort((a, b) => a.localeCompare(b));
}
