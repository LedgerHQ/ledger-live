import type {
  Api,
  CraftedTransaction,
  Operation,
  TransactionValidation,
} from "@ledgerhq/coin-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import invariant from "invariant";
import coinConfig from "../config";
import { HARDCODED_BLOCK_HEIGHT, HEDERA_OPERATION_TYPES } from "../constants";
import {
  broadcast as logicBroadcast,
  combine,
  craftTransaction,
  estimateFees as logicEstimateFees,
  getBalance,
  getBlock,
  getBlockInfo,
  listOperations as logicListOperations,
  getAssetFromToken,
  getTokenFromAsset,
  lastBlock,
  getValidators,
  getStakes,
  getRewards,
} from "../logic/index";
import {
  extractFeesPayer,
  mapIntentToSDKOperation,
  getOperationValue,
  getBlockHash,
} from "../logic/utils";
import { apiClient } from "../network/api";
import type { EstimateFeesParams, HederaMemo } from "../types";

export function createApi(config: Record<string, never>): Api<HederaMemo> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));
  const currency = getCryptoCurrencyById("hedera");

  return {
    broadcast: async tx => {
      const response = await logicBroadcast(tx);

      return Buffer.from(response.transactionHash).toString("base64");
    },
    combine,
    craftTransaction: async (txIntent, customFees) => {
      invariant(!txIntent.useAllAmount, "useAllAmount is not supported");
      const { serializedTx } = await craftTransaction(txIntent, customFees);

      return {
        transaction: serializedTx,
      };
    },
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: async txIntent => {
      let estimateFeesParams: EstimateFeesParams;
      const operationType = mapIntentToSDKOperation(txIntent);

      if (operationType === HEDERA_OPERATION_TYPES.ContractCall) {
        estimateFeesParams = { operationType, txIntent };
      } else {
        estimateFeesParams = { currency, operationType };
      }

      const estimatedFee = await logicEstimateFees(estimateFeesParams);

      return {
        value: BigInt(estimatedFee.tinybars.toString()),
      };
    },
    getBalance: address => getBalance(currency, address),
    getBlock: height => getBlock(height),
    getBlockInfo: height => getBlockInfo(height),
    lastBlock,
    listOperations: async (address, { cursor, limit, order, minHeight }) => {
      invariant(minHeight === 0, "minHeight is not supported");

      const mirrorTokens = await apiClient.getAccountTokens(address);
      const latestAccountOperations = await logicListOperations({
        currency,
        address,
        cursor,
        limit,
        order,
        mirrorTokens,
        fetchAllPages: false,
        skipFeesForTokenOperations: true,
        useEncodedHash: false,
        useSyntheticBlocks: true,
      });

      const liveOperations = [
        ...latestAccountOperations.coinOperations,
        ...latestAccountOperations.tokenOperations,
      ];

      const sortedLiveOperations = [...liveOperations].sort((a, b) => {
        const aTime = a.date.getTime();
        const bTime = b.date.getTime();
        return order === "desc" ? bTime - aTime : aTime - bTime;
      });

      const alpacaOperations = sortedLiveOperations.map(liveOp => {
        const asset = liveOp.contract
          ? {
              type: liveOp.standard ?? "token",
              assetReference: liveOp.contract,
              assetOwner: address,
            }
          : { type: "native" };

        const feesPayer = liveOp.extra?.transactionId
          ? extractFeesPayer(liveOp.extra.transactionId)
          : undefined;

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
            ...(asset.type !== "native" && { assetAmount: liveOp.value.toFixed(0) }),
            ...(liveOp.extra.stakedAmount && {
              stakedAmount: BigInt(liveOp.extra.stakedAmount.toFixed(0)),
            }),
          },
          tx: {
            hash: liveOp.hash,
            fees: BigInt(liveOp.fee.toFixed(0)),

            ...(feesPayer && { feesPayer }),
            date: liveOp.date,
            block: {
              height: liveOp.blockHeight ?? HARDCODED_BLOCK_HEIGHT,
              hash: liveOp.blockHash ?? getBlockHash(liveOp.blockHeight ?? HARDCODED_BLOCK_HEIGHT),
              time: liveOp.date,
            },
            failed: liveOp.hasFailed ?? false,
          },
        } satisfies Operation;
      });

      return { items: alpacaOperations, next: latestAccountOperations.nextCursor || undefined };
    },
    getTokenFromAsset: asset => getTokenFromAsset(currency, asset),
    getAssetFromToken,
    getValidators: cursor => getValidators(cursor),
    getStakes: async address => getStakes(address),
    getRewards: async (address, cursor) => getRewards(address, cursor),
    validateIntent: async (
      _transactionIntent,
      _balances,
      _customFees,
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getSequence: async (_address): Promise<bigint> => {
      throw new Error("getSequence is not supported");
    },
  };
}
