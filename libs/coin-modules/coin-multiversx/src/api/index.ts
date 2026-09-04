import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  AddressValidationCurrencyParameters,
  Balance,
  BalanceOptions,
  BroadcastConfig,
  CoinModuleImpl,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  Stake,
  StakingTransactionIntent,
  TransactionIntent,
  TransactionValidation,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { type MultiversXCoinConfig, type MultiversXContext } from "../config";
import { createNetworkApi } from "../network/api";
import { broadcast } from "../logic/transaction/broadcast";
import { combine } from "../logic/transaction/combine";
import { craftTransaction } from "../logic/transaction/craftTransaction";
import { estimateFees } from "../logic/transaction/estimateFees";
import { getBalance } from "../logic/account/getBalance";
import { getNextSequence } from "../logic/account/getNextSequence";
import { getStakes } from "../logic/staking/getStakes";
import { getValidators } from "../logic/staking/getValidators";
import { lastBlock } from "../logic/history/lastBlock";
import { listOperations } from "../logic/history/listOperations";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";

export function createApi() {
  // The network client depends on endpoints that live in the coin config, so it is resolved per
  // call from the context (ADR-019) rather than seeded once through a module singleton.
  const resolveApi = async (context: MultiversXContext) => {
    const config = await context.config();
    return createNetworkApi(config.apiEndpoint, config.delegationApiEndpoint);
  };

  return {
    broadcast: async (
      context: MultiversXContext,
      tx: string,
      _options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> => {
      const api = await resolveApi(context);
      return broadcast(api, tx);
    },
    combine: (
      _context: MultiversXContext,
      tx: string,
      signature: string[],
      options?: { pubkey?: string },
    ): string => {
      return combine(tx, signature, options?.pubkey);
    },
    craftTransaction: async (
      context: MultiversXContext,
      intent: TransactionIntent | StakingTransactionIntent,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> => {
      const api = await resolveApi(context);
      return craftTransaction(api, intent, options?.customFees);
    },
    estimateFees: (
      _context: MultiversXContext,
      intent: TransactionIntent,
      options?: { customFeesParameters?: FeeEstimation["parameters"] },
    ): Promise<FeeEstimation> => {
      return estimateFees(intent, options?.customFeesParameters);
    },
    getBalance: async (
      context: MultiversXContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => {
      const api = await resolveApi(context);
      return rejectBalanceOptions(() => getBalance(api, address), options);
    },
    lastBlock: async (context: MultiversXContext) => {
      return lastBlock(await resolveApi(context));
    },
    listOperations: async (
      context: MultiversXContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => {
      const api = await resolveApi(context);
      return listOperations(api, address, options);
    },
    getValidators: async (
      context: MultiversXContext,
      options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> => {
      const api = await resolveApi(context);
      return getValidators(api, options?.cursor);
    },
    getStakes: async (
      context: MultiversXContext,
      address: string,
      options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> => {
      const api = await resolveApi(context);
      return getStakes(api, address, options?.cursor);
    },
    validateIntent: (
      _context: MultiversXContext,
      intent: TransactionIntent | StakingTransactionIntent,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> => {
      return validateIntent(intent, balances, options?.customFees);
    },
    getNextSequence: async (context: MultiversXContext, address: string): Promise<bigint> => {
      const api = await resolveApi(context);
      return getNextSequence(api, address);
    },
    validateAddress: (
      _context: MultiversXContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => {
      return validateAddress(address, parameters);
    },
    craftTransactionData: (_context: MultiversXContext, intent: TransactionIntent) =>
      craftTransactionData(intent),
  } satisfies CoinModuleImpl<MultiversXCoinConfig>;
}
