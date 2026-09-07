import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  AccountInfo,
  Balance,
  BlockInfo,
  CoinModuleImpl,
  ListOperationsOptions,
  Operation,
  Page,
  TransactionIntent,
  TransactionValidation,
  BalanceOptions,
  Block,
  AddressValidationCurrencyParameters,
} from "@ledgerhq/coin-module-framework/api/index";
import type { TronContext, TronCoinConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getAccountInfo,
  getBalance,
  getBlock,
  getBlockInfo,
  getStakes,
  getValidators,
  lastBlock,
  listOperations as listOperationsLogic,
  validateAddress,
  validateIntent,
} from "../logic";
import { defaultFetchParams, getBlock as getBlockNetwork } from "../network";
import type { TronMemo, TronTxData } from "../types";

const MAX_TRONGRID_LIMIT = 200;

// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed, and why:
//   - `call`                — Tron contract reads (triggerconstantcontract) are not supported yet.
//   - `getRewards`          — withdrawals already appear in `listOperations`.
//   - `craftRawTransaction` — the chain takes no externally-built transaction.
//   - `register`            — no enrollment step.
// The consumer resolver applies `withDefaults`, which answers "not supported" for each of them.
export function createApi() {
  return {
    broadcast: async (context, tx, _options?) => {
      const config = await context.config();
      return broadcast(config, tx);
    },
    combine: (_context, tx, signature, _options?) => combine(tx, signature),
    craftTransaction: async (context, transactionIntent, options?) => {
      const config = await context.config();
      return craftTransaction(config, transactionIntent, options?.customFees);
    },
    estimateFees: async (context, transactionIntent, _options?) => {
      const config = await context.config();
      return estimateFees(config, transactionIntent);
    },
    getAccountInfo: async (context, address): Promise<AccountInfo> => {
      const config = await context.config();
      return getAccountInfo(config, address);
    },
    getBalance: async (context, address: string, options?: BalanceOptions): Promise<Balance[]> => {
      const config = await context.config();
      return rejectBalanceOptions(() => getBalance(config, address), options);
    },
    lastBlock: async (context): Promise<BlockInfo> => {
      const config = await context.config();
      return lastBlock(config);
    },
    listOperations,
    getBlock: async (context, height): Promise<Block> => {
      const config = await context.config();
      return getBlock(config, height);
    },
    getBlockInfo: async (context, height): Promise<BlockInfo> => {
      const config = await context.config();
      return getBlockInfo(config, height);
    },
    getStakes: async (context, address, options?) => {
      const config = await context.config();
      return getStakes(config, address, options?.cursor);
    },
    // Unsupported chain-wide, as it is for cosmos, cardano and tezos: `Reward` describes a distribution
    // event with a `receivedAt` date, and Trongrid exposes only the *pending* accrued total
    // (`tronResources.unwithdrawnReward`), which `getStakes` reports as `amountRewarded` instead.
    getValidators: async (context, options?) => {
      const config = await context.config();
      return getValidators(config, options?.cursor);
    },
    validateIntent: async (
      context,
      transactionIntent,
      balances,
      options,
    ): Promise<TransactionValidation> => {
      const config = await context.config();
      return validateIntent(config, transactionIntent, balances, options?.customFees);
    },
    // Tron uses (timestamp + ref_block_hash) for replay protection rather than
    // a per-account nonce, so getNextSequence has no meaningful value here.
    getNextSequence: async (_context: TronContext, _address: string) => 0n,
    validateAddress: async (
      _context: TronContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  } satisfies CoinModuleImpl<TronCoinConfig, TronMemo, TronTxData>;
}

/**
 * Per ADR-047 the Tron-specific transaction fields live in {@link TronTxData} on the intent, so by
 * the time an intent reaches this API the payload is already built — by
 * `BridgeApi.buildIntentData`, which is the only layer that knows the wallet's Tron transaction
 * shape. This member exists to satisfy `CoinModuleApi` and to keep a caller that builds an intent
 * by hand (the coin-tester, a script) from losing data it already supplied.
 */
function craftTransactionData(intent: TransactionIntent<TronMemo, TronTxData>): TronTxData {
  return intent.data ?? { type: "tron" };
}

async function listOperations(
  context: TronContext,
  address: string,
  { minHeight, order, cursor, limit }: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (limit !== undefined && limit > MAX_TRONGRID_LIMIT) {
    throw new Error(`limit must be <= ${MAX_TRONGRID_LIMIT} for Tron (TronGrid API restriction)`);
  }
  const config = await context.config();
  const effectiveLimit = limit ?? MAX_TRONGRID_LIMIT;
  const effectiveOrder = order ?? "asc";

  let minTimestamp = defaultFetchParams.minTimestamp;
  if (minHeight > 0) {
    // getBlock rejects when minHeight points just past the chain tip (block not yet
    // produced); fall back to the default bound instead of failing the whole listing.
    const block = await getBlockNetwork(config, minHeight).catch(() => null);
    minTimestamp = block?.time?.getTime() ?? defaultFetchParams.minTimestamp;
  }

  return listOperationsLogic(config, address, {
    limit: effectiveLimit,
    minTimestamp,
    order: effectiveOrder,
    cursor,
  });
}
