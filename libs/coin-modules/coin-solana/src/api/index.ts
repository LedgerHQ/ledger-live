import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  AddressValidationCurrencyParameters,
  CoinModuleImpl,
  Balance,
  BalanceOptions,
  BroadcastConfig,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  MemoNotSupported,
  StakingTransactionIntent,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { SolanaCoinConfig, SolanaContext } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftRawTransaction } from "../logic/craftRawTransaction";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getNextSequence } from "../logic/getNextSequence";
import { getStakes } from "../logic/getStakes";
import { getValidators } from "../logic/getValidators";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";
import { ChainAPI, getChainAPI } from "../network";
import { endpointByCurrencyId } from "../utils";

type SolanaCoinModuleImpl = CoinModuleImpl<SolanaCoinConfig, StringMemo | MemoNotSupported>;

/**
 * Resolves the coin configuration from the {@link SolanaContext} and builds the {@link ChainAPI}
 * for the context's currency, threading the resolved config into {@link endpointByCurrencyId}
 * rather than seeding the module-level singleton (ADR-019).
 */
async function chainAPIFromContext(
  context: SolanaContext,
  currencyId: string,
): Promise<{
  api: ChainAPI;
  config: SolanaCoinConfig;
}> {
  const config = await context.config();
  const api = getChainAPI({ endpoint: endpointByCurrencyId(config, currencyId) });
  return { api, config };
}

// The `currencyId` selector is captured here; the caller builds the {@link SolanaContext} (config + logger) and passes it to each method (ADR-019).
// Checked against the authoring type with `satisfies` rather than annotated as it, so the precise
// shape survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed: `call`, `register`, `getBlock`, `getBlockInfo` and `getRewards`. The
// consumer resolver applies `withDefaults`, which answers "not supported" for each.
export function createApi(currencyId: string) {
  return {
    broadcast: async (
      context: SolanaContext,
      tx: string,
      _options?: { broadcastConfig?: BroadcastConfig },
    ) => {
      const { api } = await chainAPIFromContext(context, currencyId);
      return broadcast(api, tx);
    },
    combine: (
      _context: SolanaContext,
      tx: string,
      signature: string[],
      _options?: { pubkey?: string },
    ) => {
      return combine(tx, signature);
    },
    craftTransaction: async (
      context: SolanaContext,
      intent: TransactionIntent<StringMemo | MemoNotSupported> | StakingTransactionIntent,
      options?: { customFees?: FeeEstimation },
    ) => {
      const { api } = await chainAPIFromContext(context, currencyId);
      return craftTransaction(api, intent, options?.customFees);
    },
    craftRawTransaction: async (
      _context: SolanaContext,
      tx: string,
      sender: string,
      _publicKey: string,
      _sequence: bigint,
    ) => {
      return craftRawTransaction(tx, sender);
    },
    estimateFees: async (
      context: SolanaContext,
      intent: TransactionIntent<StringMemo | MemoNotSupported>,
      options?: { customFeesParameters?: FeeEstimation["parameters"] },
    ) => {
      const { api } = await chainAPIFromContext(context, currencyId);
      return estimateFees(api, intent, options?.customFeesParameters);
    },
    getBalance: async (context: SolanaContext, address: string, options?: BalanceOptions) => {
      const { api, config } = await chainAPIFromContext(context, currencyId);
      return rejectBalanceOptions(
        () =>
          getBalance(api, address, {
            token2022Enabled: config.token2022Enabled,
          }),
        options,
      );
    },
    lastBlock: async (context: SolanaContext) => {
      const { api } = await chainAPIFromContext(context, currencyId);
      return lastBlock(api);
    },
    listOperations: async (
      context: SolanaContext,
      address: string,
      options: ListOperationsOptions,
    ) => {
      const { api } = await chainAPIFromContext(context, currencyId);
      return listOperations(api, address, options);
    },
    getValidators: async (context: SolanaContext, _options?) => {
      const { config } = await chainAPIFromContext(context, currencyId);
      return getValidators(config.validatorsUrl);
    },
    getStakes: async (context: SolanaContext, address: string, options?: { cursor?: Cursor }) => {
      const { api } = await chainAPIFromContext(context, currencyId);
      return getStakes(api, address, options?.cursor);
    },
    validateIntent: async (
      context: SolanaContext,
      intent: TransactionIntent<StringMemo | MemoNotSupported>,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ) => {
      const { api } = await chainAPIFromContext(context, currencyId);
      return validateIntent(api, intent, balances, options?.customFees);
    },
    getNextSequence: async (_context: SolanaContext, address: string) => {
      return getNextSequence(address);
    },
    validateAddress: (
      _context: SolanaContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ) => {
      return validateAddress(address, parameters);
    },
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  } satisfies SolanaCoinModuleImpl;
}
