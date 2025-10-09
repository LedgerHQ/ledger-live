import type {
  Api,
  Block,
  BlockInfo,
  CraftedTransaction,
  Operation,
  Page,
  Reward,
  Stake,
  TransactionValidation,
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
  lastBlock,
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
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: number,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: async transactionIntent => {
      const operationType = mapIntentToSDKOperation(transactionIntent);
      const estimatedFee = await estimateFees(currency, operationType);

      return {
        value: BigInt(estimatedFee.toString()),
      };
    },
    getBalance: address => getBalance(currency, address),
    lastBlock,
    listOperations: async (address, pagination) => {
      const mirrorTokens = await hederaMirrorNode.getAccountTokens(address);
      const latestAccountOperations = await logicListOperations({
        currency,
        address,
        pagination,
        mirrorTokens,
        fetchAllPages: false,
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

      return [alpacaOperations, latestAccountOperations.nextCursor ?? ""];
    },
    getTokenFromAsset: asset => getTokenFromAsset(currency, asset),
    getAssetFromToken,
    validateIntent: async (_transactionIntent, _customFees): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getSequence: async (_address): Promise<number> => {
      throw new Error("getSequence is not supported");
    },
    getBlock: async (_height): Promise<Block> => {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo: async (_height): Promise<BlockInfo> => {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes: async (_address, _cursor): Promise<Page<Stake>> => {
      throw new Error("getStakes is not supported");
    },
    getRewards: async (_address, _cursor): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
  };
}
