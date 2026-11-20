import type {
  AssetInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { BlockNotFoundError, GetBlockError } from "@ledgerhq/coin-module-framework/errors";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import network from "@ledgerhq/live-network";
import type { FilecoinConfig } from "../config";

/** The fields of a Blockscout v2 block (`/blocks/{height or hash}`) that coin-filecoin reads. */
type BlockscoutBlock = {
  height: number;
  hash: string;
  parent_hash: string;
  /** ISO 8601 */
  timestamp: string;
};

type BlockscoutAddress = { hash: string };

type BlockscoutTransaction = {
  hash: string;
  from: BlockscoutAddress;
  /** Null for a contract deployment */
  to: BlockscoutAddress | null;
  /** The contract a deployment creates, which receives its value */
  created_contract?: BlockscoutAddress | null;
  /** Native amount, in attoFIL */
  value: string;
  /** The fee actually paid, in attoFIL */
  fee: { value: string };
  status: string;
  transaction_types: string[];
};

type BlockscoutTokenTransfer = {
  /** The block that holds the transaction, as of the time of the request */
  block_hash: string;
  token: { address_hash: string };
  total: { value: string } | null;
  from: BlockscoutAddress;
  to: BlockscoutAddress;
};

type BlockscoutPage<T> = {
  items: T[];
  next_page_params: Record<string, string | number | boolean> | null;
};

/** Token transfer requests in flight at once, to stay within the indexer rate limit. */
const TOKEN_TRANSFERS_BATCH_SIZE = 5;

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "LedgerAPI4xx" &&
    "status" in error &&
    error.status === 404
  );
}

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
    if (isNotFound(error)) {
      throw new BlockNotFoundError(`Block ${heightOrHash} not found on the indexer`, {
        height: heightOrHash,
      });
    }
    throw error;
  }
}

async function fetchAllPages<T>(url: string, maxPage: number): Promise<T[]> {
  const items: T[] = [];
  let params: BlockscoutPage<T>["next_page_params"] = null;
  for (let page = 0; page < maxPage; page++) {
    const response: { data: BlockscoutPage<T> } = await network<BlockscoutPage<T>>({
      method: "GET",
      url,
      ...(params && { params }),
    });
    items.push(...response.data.items);
    if (!response.data.next_page_params) return items;
    params = response.data.next_page_params;
  }
  throw new GetBlockError(`More than ${maxPage} pages of results for ${url}`);
}

/** The two sides of a transfer, one per party. Nothing moves when the amount is zero. */
function transfer(
  from: string,
  to: string | undefined,
  asset: AssetInfo,
  amount: bigint,
): BlockOperation[] {
  if (amount === 0n) return [];
  return [
    { type: "transfer", address: from, ...(to && { peer: to }), asset, amount: -amount },
    ...(to ? [{ type: "transfer" as const, address: to, peer: from, asset, amount }] : []),
  ];
}

function toBlockTransaction(
  tx: BlockscoutTransaction,
  tokenTransfers: BlockscoutTokenTransfer[],
): BlockTransaction {
  const failed = tx.status !== "ok";
  // A failed transaction only pays its fee: no balance moves.
  const operations = failed
    ? []
    : [
        ...transfer(
          tx.from.hash,
          (tx.to ?? tx.created_contract)?.hash,
          { type: "native" },
          BigInt(tx.value),
        ),
        ...tokenTransfers.flatMap(t =>
          transfer(
            t.from.hash,
            t.to.hash,
            { type: "erc20", assetReference: t.token.address_hash.toLowerCase() },
            BigInt(t.total?.value ?? 0),
          ),
        ),
      ];

  return {
    hash: tx.hash,
    failed,
    operations,
    fees: BigInt(tx.fee.value),
    feesAsset: { type: "native" },
    feesPayer: tx.from.hash,
  };
}

/**
 * Fetches the transactions of a block from the Blockscout v2 API: native transfers and ERC-20 transfers.
 * The block is read by hash, not by height: after a reorg a height can belong to another block.
 *
 * The block's transaction list leaves `token_transfers` empty, so the ERC-20 transfers of each
 * successful transaction that has some are fetched on their own. Native transfers made inside a
 * message (multisig, miner withdrawals) are not read.
 */
export async function fetchBlockscoutBlockTransactions(
  indexer: FilecoinConfig["indexer"],
  blockHash: string,
): Promise<BlockTransaction[]> {
  let transactions: BlockscoutTransaction[];
  try {
    transactions = await fetchAllPages<BlockscoutTransaction>(
      `${indexer.url}/blocks/${blockHash}/transactions`,
      indexer.maxPage,
    );
  } catch (error) {
    if (isNotFound(error)) {
      throw new BlockNotFoundError(`Block ${blockHash} not found on the indexer`, { blockHash });
    }
    throw error;
  }

  return promiseAllBatched(TOKEN_TRANSFERS_BATCH_SIZE, transactions, async tx => {
    const hasTokenTransfers = tx.status === "ok" && tx.transaction_types.includes("token_transfer");
    const tokenTransfers = hasTokenTransfers
      ? await fetchTokenTransfers(indexer, tx.hash, blockHash)
      : [];
    return toBlockTransaction(tx, tokenTransfers);
  });
}

/**
 * The ERC-20 transfers of a transaction that the block's list says has some, read by transaction
 * hash. The indexer filters on the token type, so other transfers (NFTs) do not count towards
 * `maxPage`. They must still be those of `blockHash`: after a reorg the transaction can be in
 * another block, where it may emit other transfers, or none.
 */
async function fetchTokenTransfers(
  indexer: FilecoinConfig["indexer"],
  txHash: string,
  blockHash: string,
): Promise<BlockscoutTokenTransfer[]> {
  const moved = new GetBlockError(`Transaction ${txHash} is no longer in block ${blockHash}`, {
    blockHash,
    txHash,
  });
  const url = `${indexer.url}/transactions/${txHash}/token-transfers`;
  let transfers: BlockscoutTokenTransfer[];
  let witnesses: BlockscoutTokenTransfer[];
  try {
    transfers = await fetchAllPages<BlockscoutTokenTransfer>(`${url}?type=ERC-20`, indexer.maxPage);
    // Without ERC-20 transfer, the first transfer of any type tells which block holds the transaction
    witnesses =
      transfers.length > 0
        ? transfers
        : (await network<BlockscoutPage<BlockscoutTokenTransfer>>({ method: "GET", url })).data
            .items;
  } catch (error) {
    throw isNotFound(error) ? moved : error;
  }

  if (
    witnesses.length === 0 ||
    witnesses.some(t => t.block_hash.toLowerCase() !== blockHash.toLowerCase())
  ) {
    throw moved;
  }

  return transfers;
}
