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

export const fetchBlockTransactions = async (
  config: NearConfig,
  blockHash: string,
): Promise<NearTransaction[]> => {
  const transactions: NearTransaction[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ block: blockHash, limit: String(MAX_PAGE_SIZE) });
    if (cursor) {
      params.set("next", cursor);
    }

    const body = await fetchNearblocks<NearV3Response<NearTransaction[]>>(
      config,
      `/v3/txns?${params.toString()}`,
    );
    const page = body.data ?? [];
    transactions.push(...page);
    cursor = body.meta?.next_page;

    if (cursor && (page.length === 0 || seenCursors.has(cursor))) {
      throw new Error(`Near: the indexer cursor does not advance for block ${blockHash}`);
    }
    if (cursor) {
      seenCursors.add(cursor);
    }
  } while (cursor);

  return transactions;
};

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
