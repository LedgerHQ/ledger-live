import { sha256 } from "@cosmjs/crypto";
import {
  AssetInfo,
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  resolveGetBlockConcurrency,
  resolveGetBlockPaginationLimit,
  type CosmosCoinConfig,
} from "../../config";
import {
  BlockTransactionsMismatch,
  GetBlockError,
  InvalidBlockMessage,
  TransactionResultNotFound,
} from "../../errors";
import { CosmosAPI } from "../../network/Cosmos";
import { BlockTxSDK } from "../../network/types";
import { toBlockInfo } from "../../network/utils";
import { assertValidBlockHeight } from "./assertValidBlockHeight";
import { describeCause } from "./describeCause";

const MSG_SEND_TYPE = "/cosmos.bank.v1beta1.MsgSend";

type Coin = { denom: string; amount: string };
type Message = BlockTxSDK["body"]["messages"][number];

export async function getBlock(
  config: CosmosCoinConfig,
  api: CosmosAPI,
  height: number,
): Promise<Block> {
  try {
    return await fetchBlock(config, api, height);
  } catch (cause) {
    throw new GetBlockError(`Failed to get block ${height}: ${describeCause(cause)}`, {
      height,
      cause,
    });
  }
}

async function fetchBlock(
  config: CosmosCoinConfig,
  api: CosmosAPI,
  height: number,
): Promise<Block> {
  assertValidBlockHeight(height);

  const limit = resolveGetBlockPaginationLimit(config.getBlock);
  const concurrency = resolveGetBlockConcurrency(config.getBlock);
  const [blockWithTxs, results] = await Promise.all([
    api.getBlockWithTxs(height, limit, concurrency),
    api.getTransactionsByHeight(height, limit, concurrency),
  ]);

  const codeByHash = new Map(results.map(result => [result.txhash, result.code]));
  const rawTxs = (blockWithTxs.sdk_block ?? blockWithTxs.block).data.txs;

  if (blockWithTxs.txs.length !== rawTxs.length) {
    throw new BlockTransactionsMismatch(
      `Block ${height} returned ${blockWithTxs.txs.length} decoded transactions for ${rawTxs.length} raw transactions`,
      { height, decoded: blockWithTxs.txs.length, raw: rawTxs.length },
    );
  }

  const transactions = blockWithTxs.txs.map((tx, index) => {
    const hash = toTransactionHash(rawTxs[index]);
    const code = codeByHash.get(hash);
    if (code === undefined) {
      throw new TransactionResultNotFound(
        `Missing result for transaction ${hash} at block height ${height}`,
        { hash, height },
      );
    }
    return toBlockTransaction(config.denom, hash, code !== 0, tx);
  });

  return { info: toBlockInfo(blockWithTxs), transactions };
}

export function isCoinsArray(amount: unknown): amount is Coin[] {
  return (
    Array.isArray(amount) &&
    amount.every(
      coin =>
        typeof coin === "object" &&
        coin !== null &&
        typeof coin.denom === "string" &&
        typeof coin.amount === "string",
    )
  );
}

function toTransactionHash(rawTx: string): string {
  return Buffer.from(sha256(Buffer.from(rawTx, "base64")))
    .toString("hex")
    .toUpperCase();
}

function toBlockTransaction(
  denom: string,
  hash: string,
  failed: boolean,
  tx: BlockTxSDK,
): BlockTransaction {
  const { fee } = tx.auth_info;
  const fees = fee.amount
    .filter(coin => coin.denom === denom)
    .reduce((total, coin) => total + BigInt(coin.amount), 0n);
  const feesPayer = fee.granter || fee.payer || firstSigner(tx.body.messages[0]);

  return {
    hash,
    failed,
    fees,
    ...(feesPayer ? { feesPayer } : {}),
    operations: tx.body.messages.flatMap(message => toBlockOperations(denom, message)),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstSigner(message: Message | undefined): string | undefined {
  if (!message) return undefined;
  const owner =
    message["@type"].startsWith("/babylon.epoching.") && isRecord(message.msg)
      ? message.msg
      : message;
  const signer = owner.from_address ?? owner.delegator_address ?? owner.sender;
  return typeof signer === "string" ? signer : undefined;
}

function toBlockOperations(denom: string, message: Message): BlockOperation[] {
  if (message["@type"] !== MSG_SEND_TYPE) {
    return [{ type: "other", messageType: message["@type"] }];
  }

  const { from_address: from, to_address: to, amount: coins } = message;
  if (typeof from !== "string" || typeof to !== "string" || !isCoinsArray(coins)) {
    throw new InvalidBlockMessage(`Invalid ${MSG_SEND_TYPE} message`, {
      messageType: message["@type"],
    });
  }

  return coins
    .filter(coin => coin.denom === denom && BigInt(coin.amount) > 0n)
    .flatMap(coin => {
      const amount = BigInt(coin.amount);
      const asset = { type: "native" } as AssetInfo;
      return [
        {
          type: "transfer" as const,
          address: from,
          peer: to,
          asset,
          amount: -amount,
        },
        { type: "transfer" as const, address: to, peer: from, asset, amount },
      ];
    });
}
