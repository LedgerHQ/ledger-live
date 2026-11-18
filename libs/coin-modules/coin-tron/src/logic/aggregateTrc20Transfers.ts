import BigNumber from "bignumber.js";
import { inferOperationType } from "../network/trongrid/trongrid-adapters";
import { TrongridTxInfo } from "../types";

/**
 * TronGrid returns one TRC20 record per transfer event, so a swap can bring several records of
 * one token in one direction under the same transaction. Their token operations would share the
 * id `encodeOperationId(tokenAccountId, hash, type)` and all but one would be dropped on merge,
 * so they are summed into one record here. The key is the same as the id's (transaction, token,
 * operation type): transfers of other tokens or in the other direction stay separate.
 *
 * The fee is not summed: every record of a transaction repeats the transaction's fee.
 */
export function aggregateTrc20Transfers(
  txs: TrongridTxInfo[],
  userAddress: string,
): TrongridTxInfo[] {
  const groups = new Map<string, TrongridTxInfo[]>();
  const result: (TrongridTxInfo | string)[] = [];

  for (const tx of txs) {
    if (tx.tokenType !== "trc20") {
      result.push(tx);
      continue;
    }
    const key = `${tx.txID}:${tx.tokenAddress}:${inferOperationType(tx, userAddress)}`;
    const group = groups.get(key);
    if (group) {
      group.push(tx);
    } else {
      groups.set(key, [tx]);
      result.push(key);
    }
  }

  return result.map(entry => {
    if (typeof entry !== "string") return entry;
    const group = groups.get(entry) as TrongridTxInfo[];
    return group.length === 1 ? group[0] : sumGroup(group);
  });
}

function sumGroup(group: TrongridTxInfo[]): TrongridTxInfo {
  const [first] = group;
  const value = group.reduce((sum, tx) => sum.plus(tx.value ?? 0), new BigNumber(0));
  return {
    ...first,
    value,
    senders: uniqueSorted(group.map(tx => tx.from)),
    recipients: uniqueSorted(group.flatMap(tx => (tx.to ? [tx.to] : []))),
  };
}

function uniqueSorted(addresses: string[]): string[] {
  return [...new Set(addresses)].sort((a, b) => a.localeCompare(b));
}
