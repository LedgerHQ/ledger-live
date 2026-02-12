import type {
  Api,
  CraftedTransaction,
  Operation,
  TransactionValidation,
} from "@ledgerhq/coin-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import coinConfig from "../config";
import { HEDERA_OPERATION_TYPES } from "../constants";
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
import { mapIntentToSDKOperation, getOperationValue, getBlockHash } from "../logic/utils";
import { apiClient } from "../network/api";
import type { HederaMemo } from "../types";

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
    estimateFees: async transactionIntent => {
      const operationType = mapIntentToSDKOperation(transactionIntent);

      if (operationType === HEDERA_OPERATION_TYPES.ContractCall) {
        throw new Error("hedera: estimateFees for ContractCall is not supported yet");
      }

      const estimatedFee = await logicEstimateFees({ currency, operationType });

      return {
        value: BigInt(estimatedFee.tinybars.toString()),
      };
    },
    getBalance: address => getBalance(currency, address),
    getBlock: height => getBlock(height),
    getBlockInfo: height => getBlockInfo(height),
    lastBlock,
    listOperations: async (address, { cursor, limit, order }) => {
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
            date: liveOp.date,
            block: {
              height: liveOp.blockHeight ?? 10,
              hash: liveOp.blockHash ?? getBlockHash(liveOp.blockHeight ?? 10),
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
