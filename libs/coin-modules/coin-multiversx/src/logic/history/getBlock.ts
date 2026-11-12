import type {
  AssetInfo,
  Block,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import { ESDT_SYSTEM_SC_BECH32, METACHAIN_SHARD } from "../../constants";
import { MultiversXRoundNotFinal } from "../../errors";
import type { MultiversXNetworkApi } from "../../network/api";
import type { MultiversXApiTransaction, MultiversXTransactionOperation } from "../../types";
import { assertBlockHeight, getBlockInfo } from "./getBlockInfo";

const NATIVE_ASSET: AssetInfo = { type: "native" };
const EGLD_AS_ESDT_IDENTIFIER = "EGLD-000000";
const PROTOCOL_REWARD_SENDER = String(METACHAIN_SHARD);

/**
 * Get the transactions of a metachain round, across all shards, with their transfers, inner
 * smart contract transfers included, fees and fee payer.
 *
 * @throws MultiversXRoundNotFinal while a transaction of the round is still pending
 */
export async function getBlock(api: MultiversXNetworkApi, height: number): Promise<Block> {
  assertBlockHeight(height);
  const [info, transactions] = await Promise.all([
    getBlockInfo(api, height),
    api.getRoundTransactions(height),
  ]);

  const pending = transactions.find(tx => tx.status === "pending");
  if (pending) {
    throw new MultiversXRoundNotFinal(
      `MultiversX round ${height} is not final: transaction ${pending.txHash} is pending`,
    );
  }

  return { info, transactions: transactions.map(toBlockTransaction) };
}

function toBlockTransaction(tx: MultiversXApiTransaction): BlockTransaction {
  const failed = tx.status !== "success";
  const isProtocolReward = tx.sender === PROTOCOL_REWARD_SENDER;
  const feesPayer = isProtocolReward ? undefined : (tx.relayer ?? tx.sender);

  return {
    hash: tx.txHash ?? "",
    failed,
    operations: failed
      ? []
      : [...toValueTransfer(tx), ...(tx.operations ?? []).flatMap(toBlockOperations)],
    fees: toBigInt(tx.fee),
    ...(feesPayer ? { feesPayer } : {}),
  };
}

// The API leaves the transaction's own value out of its operations, which only hold what smart contracts moved
function toValueTransfer(tx: MultiversXApiTransaction): BlockOperation[] {
  const value = toBigInt(tx.value);
  if (!tx.sender || !tx.receiver || value === 0n) return [];

  if (tx.sender === PROTOCOL_REWARD_SENDER) {
    return [{ type: "transfer", address: tx.receiver, asset: NATIVE_ASSET, amount: value }];
  }
  return transfer(tx.sender, tx.receiver, NATIVE_ASSET, value);
}

function toBlockOperations(operation: MultiversXTransactionOperation): BlockOperation[] {
  const asset = toAsset(operation);
  const value = toBigInt(operation.value);
  if (!asset || value === 0n) return [];

  switch (operation.action) {
    case "transfer":
      return transfer(operation.sender, operation.receiver, asset, value);
    case "localMint":
      return [{ type: "transfer", address: operation.sender, asset, amount: value }];
    case "localBurn":
      return [{ type: "transfer", address: operation.sender, asset, amount: -value }];
    default:
      return [];
  }
}

function toAsset({ type, identifier }: MultiversXTransactionOperation): AssetInfo | undefined {
  if (type === "egld" || identifier === EGLD_AS_ESDT_IDENTIFIER) return NATIVE_ASSET;
  if ((type === "esdt" || type === "nft") && identifier) {
    return { type: "esdt", assetReference: identifier, assetOwner: ESDT_SYSTEM_SC_BECH32 };
  }
  return undefined;
}

function transfer(from: string, to: string, asset: AssetInfo, amount: bigint): BlockOperation[] {
  return [
    { type: "transfer", address: from, peer: to, asset, amount: -amount },
    { type: "transfer", address: to, peer: from, asset, amount },
  ];
}

function toBigInt(value: BigNumber | string | undefined | null): bigint {
  return BigInt(new BigNumber(value ?? 0).toFixed(0));
}
