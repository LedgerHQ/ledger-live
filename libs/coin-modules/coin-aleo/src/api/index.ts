import invariant from "invariant";
import type {
  AccountInfo,
  CoinModuleImpl,
  Balance,
  BlockInfo,
  CraftedTransaction,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
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
import {
  buildFeeConfigurationForRootIntent,
  getTransactionType,
  resolvePrivacyContext,
} from "../logic/utils";
import type {
  AleoContext,
  AleoCoinConfig,
  AleoRegistration,
  AleoTransactionIntentData,
} from "../types";
import { listOperations } from "../logic/listOperations";

type AleoCoinModuleImpl = CoinModuleImpl<
  AleoCoinConfig,
  MemoNotSupported,
  AleoTransactionIntentData
>;

function requireViewKey(context: AleoContext, action: string): string {
  const { viewKey } = context;
  if (typeof viewKey !== "string" || viewKey.length === 0) {
    throw new Error(`aleo: a view key is required to ${action}`);
  }
  return viewKey;
}

// currencyId is captured here (it can't live on the Context). The logic functions are shared with
// the classic bridge (config-based), so each method resolves the config itself and passes it down —
// no context-first wrappers.
//
// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed: `call`, `craftRawTransaction`, `getBlock`, `getBlockInfo`,
// `getStakes`, `getRewards`, `getValidators`, `validateIntent` and `getNextSequence`. The consumer
// resolver applies `withDefaults`, which answers "not supported" for each.
//
// `getAccountInfo`, `register` and `validateAddress` stay: they are real implementations —
// enrollment into the Provable record scanner and the scan status it reports are central to Aleo's
// private balance and history, so listing them here is what tells a caller they are not placeholders.
export function createApi(currencyId: string) {
  return {
    broadcast: async (
      context: AleoContext,
      signedTransaction: string,
      _options?,
    ): Promise<string> => {
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
      _options?,
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
    estimateFees: async (context: AleoContext, intent, _options?): Promise<FeeEstimation> => {
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
    listOperations: async (context: AleoContext, address, options) => {
      if (options.order && options.order !== "desc") {
        throw new Error(`aleo: listOperations does not support order "${options.order}"`);
      }

      const { provableId, viewKey } = resolvePrivacyContext(context);

      const config = await context.config(currencyId);

      return listOperations({ config, address, options, provableId, viewKey });
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
  } satisfies AleoCoinModuleImpl;
}
