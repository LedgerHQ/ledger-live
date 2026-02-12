import {
  AlpacaApi,
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
import type { BroadcastConfig } from "@ledgerhq/types-live";
import coinConfig, { type PolkadotConfig } from "../config";
import {
  broadcast,
  craftEstimationTransaction,
  craftTransaction,
  defaultExtrinsicArg,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
} from "../logic";

export function createApi(config: PolkadotConfig): AlpacaApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast: (transaction: string, _broadcastConfig?: BroadcastConfig) =>
      broadcast(transaction, "polkadot"),
    combine: () => {
      throw new Error("UnsupportedMethod");
    },
    craftTransaction: craft,
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations: operations,
    getBlock(_height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
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

async function craft(transactionIntent: TransactionIntent): Promise<CraftedTransaction> {
  const extrinsicArg = defaultExtrinsicArg(transactionIntent.amount, transactionIntent.recipient);
  //TODO: Retrieve correctly the nonce via a call to the node `await api.rpc.system.accountNextIndex(address)`
  const nonce = 0;
  const tx = await craftTransaction(transactionIntent.sender, nonce, extrinsicArg);
  const extrinsic = tx.registry.createType("Extrinsic", tx.unsigned, {
    version: tx.unsigned.version,
  });
  return { transaction: extrinsic.toHex() };
}

async function estimate(transactionIntent: TransactionIntent): Promise<FeeEstimation> {
  const tx = await craftEstimationTransaction(transactionIntent.sender, transactionIntent.amount);
  const value = await estimateFees(tx);
  return { value };
}

async function operations(
  address: string,
  { minHeight }: Pagination,
): Promise<[Operation[], string]> {
  const [ops, nextHeight] = await listOperations(address, { limit: 0, startAt: minHeight });
  return [ops, JSON.stringify(nextHeight)];
}
