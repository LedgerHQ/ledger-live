import {
  AlpacaApi,
  Block,
  BlockInfo,
  Cursor,
  FeeEstimation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type CantonConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getNextValidSequence,
  lastBlock,
  listOperations,
} from "../common-logic";
import BigNumber from "bignumber.js";

export function createApi(config: CantonConfig): AlpacaApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft(config.nativeInstrumentId || ""),
    estimateFees: estimate(config.nativeInstrumentId || ""),
    getBalance,
    lastBlock,
    listOperations,
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

const craft =
  (tokenId: string) =>
  async (transactionIntent: TransactionIntent): Promise<string> => {
    const nextSequenceNumber = await getNextValidSequence(transactionIntent.sender);
    const tx = await craftTransaction(
      { address: transactionIntent.sender, nextSequenceNumber },
      {
        recipient: transactionIntent.recipient,
        amount: new BigNumber(transactionIntent.amount.toString()),
        tokenId,
        expireInSeconds: 24 * 60 * 60,
      },
    );
    return tx.serializedTransaction;
  };

const estimate =
  (tokenId: string) =>
  async (transactionIntent: TransactionIntent): Promise<FeeEstimation> => {
    const { serializedTransaction } = await craftTransaction(
      { address: transactionIntent.sender },
      {
        recipient: transactionIntent.recipient,
        amount: new BigNumber(transactionIntent.amount.toString()),
        tokenId,
        expireInSeconds: 24 * 60 * 60,
      },
    );

    const value = await estimateFees(serializedTransaction);

    return { value };
  };
