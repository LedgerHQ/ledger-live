import network from "@ledgerhq/live-network/network";
import { blockchainBaseURL } from "@ledgerhq/wallet-btc/explorer/baseUrl";
import type { TX } from "@ledgerhq/wallet-btc/storage/types";
import type {
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinContext } from "../api/config";
import { walletBtcCurrencyById } from "../walletBtcCurrency";
import { getBlockByHeight } from "../network";

/**
 * The full block at `height` with its transactions mapped to account-agnostic {@link BlockOperation}
 * transfers. For a UTXO chain each input is an outgoing transfer (negative) for its address and each
 * output an incoming transfer (positive) for its address; coinbase inputs and non-address outputs
 * (e.g. OP_RETURN) are skipped. Confirmed Bitcoin transactions never fail. `feesPayer` is omitted —
 * a UTXO transaction has no single fee payer.
 *
 * Note: a Bitcoin block can hold thousands of transactions; the explorer returns them in one
 * `block/{height}/txs` response, so this is a heavy, rarely-used call by design.
 */
export async function getBlock(
  context: BitcoinContext,
  currencyId: string,
  height: number,
): Promise<Block> {
  const config = await context.config(currencyId);
  const base = config?.explorer?.uri ?? blockchainBaseURL(walletBtcCurrencyById(currencyId));

  const block = await getBlockByHeight(currencyId, height, config);
  if (!block) {
    throw new Error(`getBlock: explorer returned no block at height ${height}`);
  }

  const { data } = await network<TX[]>({
    method: "GET",
    url: `${base}/block/${height}/txs`,
    params: { verbosity: "Full" },
  });

  const transactions = (data ?? []).map(toBlockTransaction);
  return {
    info: { height: block.height, hash: block.hash, time: new Date(block.time) },
    transactions,
  };
}

function toBlockTransaction(tx: TX): BlockTransaction {
  const operations: BlockOperation[] = [];
  for (const input of tx.inputs) {
    // Coinbase inputs carry no address/value.
    if (input.address && input.value !== undefined) {
      operations.push({
        type: "transfer",
        address: input.address,
        asset: { type: "native" },
        amount: -BigInt(input.value),
      });
    }
  }
  for (const output of tx.outputs) {
    if (output.address && !output.address.includes("unknown")) {
      operations.push({
        type: "transfer",
        address: output.address,
        asset: { type: "native" },
        amount: BigInt(output.value),
      });
    }
  }
  return {
    hash: tx.hash ?? tx.id,
    failed: false,
    fees: BigInt(tx.fees ?? 0),
    operations,
  };
}
