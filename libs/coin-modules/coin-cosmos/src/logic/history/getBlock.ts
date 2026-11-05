import { sha256 } from "@cosmjs/crypto";
import { Block, BlockOperation, BlockTransaction } from "@ledgerhq/coin-module-framework/api/types";
import type { CosmosCoinConfig } from "../../config";
import { CosmosAPI } from "../../network/Cosmos";
import { BlockTxSDK } from "../../network/types";
import { toBlockInfo } from "../../network/utils";
import { assertValidBlockHeight } from "./assertValidBlockHeight";

const MSG_SEND_TYPE = "/cosmos.bank.v1beta1.MsgSend";

type Coin = { denom: string; amount: string };
type Message = BlockTxSDK["body"]["messages"][number];

export async function getBlock(
  config: CosmosCoinConfig,
  api: CosmosAPI,
  height: number,
): Promise<Block> {
  assertValidBlockHeight(height);

  const [blockWithTxs, results] = await Promise.all([
    api.getBlockWithTxs(height),
    api.getTransactionsByHeight(height),
  ]);

  const codeByHash = new Map(results.map(result => [result.txhash, result.code]));
  const rawTxs = (blockWithTxs.sdk_block ?? blockWithTxs.block).data.txs;

  const transactions = blockWithTxs.txs.map((tx, index) => {
    const hash = toTransactionHash(rawTxs[index]);
    const code = codeByHash.get(hash);
    if (code === undefined) {
      throw new Error(`Missing result for transaction ${hash} at block height ${height}`);
    }
    return toBlockTransaction(config.denom, hash, code !== 0, tx);
  });

  return { info: toBlockInfo(blockWithTxs), transactions };
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
  const feesPayer = fee.payer || fee.granter || firstSigner(tx.body.messages[0]);

  return {
    hash,
    failed,
    fees,
    ...(feesPayer ? { feesPayer } : {}),
    operations: tx.body.messages.flatMap(message => toBlockOperations(denom, message)),
  };
}

function firstSigner(message: Message | undefined): string | undefined {
  if (!message) return undefined;
  const owner = (message.msg as Message | undefined) ?? message;
  const signer = owner.from_address ?? owner.delegator_address ?? owner.sender;
  return typeof signer === "string" ? signer : undefined;
}

function toBlockOperations(denom: string, message: Message): BlockOperation[] {
  if (message["@type"] !== MSG_SEND_TYPE) {
    return [{ type: "other", messageType: message["@type"] }];
  }

  const from = message.from_address as string;
  const to = message.to_address as string;
  return (message.amount as Coin[])
    .filter(coin => coin.denom === denom && BigInt(coin.amount) > 0n)
    .flatMap(coin => {
      const amount = BigInt(coin.amount);
      const asset = { type: "native" };
      return [
        { type: "transfer" as const, address: from, peer: to, asset, amount: -amount },
        { type: "transfer" as const, address: to, peer: from, asset, amount },
      ];
    });
}
