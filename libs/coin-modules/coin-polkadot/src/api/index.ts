import {
  AlpacaApi,
  Block,
  BlockInfo,
  Cursor,
  Page,
  FeeEstimation,
  Operation,
  Pagination,
  Reward,
  Stake,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
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
    broadcast,
    combine: () => {
      throw new Error("UnsupportedMethod");
    },
    craftTransaction: craft,
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
  };
}

async function craft(transactionIntent: TransactionIntent): Promise<string> {
  const extrinsicArg = defaultExtrinsicArg(transactionIntent.amount, transactionIntent.recipient);
  //TODO: Retrieve correctly the nonce via a call to the node `await api.rpc.system.accountNextIndex(address)`
  const nonce = 0;
  const tx = await craftTransaction(transactionIntent.sender, nonce, extrinsicArg);
  const extrinsic = tx.registry.createType("Extrinsic", tx.unsigned, {
    version: tx.unsigned.version,
  });
  return extrinsic.toHex();
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
  const [ops, nextHeight] = await listOperations(address, { limit: 0, startAt: minHeight || 0 });
  return [ops, JSON.stringify(nextHeight)];
}
