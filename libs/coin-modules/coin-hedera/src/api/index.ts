import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  CoinModuleApi,
  BalanceOptions,
  CraftedTransaction,
  ListOperationsOptions,
  Operation,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { validateAddress } from "../bridge/validateAddress";
import { type HederaCoinConfig, type HederaContext } from "../config";
import {
  HARDCODED_BLOCK_HEIGHT,
  HEDERA_OPERATION_TYPES,
  STAKING_REWARD_HASH_SUFFIX,
} from "../constants";
import {
  combine,
  craftTransaction,
  getAccountInfo,
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
  validateIntent,
} from "../logic";
import {
  extractInitiator,
  getBlockHash,
  getDateRangeFromBlockHeight,
  getOperationValue,
  mapIntentToSDKOperation,
} from "../logic/utils";
import { apiClient } from "../network/api";
import { getERC20BalancesForAccountV2, toEVMAddress } from "../network/utils";
import type { EstimateFeesParams, HederaMemo, HederaTxData } from "../types";

// The `currencyId` selector is captured here; the caller builds the {@link HederaContext} (config +
// logger) and passes it to each method. Each method resolves the coin configuration from the context
// via `context.config()` and threads it explicitly into the logic layer rather than seeding the
// module-level singleton (ADR-019).
export function createApi(
  currencyId: string,
): CoinModuleApi<HederaCoinConfig, HederaMemo, HederaTxData> & BridgeApi {
  return {
    broadcast: async (context: HederaContext, tx) => {
      const coinConfig = await context.config();
      const response = await logicBroadcast({
        configOrCurrencyId: coinConfig,
        txWithSignature: tx,
      });

      return Buffer.from(response.transactionHash).toString("base64");
    },
    async call() {
      throw new Error("call is not supported");
    },
    async register() {
      throw new Error("register is not supported");
    },
    combine: (_context, tx, signature, options) => combine(tx, signature, options?.pubkey),
    // `useAllAmount` needs no branch here: `genericPrepareTransaction` (ledger-live-common) already
    // resolves it to a concrete `txIntent.amount` — the account's spendable balance minus the same
    // safety-multiplied fee estimate (`estimateFees.ts`'s `ESTIMATED_FEE_SAFETY_RATE`) this function
    // reserves via `customFees` — before this ever runs. Crafting reads `txIntent.amount` either way.
    craftTransaction: async (context: HederaContext, txIntent, options) => {
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
    craftRawTransaction: (
      _context: HederaContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: async (context: HederaContext, txIntent) => {
      let estimateFeesParams: EstimateFeesParams;
      const operationType = mapIntentToSDKOperation(txIntent);

      if (operationType === HEDERA_OPERATION_TYPES.ContractCall) {
        const coinConfig = await context.config();
        estimateFeesParams = { configOrCurrencyId: coinConfig, operationType, txIntent };
      } else {
        estimateFeesParams = { currencyId, operationType };
      }

      const estimatedFee = await logicEstimateFees(estimateFeesParams);

      // `estimatedFee.gas` (ERC20/ContractCall only) has no field of its own on `FeeEstimation` —
      // `parameters` is how the generic bridge's `genericPrepareTransaction` carries a coin module's
      // fee telemetry back onto `GenericTransaction.gasLimit` (`prepareTransaction.ts`'s
      // `propagateField`), which `families/hedera/bridge/api.ts`'s `buildIntentData` then reads to
      // give `craftTransaction`'s erc20 branch the real gas limit instead of `DEFAULT_GAS_LIMIT`.
      return {
        value: BigInt(estimatedFee.tinybars.toString()),
        ...(estimatedFee.gas && {
          parameters: { gasLimit: BigInt(estimatedFee.gas.toString()) },
        }),
      };
    },
    getAccountInfo: async (context: HederaContext, address: string) => {
      const coinConfig = await context.config();
      return getAccountInfo(coinConfig, address);
    },
    // Deliberately still rejecting, not an oversight: `BalanceOptions.includeAssets` would need
    // `getBalance` to filter its own token fetch, and nothing supplies it today —
    // `families/hedera/bridge/api.ts`'s `BridgeApi.balanceOptions` (the field the framework reads to
    // pass options here) is left unset. Revisit only once something actually sets it.
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

      // The framework's real mechanism for "what's new since last sync" is `minHeight` (its own
      // contract: "must honor minHeight or throw a 'not supported' error" — silently ignoring it, as
      // this used to, is non-compliant). It maps onto Hedera's synthetic block scheme
      // (`useSyntheticBlocks: true` below) via `getDateRangeFromBlockHeight`, the inverse of
      // `getSyntheticBlock`, giving the start of the 10-second (`SYNTHETIC_BLOCK_WINDOW_SECONDS`)
      // window right after the last known operation's block.
      //
      // `cursor` — `oldOps[0]`'s own pagingToken, the *exact* nanosecond-precision consensus
      // timestamp of that same last known operation — is strictly earlier than that window start, so
      // using it instead loses nothing `minHeight` would have caught (it's a superset, at worst
      // re-fetching the already-known operation itself, deduped by `mergeOps`). Prefer it when
      // available; fall back to `minHeight`'s coarser floor only when it isn't, so the contract is
      // never silently dropped.
      const minTimestamp =
        typeof cursor === "string"
          ? cursor
          : minHeight > 0
            ? (getDateRangeFromBlockHeight(minHeight).start.getTime() / 1000).toString()
            : undefined;
      const latestAccountOperations = await logicListOperationsV2(coinConfig, {
        currencyId,
        address,
        evmAddress,
        mirrorTokens,
        ...(typeof limit === "number" && { limit }),
        ...(typeof order === "string" && { order }),
        ...(minTimestamp && { minTimestamp }),
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

        // `pagingToken` never reaches the legacy bridge's own `Operation.extra` (that path builds its
        // cursor from the operation's `date`, not this field — confirmed by grep, `synchronisation.ts`
        // never reads `extra.pagingToken`), so nesting it here doesn't touch legacy behaviour. It has
        // to be nested, not left flat: `generic-coin-framework/utils.ts`'s
        // `adaptCoreOperationToLiveOperation` only promotes a curated allowlist of flat `details` keys
        // plus a nested `familyExtra` bag (`readFamilyExtra`) onto `Operation.extra` — a flat
        // `pagingToken` was neither, so `getAccountShape.ts`'s cursor read was always `undefined` and
        // every sync re-fetched page one (GAP G, LIVE-36148).
        //
        // `consensusTimestamp`/`transactionId` hit the exact same allowlist gap: `getTransactionExplorer`
        // (`logic/utils.ts`) reads them to build the hashscan.io link, and the generic path was
        // silently dropping both, so every operation's "view in explorer" fell back to `$hash` → "0".
        // `getTransactionExplorer` checks this nested spot before the flat legacy one.
        const { pagingToken, consensusTimestamp, transactionId, ...restExtra } = liveOp.extra;

        return {
          id: liveOp.id,
          type: liveOp.type,
          senders: liveOp.senders,
          recipients: liveOp.recipients,
          value: getOperationValue({ asset, operation: liveOp }),
          asset,
          details: {
            ...restExtra,
            ledgerOpType: liveOp.type,
            ...(asset.type !== "native" && { assetAmount: liveOp.value.toFixed(0) }),
            ...(liveOp.extra.stakedAmount && {
              stakedAmount: BigInt(liveOp.extra.stakedAmount.toFixed(0)),
            }),
            ...((pagingToken || consensusTimestamp || transactionId) && {
              familyExtra: { pagingToken, consensusTimestamp, transactionId },
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
    getValidators: async (context: HederaContext, options) => {
      const coinConfig = await context.config();
      return getValidators({ configOrCurrencyId: coinConfig, cursor: options?.cursor });
    },
    getStakes: async (context: HederaContext, address) => {
      const coinConfig = await context.config();
      return getStakes({ configOrCurrencyId: coinConfig, address });
    },
    getRewards: async (context: HederaContext, address, options) => {
      const coinConfig = await context.config();
      return getRewards({ configOrCurrencyId: coinConfig, address, cursor: options?.cursor });
    },
    validateIntent: async (
      context: HederaContext,
      transactionIntent,
      balances,
      options,
    ): Promise<TransactionValidation> => {
      const coinConfig = await context.config();
      return validateIntent(
        currencyId,
        coinConfig,
        transactionIntent,
        balances,
        options?.customFees,
      );
    },
    getNextSequence: async (_context: HederaContext, _address): Promise<bigint> => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress: (_context, address, parameters) => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  };
}
