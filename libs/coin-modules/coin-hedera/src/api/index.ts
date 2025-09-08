import {
  AlpacaApi,
  AssetInfo,
  Block,
  BlockInfo,
  Cursor,
  IncorrectTypeError,
  Operation,
  Page,
  Pagination,
  Reward,
  Stake,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type HederaConfig } from "../config";
import {
  broadcast as logicBroadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  listOperations as logicListOperations,
  lastBlock,
} from "../logic/index";
import type { HederaMemo } from "../types";
import { isHederaTransactionType } from "../logic";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { prepareOperations } from "../bridge/utils";
import { mirrorNode } from "../network/mirror";
import { Operation as LiveOperation } from "@ledgerhq/types-live";

const mapToOperation = (liveOperation: LiveOperation): Operation => {
  const assetInfo: AssetInfo = { type: "native" };

  // FIXME: detect if this is token related operation
  // if (asset.type === "token") {
  //   assetInfo.assetReference = liveOperation.contract ?? "";
  //   assetInfo.assetOwner = asset.owner;
  //   assetInfo.type = "hts"; // FIXME:
  // }

  return {
    id: liveOperation.id,
    type: liveOperation.type,
    senders: liveOperation.senders,
    recipients: liveOperation.recipients,
    value: BigInt(liveOperation.value.toFixed(0)),
    asset: assetInfo,
    tx: {
      hash: liveOperation.hash,
      fees: BigInt(liveOperation.fee.toFixed(0)),
      date: liveOperation.date,
      block: {
        height: liveOperation.blockHeight ?? 0,
      },
    },
  };
};
export function createApi(config: HederaConfig): AlpacaApi<HederaMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));
  const currency = getCryptoCurrencyById("hedera");

  return {
    broadcast: async tx => {
      const response = await logicBroadcast(tx);
      return response.transactionId.toString();
    },
    combine,
    craftTransaction: async (txIntent, customFees) => {
      const { serializedTx } = await craftTransaction(txIntent, customFees);
      return serializedTx;
    },
    estimateFees: async transactionIntent => {
      if (!isHederaTransactionType(transactionIntent.type)) {
        throw new IncorrectTypeError(`hedera: unsupported type - ${transactionIntent.type}`);
      }

      const estimatedFee = await estimateFees(currency, transactionIntent.type);

      return {
        value: BigInt(estimatedFee.toString()),
      };
    },
    getBalance,
    lastBlock,
    listOperations: async (address: string, pagination: Pagination) => {
      const [mirrorTokens, latestAccountOperations] = await Promise.all([
        mirrorNode.getAccountTokens(address),
        logicListOperations({ address, pagination }),
      ]);

      const liveOperations = prepareOperations(
        latestAccountOperations.coinOperations,
        latestAccountOperations.tokenOperations,
        mirrorTokens,
      );

      const alpacaOperations = liveOperations.map(liveOp => mapToOperation(liveOp));

      return [alpacaOperations, ""];
    },
    getBlock: async (_height): Promise<Block> => {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo: async (_height: number): Promise<BlockInfo> => {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes: async (_address: string, _cursor?: Cursor): Promise<Page<Stake>> => {
      throw new Error("getStakes is not supported");
    },
    getRewards: async (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
  };
}
