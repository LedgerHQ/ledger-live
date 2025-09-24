import type {
  Api,
  AssetInfo,
  Block,
  BlockInfo,
  Cursor,
  Operation,
  Page,
  Pagination,
  Reward,
  Stake,
} from "@ledgerhq/coin-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import coinConfig, { type HederaConfig } from "../config";
import {
  broadcast as logicBroadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  listOperations as logicListOperations,
  getAssetFromToken,
  getTokenFromAsset,
  getSequence,
  getChainSpecificData,
  lastBlock,
  validateIntent,
} from "../logic/index";
import { base64ToUrlSafeBase64, mapIntentToSDKOperation, getOperationValue } from "../logic/utils";
import { hederaMirrorNode } from "../network/mirror";
import type { HederaMemo } from "../types";

export function createApi(config: HederaConfig): Api<HederaMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));
  const currency = getCryptoCurrencyById("hedera");

  return {
    broadcast: async tx => {
      const response = await logicBroadcast(tx);
      const base64Hash = Buffer.from(response.transactionHash).toString("base64");
      const base64HashUrlSafe = base64ToUrlSafeBase64(base64Hash);

      return base64HashUrlSafe;
    },
    combine,
    craftTransaction: async (txIntent, customFees) => {
      const { serializedTx } = await craftTransaction(txIntent, customFees);

      return {
        transaction: serializedTx,
      };
    },
    estimateFees: async transactionIntent => {
      const operationType = mapIntentToSDKOperation(transactionIntent);
      const estimatedFee = await estimateFees(currency, operationType);

      return {
        value: BigInt(estimatedFee.toString()),
      };
    },
    getBalance: (address: string) => getBalance(currency, address),
    lastBlock,
    validateIntent: (transactionIntent, customFees) => {
      return validateIntent(currency, transactionIntent, customFees);
    },
    listOperations: async (address: string, pagination: Pagination) => {
      const mirrorTokens = await hederaMirrorNode.getAccountTokens(address);
      const latestAccountOperations = await logicListOperations({
        currency,
        address,
        pagination,
        mirrorTokens,
      });

      const liveOperations = [
        ...latestAccountOperations.coinOperations,
        ...latestAccountOperations.tokenOperations,
      ];

      const sortedLiveOperations = [...liveOperations].sort((a, b) => {
        const aTime = a.date.getTime();
        const bTime = b.date.getTime();
        return pagination.order === "desc" ? bTime - aTime : aTime - bTime;
      });

      const alpacaOperations = sortedLiveOperations.map(liveOp => {
        const asset = liveOp.contract
          ? {
              type: liveOp.standard ?? "token",
              assetReference: liveOp.contract,
              assetOwner: address,
            }
          : { type: "native" };

        return {
          id: liveOp.id,
          type: liveOp.type,
          senders: liveOp.senders,
          recipients: liveOp.recipients,
          value: getOperationValue({ asset, operation: liveOp }),
          asset,
          details: {
            ...liveOp.extra,
            ledgerOpType: liveOp.type,
            status: liveOp.hasFailed ? "failed" : "success",
            ...(asset.type !== "native" && { assetAmount: liveOp.value.toFixed(0) }),
          },
          tx: {
            hash: liveOp.hash,
            fees: BigInt(liveOp.fee.toFixed(0)),
            date: liveOp.date,
            block: {
              height: liveOp.blockHeight ?? 10,
            },
          },
        } satisfies Operation;
      });

      const lastOperation = alpacaOperations[alpacaOperations.length - 1];
      const next = lastOperation?.details?.consensusTimestamp ?? "";

      return [alpacaOperations, next];
    },
    getTokenFromAsset: (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken,
    getSequence,
    getChainSpecificData,
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
