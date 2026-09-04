import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  CoinModuleImpl,
  BalanceOptions,
  ListOperationsOptions,
  Operation,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { validateAddress } from "../bridge/validateAddress";
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
import type {
  EstimateFeesParams,
  HederaMemo,
  HederaTxData,
  HederaCoinConfig,
  HederaContext,
} from "../types";

// The `currencyId` selector is captured here; the caller builds the {@link HederaContext} (config +
// logger) and passes it to each method. Each method resolves the coin configuration from the context
// via `context.config()` and threads it explicitly into the logic layer rather than seeding the
// module-level singleton (ADR-019).
//
// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist. Staking is fully covered here — Hedera
// proxy-stakes to a node, so `getStakes`, `getRewards` and `getValidators` are all real.
//
// Omitted rather than stubbed, and why:
//   - `validateIntent`      — intent validation still lives in the account bridge's
//                             `getTransactionStatus`; the api path has none of its own yet.
//   - `getNextSequence`     — no per-account nonce: a Hedera transaction is identified by its
//                             payer plus a valid-start timestamp (`createTransactionId`).
//   - `craftRawTransaction` — the module accepts no externally-built transaction.
//   - `call`                — no read-only contract-call escape hatch is exposed, even though the
//                             device app parses contract calls.
//   - `register`            — no enrollment step.
// The consumer resolver applies `withDefaults`, which answers "not supported" for each of them.
export function createApi(currencyId: string) {
  return {
    broadcast: async (context: HederaContext, tx, _options?) => {
      const coinConfig = await context.config();
      const response = await logicBroadcast({
        configOrCurrencyId: coinConfig,
        txWithSignature: tx,
      });

      return Buffer.from(response.transactionHash).toString("base64");
    },
    combine: (_context, tx, signature, options?) => combine(tx, signature, options?.pubkey),
    craftTransaction: async (context: HederaContext, txIntent, options?) => {
      invariant(!txIntent.useAllAmount, "useAllAmount is not supported");
      const coinConfig = await context.config();
      const { serializedTx } = await craftTransaction({
        configOrCurrencyId: coinConfig,
        txIntent,
        ...(options?.customFees && { customFees: options.customFees }),
      });

      return {
        transaction: serializedTx,
      };
    },
    estimateFees: async (context: HederaContext, txIntent, _options?) => {
      let estimateFeesParams: EstimateFeesParams;
      const operationType = mapIntentToSDKOperation(txIntent);

      if (operationType === HEDERA_OPERATION_TYPES.ContractCall) {
        const coinConfig = await context.config();
        estimateFeesParams = { configOrCurrencyId: coinConfig, operationType, txIntent };
      } else {
        estimateFeesParams = { currencyId, operationType };
      }

      const estimatedFee = await logicEstimateFees(estimateFeesParams);

      return {
        value: BigInt(estimatedFee.tinybars.toString()),
      };
    },
    getBalance: (context: HederaContext, address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(async () => {
        const coinConfig = await context.config();
        return getBalance(coinConfig, { address });
      }, options),
    getBlock: async (context: HederaContext, height) => {
      const coinConfig = await context.config();
      return getBlockV2({ configOrCurrencyId: coinConfig, height });
    },
    getBlockInfo: (_context: HederaContext, height) => getBlockInfo(height),
    lastBlock: async (context: HederaContext) => {
      const coinConfig = await context.config();
      return lastBlockV2({ configOrCurrencyId: coinConfig });
    },
    listOperations: async (
      context: HederaContext,
      address: string,
      { cursor, limit, order, minHeight }: ListOperationsOptions,
    ) => {
      invariant(minHeight === 0, "minHeight is not supported");

      const coinConfig = await context.config();
      const evmAddress = await toEVMAddress({
        configOrCurrencyId: coinConfig,
        accountId: address,
      });
      invariant(evmAddress, `hedera: evm address is missing for ${address}`);
      const [mirrorTokens, erc20TokenBalances] = await Promise.all([
        apiClient.getAccountTokens({ configOrCurrencyId: coinConfig, address }),
        getERC20BalancesForAccountV2({ configOrCurrencyId: coinConfig, address }),
      ]);

      const latestAccountOperations = await logicListOperationsV2(coinConfig, {
        currencyId,
        address,
        evmAddress,
        mirrorTokens,
        ...(typeof cursor === "string" && { cursor }),
        ...(typeof limit === "number" && { limit }),
        ...(typeof order === "string" && { order }),
        tokenEvmAddresses: erc20TokenBalances.map(t => t.contractAddress.toLowerCase()),
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
    getValidators: async (context: HederaContext, options?) => {
      const coinConfig = await context.config();
      return getValidators({ configOrCurrencyId: coinConfig, cursor: options?.cursor });
    },
    getStakes: async (context: HederaContext, address, _options?) => {
      const coinConfig = await context.config();
      return getStakes({ configOrCurrencyId: coinConfig, address });
    },
    getRewards: async (context: HederaContext, address, options?) => {
      const coinConfig = await context.config();
      return getRewards({ configOrCurrencyId: coinConfig, address, cursor: options?.cursor });
    },
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  } satisfies CoinModuleImpl<HederaCoinConfig, HederaMemo, HederaTxData>;
}
