import { BlockNotFoundError } from "@ledgerhq/coin-module-framework/errors";
import network from "@ledgerhq/live-network";

/** The fields of a Blockscout v2 block (`/blocks/{height or hash}`) that coin-filecoin reads. */
type BlockscoutBlock = {
  height: number;
  hash: string;
  parent_hash: string;
  /** ISO 8601 */
  timestamp: string;
};

/**
 * Fetches a block from the Blockscout v2 API, by height or by hash.
 *
 * Blockscout answers 404 for a height it does not hold: before the FEVM upgrade (history starts at
 * block 2683348) and on a null round, an epoch that produced no block.
 */
export async function fetchBlockscoutBlock(
  indexerUrl: string,
  heightOrHash: number | string,
): Promise<BlockscoutBlock> {
  try {
    const { data } = await network<BlockscoutBlock>({
      method: "GET",
      url: `${indexerUrl}/blocks/${heightOrHash}`,
    });
    return data;
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "LedgerAPI4xx" &&
      "status" in error &&
      error.status === 404
    ) {
      throw new BlockNotFoundError(`Block ${heightOrHash} not found on the indexer`, {
        height: heightOrHash,
      });
    }
    throw error;
  }
}
