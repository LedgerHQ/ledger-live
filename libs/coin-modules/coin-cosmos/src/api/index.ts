import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  CoinModuleImpl,
  MemoNotSupported,
  StakingTransactionIntent,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { CosmosCoinConfig, CosmosContext } from "../config";
import { getBalance } from "../logic/account/getBalance";
import { getNextSequence } from "../logic/account/getNextSequence";
import { lastBlock } from "../logic/history/lastBlock";
import { listOperations } from "../logic/history/listOperations";
import { broadcast } from "../logic/transaction/broadcast";
import { combine } from "../logic/transaction/combine";
import { craftTransaction } from "../logic/transaction/craftTransaction";
import { estimateFees } from "../logic/transaction/estimateFees";
import { validateIntent } from "../logic/transaction/validateIntent";
import { getStakes } from "../logic/staking/getStakes";
import { getValidators } from "../logic/staking/getValidators";
import { validateAddress } from "../logic/validateAddress";
import { CosmosAPI } from "../network/Cosmos";

type CosmosCoinModuleImpl = CoinModuleImpl<CosmosCoinConfig, StringMemo | MemoNotSupported>;

/**
 * Resolves the coin configuration from the {@link CosmosContext} and builds the per-chain
 * {@link CosmosAPI}, threading the resolved config down explicitly (ADR-019) rather than seeding
 * the module-level singleton.
 */
async function resolve(
  context: CosmosContext,
  currencyId: string,
): Promise<{ api: CosmosAPI; currencyId: string; config: CosmosCoinConfig }> {
  const config = await context.config(currencyId);
  const api = new CosmosAPI(currencyId, undefined, config);
  return { api, currencyId, config };
}

/**
 * CoinModuleApi ("Alpaca") entry point for Cosmos-SDK chains. The `currencyId` selector is captured
 * here; endpoint and chain parameters resolve per currency via {@link CosmosAPI}, so a single
 * factory serves every Cosmos-family currency (ADR-019).
 *
 * Checked against {@link CosmosCoinModuleImpl} with `satisfies` rather than annotated as it, so the
 * precise shape survives and a caller sees exactly which methods exist.
 *
 * Staking is published à la carte: `getStakes` and `getValidators` are implemented, `getRewards` is
 * not. Omitted rather than stubbed:
 *   - `call`, `register` — the module implements neither.
 *   - `craftRawTransaction` — the module takes no externally-built transaction.
 *   - `getRewards` — no reward-distribution listing is implemented; the accrued amount is reported
 *     by `getStakes` instead.
 *   - `getBlock`, `getBlockInfo` — no per-height block lookup is implemented (`lastBlock` is).
 * The consumer resolver applies `withDefaults`, which answers "not supported" for each of them.
 */
export function createApi(currencyId: string) {
  return {
    getBalance: async (context, address, options?) => {
      const { api } = await resolve(context, currencyId);
      return rejectBalanceOptions(() => getBalance(api, address), options);
    },
    getNextSequence: async (context, address) => {
      const { api } = await resolve(context, currencyId);
      return getNextSequence(api, address);
    },
    lastBlock: async context => {
      const { api } = await resolve(context, currencyId);
      return lastBlock(api);
    },
    validateAddress: async (_context, address, parameters) => {
      return validateAddress(address, { ...parameters, currencyId });
    },
    craftTransactionData: (_context, intent) => craftTransactionData(intent),

    craftTransaction: async (context, intent, options?) => {
      const { api, config } = await resolve(context, currencyId);
      return craftTransaction(
        api,
        currencyId,
        intent as TransactionIntent<StringMemo | MemoNotSupported> | StakingTransactionIntent,
        options?.customFees,
        config,
      );
    },
    estimateFees: async (context, intent, options?) => {
      const { api } = await resolve(context, currencyId);
      return estimateFees(api, intent, options?.customFeesParameters);
    },
    combine: (_context, tx, signature, options?) => combine(tx, signature, options?.pubkey),
    broadcast: async (context, tx, _options?) => {
      const { api } = await resolve(context, currencyId);
      return broadcast(api, tx);
    },

    listOperations: async (context, address, options) => {
      const { api } = await resolve(context, currencyId);
      return listOperations(api, address, options);
    },
    validateIntent: async (context, intent, balances, options?) => {
      const config = await context.config(currencyId);
      return validateIntent(currencyId, intent, balances, options?.customFees, config);
    },

    getStakes: async (context, address, options?) => {
      const { api } = await resolve(context, currencyId);
      return getStakes(api, address, options?.cursor);
    },
    getValidators: async (context, options?) => {
      const { api } = await resolve(context, currencyId);
      return getValidators(api, options?.cursor);
    },
  } satisfies CosmosCoinModuleImpl;
}
