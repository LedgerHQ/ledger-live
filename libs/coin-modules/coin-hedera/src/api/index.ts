import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  CoinModuleApi,
  BalanceOptions,
  CraftedTransaction,
  Operation,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { validateAddress } from "../bridge/validateAddress";
import hederaCoinConfig, { type HederaCoinConfig, type HederaConfig } from "../config";
import {
  HARDCODED_BLOCK_HEIGHT,
  HEDERA_OPERATION_TYPES,
  STAKING_REWARD_HASH_SUFFIX,
} from "../constants";
import {
  combine,
  craftTransaction,
  getBalance,
  getBlockInfo,
  getBlockV2,
  getRewards,
  getStakes,
  getValidators,
  lastBlockV2,
  broadcast as logicBroadcast,
  estimateFees as logicEstimateFees,
  listOperationsV2 as logicListOperationsV2,
} from "../logic";
import {
  extractInitiator,
  getBlockHash,
  getOperationValue,
  mapIntentToSDKOperation,
} from "../logic/utils";
import { apiClient } from "../network/api";
import { getERC20BalancesForAccountV2, toEVMAddress } from "../network/utils";
import type { EstimateFeesParams, HederaMemo, HederaTxData } from "../types";

export function createApi(
  config: HederaConfig,
  currencyId: string,
): CoinModuleApi<HederaMemo, HederaTxData> & BridgeApi {
  const coinConfig: HederaCoinConfig = { ...config, status: { type: "active" } };
  hederaCoinConfig.setCoinConfig(() => coinConfig);

  return {
    broadcast: async tx => {
      const response = await logicBroadcast({
        configOrCurrencyId: coinConfig,
        txWithSignature: tx,
      });

      return Buffer.from(response.transactionHash).toString("base64");
    },
    combine,
    craftTransaction: async (txIntent, customFees) => {
      invariant(!txIntent.useAllAmount, "useAllAmount is not supported");
      const { serializedTx } = await craftTransaction({
        configOrCurrencyId: coinConfig,
        txIntent,
        ...(customFees && { customFees }),
      });

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
        estimateFeesParams = { configOrCurrencyId: coinConfig, operationType, txIntent };
      } else {
        estimateFeesParams = { currencyId, operationType };
      }

      const estimatedFee = await logicEstimateFees(estimateFeesParams);

      return {
        value: BigInt(estimatedFee.tinybars.toString()),
      };
    },
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance({ config: coinConfig, currencyId, address }), options),
    getBlock: height => {
      return getBlockV2({ configOrCurrencyId: coinConfig, height });
    },
    getBlockInfo: height => getBlockInfo(height),
    lastBlock: () => {
      return lastBlockV2({ configOrCurrencyId: coinConfig });
    },
    listOperations: async (address, { cursor, limit, order, minHeight }) => {
      invariant(minHeight === 0, "minHeight is not supported");

      const evmAddress = await toEVMAddress({
        configOrCurrencyId: coinConfig,
        accountId: address,
      });
      invariant(evmAddress, `hedera: evm address is missing for ${address}`);
      const [mirrorTokens, erc20TokenBalances] = await Promise.all([
        apiClient.getAccountTokens({ configOrCurrencyId: coinConfig, address }),
        getERC20BalancesForAccountV2({ configOrCurrencyId: coinConfig, address }),
      ]);

      const latestAccountOperations = await logicListOperationsV2({
        config: coinConfig,
        currencyId,
        address,
        evmAddress,
        mirrorTokens,
        ...(typeof cursor === "string" && { cursor }),
        ...(typeof limit === "number" && { limit }),
        ...(typeof order === "string" && { order }),
        erc20Tokens: erc20TokenBalances,
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
        const aConsensusTime = a.extra.consensusTimestamp;
        const bConsensusTime = b.extra.consensusTimestamp;
        const aTime = a.date.getTime();
        const bTime = b.date.getTime();
        const dateDiff = order === "desc" ? bTime - aTime : aTime - bTime;

        if (aConsensusTime && bConsensusTime) {
          const aTime = new BigNumber(aConsensusTime);
          const bTime = new BigNumber(bConsensusTime);
          const timeDiff = order === "desc" ? bTime.minus(aTime) : aTime.minus(bTime);

          // REWARD operations have the same consensus time as operation that triggered them
          return timeDiff.isZero() ? dateDiff : timeDiff.toNumber();
        }

        return dateDiff;
      });

      const coinFrameworkOperations = sortedLiveOperations.map(liveOp => {
        const asset = liveOp.contract
          ? {
              type: liveOp.standard ?? "token",
              assetReference: liveOp.contract,
              assetOwner: address,
            }
          : { type: "native" };

        // Prefer inferred payer from operation extra, fallback to transaction_id parsing for legacy ops.
        let feesPayer = liveOp.extra?.feesPayer;
        if (!feesPayer && liveOp.extra?.transactionId)
          feesPayer = extractInitiator(liveOp.extra.transactionId);

        // REWARD operations append a suffix to the tx.hash to ensure uniqueness
        const hash =
          liveOp.type === "REWARD"
            ? liveOp.hash.replace(STAKING_REWARD_HASH_SUFFIX, "")
            : liveOp.hash;

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
            hash,
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

      return {
        items: coinFrameworkOperations,
        next: latestAccountOperations.nextCursor || undefined,
      };
    },
    getValidators: cursor => getValidators({ configOrCurrencyId: coinConfig, cursor }),
    getStakes: async address => getStakes({ configOrCurrencyId: coinConfig, address }),
    getRewards: async (address, cursor) =>
      getRewards({ configOrCurrencyId: coinConfig, address, cursor }),
    validateIntent: async (
      _transactionIntent,
      _balances,
      _customFees,
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: async (_address): Promise<bigint> => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress,
    craftTransactionData,
  };
}
