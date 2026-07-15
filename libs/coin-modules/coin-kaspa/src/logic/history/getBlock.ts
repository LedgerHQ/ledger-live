import type {
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { getBlocksFromBlueScore } from "../../network";
import type { ApiResponseBlockTransaction } from "../../types";
import { pickChainBlock, toBlockInfo } from "./blockInfo";

/**
 * Full block (metadata + transactions) at a given virtual-chain blue score. Same block-selection
 * convention as `getBlockInfo`: `height` is the virtual-chain blue score, and we return the
 * selected-chain block.
 *
 * UTXO limitation (see `ApiResponseBlockTransaction`): the block endpoint resolves transaction
 * *outputs* (recipient address + amount) but not *inputs* (only a previous-outpoint reference).
 * So this maps outputs to incoming `transfer` operations only; sender debits and per-tx `fees`
 * are not derivable here without resolving each previous outpoint separately.
 */
export async function getBlock(height: number): Promise<Block> {
  const blocks = await getBlocksFromBlueScore(height, true);
  const block = pickChainBlock(blocks, height);

  return {
    info: toBlockInfo(block, height),
    transactions: (block.transactions ?? []).map(toBlockTransaction),
  };
}

function toBlockTransaction(tx: ApiResponseBlockTransaction): BlockTransaction {
  const operations: BlockOperation[] = (tx.outputs ?? []).flatMap(output => {
    const address = output.verboseData?.scriptPublicKeyAddress;
    if (!address) return []; // unspendable / non-address output (e.g. some coinbase scripts)
    return [
      {
        type: "transfer",
        address,
        asset: { type: "native" },
        // amount is a JSON number (sompi). Large values risk float precision — acceptable for a
        // first pass; revisit if the endpoint is used for high-value accounting.
        amount: BigInt(output.amount ?? 0),
      },
    ];
  });

  return {
    hash: tx.verboseData.transactionId,
    failed: false, // blocks only contain accepted transactions
    operations,
    // Not available from the block endpoint (needs input resolution). Documented above.
    fees: 0n,
    details: { mass: tx.mass ?? undefined, computeMass: tx.verboseData.computeMass ?? undefined },
  };
}
