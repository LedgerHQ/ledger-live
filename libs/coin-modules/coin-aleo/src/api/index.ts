import invariant from "invariant";
import type {
  AccountInfo,
  CoinModuleApi,
  Balance,
  Block,
  BlockInfo,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  MemoNotSupported,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  TransactionValidation,
  Validator,
  BalanceOptions,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { FEE_INTENT_TYPES } from "../constants";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getAccountInfo,
  getBalance,
  lastBlock,
  register,
  validateAddress,
} from "../logic";
import { buildFeeConfigurationForRootIntent, getTransactionType } from "../logic/utils";
import type {
  AleoContext,
  AleoCoinConfig,
  AleoRegistration,
  AleoTransactionIntentData,
} from "../types";

type AleoCoinModuleApi = CoinModuleApi<AleoCoinConfig, MemoNotSupported, AleoTransactionIntentData>;

function requireViewKey(context: AleoContext, action: string): string {
  const { viewKey } = context;
  if (typeof viewKey !== "string" || viewKey.length === 0) {
    throw new Error(`aleo: a view key is required to ${action}`);
  }
  return viewKey;
}

// currencyId is captured here (it can't live on the Context). The logic functions are shared with
// the classic bridge (config-based), so each method resolves config via context.config() and passes
// it down — no context-first wrappers.
export function createApi(_currencyId: string): AleoCoinModuleApi {
  return {
    async call() {
      throw new Error("call is not supported");
    },
    broadcast: async (context: AleoContext, signedTransaction: string): Promise<string> => {
      const config = await context.config();
      return broadcast({
        configOrCurrencyId: config,
        signedTx: signedTransaction,
      });
    },
    combine: async (
      context: AleoContext,
      transaction: string,
      signatures: string[],
    ): Promise<string> => {
      const config = await context.config();
      const viewKey = requireViewKey(context, "combine a transaction");
      return combine({ config, transaction, signatures, viewKey });
    },
    craftTransaction: async (
      context: AleoContext,
      txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> => {
      invariant(!txIntent.useAllAmount, "aleo: useAllAmount is not supported");

      const config = await context.config();
      const isFeeIntent = FEE_INTENT_TYPES.has(txIntent.type);
      const isPrivateIntent = "data" in txIntent && "records" in txIntent.data;
      const isPrivateFeeIntent = txIntent.type === "fee_private";

      if (isFeeIntent) {
        invariant(!config.isFeeSponsored, "aleo: fee craft is not needed when fees are sponsored");
        invariant(!options?.customFees, "aleo: customFees is not supported for fee intents");

        if (isPrivateFeeIntent) {
          requireViewKey(context, "craft a private fee transaction");
        }

        // txIntent.amount -> base fee
        // txIntent.data.priorityFee -> priority fee (defaults to 0)
        // both should match max_base_fee/max_priority_fee from the FeeConfiguration of the root intent
        return craftTransaction({
          config,
          txIntent,
          feeConfiguration: null,
          ...(context.viewKey && { viewKey: context.viewKey }),
        });
      }

      if (isPrivateIntent) {
        requireViewKey(context, "craft a private transaction");
      }

      const maxBaseFee = options?.customFees
        ? options.customFees.value
        : estimateFees({
            configOrCurrencyId: config,
            transactionType: getTransactionType(txIntent),
          }).value;

      const maxPriorityFee =
        ("data" in txIntent && "priorityFee" in txIntent.data
          ? txIntent.data.priorityFee
          : undefined) ?? 0n;

      const feeConfiguration = buildFeeConfigurationForRootIntent({
        isPrivate: isPrivateIntent,
        maxBaseFee,
        maxPriorityFee,
      });

      return craftTransaction({
        config,
        txIntent,
        feeConfiguration,
        ...(context.viewKey && { viewKey: context.viewKey }),
      });
    },
    craftRawTransaction: (
      _context: AleoContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: async (context: AleoContext, intent): Promise<FeeEstimation> => {
      const config = await context.config();
      return estimateFees({
        configOrCurrencyId: config,
        transactionType: getTransactionType(intent),
      });
    },
    getAccountInfo: async (context: AleoContext, _address: string): Promise<AccountInfo> => {
      const provableId = context.provableId;
      if (typeof provableId !== "string" || provableId.length === 0) {
        return { type: "none" };
      }
      const config = await context.config();
      return getAccountInfo(config, provableId);
    },
    getBalance: async (
      context: AleoContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => {
      return rejectBalanceOptions(() => getBalance(context, address), options);
    },
    lastBlock: async (context: AleoContext): Promise<BlockInfo> => {
      const config = await context.config();
      return lastBlock(config);
    },
    listOperations: (_context, _address, _options) => {
      throw new Error("listOperations is not supported");
    },
    getBlock(_context, _height): Promise<Block> {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo(_context, _height: number): Promise<BlockInfo> {
      throw new Error("getBlockInfo is not supported");
    },
    getStakes(_context, _address: string, _options?: { cursor?: Cursor }): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_context, _address: string, _options?: { cursor?: Cursor }): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators(_context, _options?: { cursor?: Cursor }): Promise<Page<Validator>> {
      throw new Error("getValidators is not supported");
    },
    validateIntent: (
      _context: AleoContext,
      _transactionIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>,
      _balances: Balance[],
      _options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> => {
      throw new Error("validateIntent is not supported");
    },
    getNextSequence: (_context: AleoContext, _address: string) => {
      throw new Error("getNextSequence is not supported");
    },
    validateAddress: (_context: AleoContext, address, parameters) =>
      validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
    // `address` is unused: enrollment is keyed by the view key, not the address.
    register: async (context: AleoContext, _address: string): Promise<AleoRegistration> => {
      const viewKey = requireViewKey(context, "register with the Provable scanner");
      const config = await context.config();
      return register(config, viewKey);
    },
  };
}
