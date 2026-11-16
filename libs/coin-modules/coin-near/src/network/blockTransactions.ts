import { type NearConfig } from "../config";
import { fetchNearblocks } from "./nearblocks";
import type { NearReceiptNode, NearTransaction, NearV3Response } from "./sdk.types";

const MAX_PAGE_SIZE = 100;

type NearIndexedBlock = {
  block_hash: string;
  block_height: string;
  block_timestamp: string;
};

export const fetchIndexedBlock = async (
  config: NearConfig,
  height: number,
): Promise<NearIndexedBlock> => {
  const body = await fetchNearblocks<NearV3Response<NearIndexedBlock>>(
    config,
    `/v3/blocks/${height}`,
  );

  if (!body.data) {
    throw new Error(`Near: block ${height} is not indexed`);
  }

  return body.data;
};

const fetchTransactionPages = async (
  config: NearConfig,
  blockHash: string,
  cursor: string | undefined,
  seenCursors: ReadonlySet<string>,
  collected: NearTransaction[],
): Promise<NearTransaction[]> => {
  const params = new URLSearchParams({ block: blockHash, limit: String(MAX_PAGE_SIZE) });
  if (cursor) {
    params.set("next", cursor);
  }

  const body = await fetchNearblocks<NearV3Response<NearTransaction[]>>(
    config,
    `/v3/txns?${params.toString()}`,
  );
  const page = body.data ?? [];
  const transactions = [...collected, ...page];
  const nextCursor = body.meta?.next_page;

  if (!nextCursor) {
    return transactions;
  }
  if (page.length === 0 || seenCursors.has(nextCursor)) {
    throw new Error(`Near: the indexer cursor does not advance for block ${blockHash}`);
  }

  return fetchTransactionPages(
    config,
    blockHash,
    nextCursor,
    new Set([...seenCursors, nextCursor]),
    transactions,
  );
};

export const fetchBlockTransactions = (
  config: NearConfig,
  blockHash: string,
): Promise<NearTransaction[]> => fetchTransactionPages(config, blockHash, undefined, new Set(), []);

export const fetchTransactionReceipts = async (
  config: NearConfig,
  transactionHash: string,
): Promise<NearReceiptNode> => {
  const body = await fetchNearblocks<NearV3Response<NearReceiptNode>>(
    config,
    `/v3/txns/${transactionHash}/receipts`,
  );

  if (!body.data) {
    throw new Error(`Near: no receipts indexed for transaction ${transactionHash}`);
  }

  return body.data;
};
