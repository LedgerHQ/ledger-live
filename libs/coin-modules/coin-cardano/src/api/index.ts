import type {
  Balance,
  BalanceOptions,
  BlockInfo,
  BroadcastConfig,
  CoinModuleImpl,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  Stake,
  StringMemo,
  TransactionIntent,
  TransactionValidation,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { type CardanoCoinConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getStakes } from "../logic/getStakes";
import { getValidators } from "../logic/getValidators";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";

type CardanoContext = Context<CardanoCoinConfig>;

// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed:
//   - `call`, `register`      — the module implements neither.
//   - `craftRawTransaction`   — the module takes no externally-built transaction.
//   - `getBlock`, `getBlockInfo` — no per-height block lookup is implemented.
//   - `getRewards`            — no reward-distribution listing is implemented (staking positions
//                               are still reported by `getStakes`).
//   - `getNextSequence`       — Cardano is UTXO-based: no per-account sequence/nonce to advance.
// The consumer resolver applies `withDefaults`, which answers "not supported" for each of them.
export function createApi(currencyId: string) {
  const currency = getCryptoCurrencyById(currencyId);

  return {
    lastBlock: async (context: CardanoContext): Promise<BlockInfo> =>
      lastBlock(await context.config(currencyId)),
    // cursor ignored: Cardano returns every pool in one page (see getValidators).
    getValidators: async (
      context: CardanoContext,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> => getValidators(await context.config(currencyId)),
    getBalance: async (
      context: CardanoContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> =>
      rejectBalanceOptions(
        async () => getBalance(await context.config(currencyId), address),
        options,
      ),
    listOperations: async (
      context: CardanoContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> =>
      listOperations(await context.config(currencyId), currency, address, options),
    getStakes: async (
      context: CardanoContext,
      address: string,
      options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> =>
      getStakes(await context.config(currencyId), address, options?.cursor),
    craftTransaction: async (
      context: CardanoContext,
      transactionIntent: TransactionIntent<StringMemo>,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> =>
      craftTransaction(
        await context.config(currencyId),
        currency,
        transactionIntent,
        options?.customFees,
      ),
    estimateFees: async (
      context: CardanoContext,
      transactionIntent: TransactionIntent<StringMemo>,
      _options?: { feeOption?: unknown },
    ): Promise<FeeEstimation> =>
      estimateFees(await context.config(currencyId), currency, transactionIntent),
    combine: (
      _context: CardanoContext,
      tx: string,
      signature: string[],
      options?: { pubkey?: string },
    ) => combine(tx, signature, options?.pubkey),
    broadcast: async (
      context: CardanoContext,
      tx: string,
      options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> =>
      broadcast(await context.config(currencyId), {
        signature: tx,
        broadcastConfig: options?.broadcastConfig,
      }),
    validateIntent: async (
      context: CardanoContext,
      transactionIntent: TransactionIntent<StringMemo>,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      validateIntent(
        await context.config(currencyId),
        currency,
        transactionIntent,
        balances,
        options?.customFees,
      ),
    validateAddress: (_context: CardanoContext, ...args: Parameters<typeof validateAddress>) =>
      validateAddress(...args),
    craftTransactionData: (
      _context: CardanoContext,
      ...args: Parameters<typeof craftTransactionData>
    ) => craftTransactionData(...args),
  } satisfies CoinModuleImpl<CardanoCoinConfig, StringMemo>;
}
