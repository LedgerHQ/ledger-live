import type {
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import { fetchBlock, fetchBlockTxs } from "../network/explorer";
import type { ExplorerTx } from "../network/types";
import { toBlockInfo } from "./getBlockInfo";
import { feeShares, sumByAddress } from "./txMovements";

/**
 * Maps an explorer transaction to a {@link BlockTransaction}: one native transfer per address,
 * signed (negative for a net sender), with fees excluded from the amounts: each sender's debit is
 * reduced by its share of the fee, so the amounts of a transaction sum to 0.
 */
export function toBlockTransaction(tx: ExplorerTx): BlockTransaction {
  const isCoinbase = tx.inputs.some(input => !!input.coinbase);
  const fees = isCoinbase ? 0n : BigInt(tx.fees);

  const inputs = isCoinbase ? {} : sumByAddress(tx.inputs);
  const outputs = sumByAddress(tx.outputs);
  const shares = feeShares(fees, inputs);

  const senders = Object.keys(inputs);
  const addresses = [...new Set([...senders, ...Object.keys(outputs)])];
  const operations: BlockOperation[] = [];
  for (const address of addresses) {
    const amount = (outputs[address] ?? 0n) - (inputs[address] ?? 0n) + (shares[address] ?? 0n);
    if (amount !== 0n) {
      operations.push({ type: "transfer", address, asset: { type: "native" }, amount });
    }
  }

  const transaction: BlockTransaction = { hash: tx.hash, failed: false, operations, fees };
  if (senders.length === 1) {
    transaction.feesPayer = senders[0];
  }
  return transaction;
}

export async function getBlock(
  context: BitcoinContext,
  currencyId: string,
  height: number,
): Promise<Block> {
  const config = await context.config(currencyId);
  const [block, txs] = await Promise.all([
    fetchBlock(config, currencyId, height),
    fetchBlockTxs(config, currencyId, height),
  ]);
  return { info: toBlockInfo(block), transactions: txs.map(toBlockTransaction) };
}
