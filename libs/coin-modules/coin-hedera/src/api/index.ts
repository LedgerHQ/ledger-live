import invariant from "invariant";
import type {
  Api,
  CraftedTransaction,
  Operation,
  Page,
  Reward,
  Stake,
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
} from "../logic/index";
import { mapIntentToSDKOperation, getOperationValue, toEVMAddress } from "../logic/utils";
import { apiClient } from "../network/api";
import { getERC20BalancesForAccount } from "../network/utils";
import type { EstimateFeesParams, HederaMemo, HederaTxData } from "../types";

export function createApi(config: Record<string, never>): Api<HederaMemo, HederaTxData> {
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
    listOperations: async (address, pagination) => {
      const evmAddress = await toEVMAddress(address);
      invariant(evmAddress, "hedera: evm address is missing");

      const [mirrorTokens, erc20TokenBalances] = await Promise.all([
        apiClient.getAccountTokens(address),
        getERC20BalancesForAccount(evmAddress),
      ]);

      const latestAccountOperations = await logicListOperations({
        currency,
        address,
        pagination,
        mirrorTokens,
        fetchAllPages: false,
        skipFeesForTokenOperations: true,
        useEncodedHash: false,
        useSyntheticBlocks: true,
        erc20TokenBalances,
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
            ...(asset.type !== "native" && { assetAmount: liveOp.value.toFixed(0) }),
          },
          tx: {
            hash: liveOp.hash,
            fees: BigInt(liveOp.fee.toFixed(0)),
            date: liveOp.date,
            block: {
              height: liveOp.blockHeight ?? 10,
            },
            failed: liveOp.hasFailed ?? false,
          },
        } satisfies Operation;
      });

      return [alpacaOperations, latestAccountOperations.nextCursor ?? ""];
    },
    getTokenFromAsset: asset => getTokenFromAsset(currency, asset),
    getAssetFromToken,
    getValidators: cursor => getValidators(cursor),
    validateIntent: async (_transactionIntent, _customFees): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getSequence: async (_address): Promise<bigint> => {
      throw new Error("getSequence is not supported");
    },
    getStakes: async (_address, _cursor): Promise<Page<Stake>> => {
      throw new Error("getStakes is not supported");
    },
    getRewards: async (_address, _cursor): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
  };
}
