import {
  Api,
  Block,
  BlockInfo,
  Cursor,
  Page,
  Validator,
  FeeEstimation,
  Operation,
  Pagination,
  Reward,
  Stake,
  TransactionIntent,
  CraftedTransaction,
} from "@ledgerhq/coin-framework/api/index";
import { isSendTransactionIntent } from "@ledgerhq/coin-framework/utils";
import { log } from "@ledgerhq/logs";
import coinConfig, { type XrpConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  craftRawTransaction,
  estimateFees,
  getBalance,
  getAccountInfo,
  getNextValidSequence,
  lastBlock,
  listOperations,
  validateIntent,
  MemoInput,
} from "../logic";
import { ListOperationsOptions, XrpMapMemo } from "../types";

export function createApi(config: XrpConfig): Api<XrpMapMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    craftRawTransaction,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations: operations,
    validateIntent,
    getBlock(_height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getSequence: async (address: string) => {
      const accountInfo = await getAccountInfo(address);
      return accountInfo.sequence;
    },
    getStakes(_address: string, _cursor?: Cursor): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(_cursor?: Cursor): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
  };
}

async function craft(
  transactionIntent: TransactionIntent<XrpMapMemo>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (isSendTransactionIntent(transactionIntent) === false) {
    throw new Error("Only transaction intentType is supported");
  }
  const nextSequenceNumber = await getNextValidSequence(transactionIntent.sender);
  const estimatedFees = customFees?.value ?? (await estimateFees()).fees;

  const memosMap =
    transactionIntent.memo?.type === "map" ? transactionIntent.memo.memos : new Map();

  const destinationTagValue = memosMap.get("destinationTag");
  const destinationTag =
    typeof destinationTagValue === "string" ? Number(destinationTagValue) : undefined;

  const memoStrings = memosMap.get("memos") as string[] | undefined;

  let memoEntries: MemoInput[] | undefined = undefined;

  if (Array.isArray(memoStrings) && memoStrings.length > 0) {
    memoEntries = memoStrings.map(value => ({ type: "memo", data: value }));
  }

  const tx = await craftTransaction(
    { address: transactionIntent.sender, nextSequenceNumber },
    {
      recipient: transactionIntent.recipient,
      amount: transactionIntent.amount,
      fees: estimatedFees,
      destinationTag,
      // NOTE: double check before/after here
      memos: memoEntries,
    },
    transactionIntent.senderPublicKey,
  );

  return { transaction: tx.serializedTransaction };
}

async function estimate(): Promise<FeeEstimation> {
  const estimation = await estimateFees();
  return { value: estimation.fees };
}

// NOTE: double check
async function operations(address: string, pagination: Pagination): Promise<[Operation[], string]> {
  const { minHeight, lastPagingToken, order } = pagination;
  const options: ListOperationsOptions = {
    limit: 200,
    minHeight: minHeight,
    order: order ?? "asc",
  };
  if (lastPagingToken) {
    const token = lastPagingToken.split("-");
    options.token = JSON.stringify({ ledger: Number(token[0]), seq: Number(token[1]) });
    log(options.token);
  }
  const [operations, apiNextCursor] = await listOperations(address, options);
  const next = apiNextCursor ? JSON.parse(apiNextCursor) : null;
  return [operations, next ? next.ledger + "-" + next.seq : ""];
}
