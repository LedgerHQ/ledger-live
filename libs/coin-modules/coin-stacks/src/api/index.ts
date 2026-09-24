import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  AddressValidationCurrencyParameters,
  Balance,
  BalanceOptions,
  Block,
  BlockInfo,
  CoinModuleImpl,
  CraftedTransaction,
  FeeEstimation,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
  Stake,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import type { StacksContext, StacksCurrencyConfig } from "../config";
import type { StacksTxData } from "../types";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { craftTransactionData } from "../logic/craftTransactionData";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getBlock } from "../logic/getBlock";
import { getBlockInfo } from "../logic/getBlockInfo";
import { getNextSequence } from "../logic/getNextSequence";
import { getStakes } from "../logic/getStakes";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";

// CoinModuleApi (Alpaca) factory for STX + SIP-010 tokens, alongside the existing account bridge
// (bridge path untouched). Every method that reaches the network resolves its config from
// `context.config()` (ADR-019) and passes it down explicitly; the api path never reads the
// getCoinConfig() singleton.
//
// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist. Staking is covered a la carte:
// `getStakes` is real, the other two staking reads are not.
//
// Omitted rather than stubbed, and why:
//   - `getRewards`          — pox-5 exposes only the accrued total, not a series of distribution
//                             events, and `getStakes` already reports it as
//                             `details.amountRewarded` (sBTC-denominated, unlike the STX stake).
//   - `getValidators`       — there is no enumerable validator set: a stake targets a pool signer,
//                             read from the staker's own pox-5 entry rather than from a list.
//   - `craftRawTransaction` — the module accepts no externally-built transaction.
//   - `call`                — no read-only contract-call escape hatch is exposed.
//   - `register`            — no enrollment step.
// The consumer resolver applies `withDefaults`, which answers "not supported" for each of them.
export function createApi() {
  return {
    lastBlock: async (context: StacksContext): Promise<BlockInfo> =>
      lastBlock(await context.config()),
    getBlockInfo: async (context: StacksContext, height: number): Promise<BlockInfo> =>
      getBlockInfo(await context.config(), height),
    getBlock: (_context: StacksContext, height: number): Promise<Block> => getBlock(height),
    getBalance: (
      context: StacksContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> =>
      rejectBalanceOptions(async () => getBalance(await context.config(), address), options),
    listOperations: async (
      context: StacksContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(await context.config(), address, options),
    craftTransaction: async (
      context: StacksContext,
      transactionIntent: TransactionIntent<MemoNotSupported, StacksTxData>,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> =>
      craftTransaction(await context.config(), transactionIntent, options?.customFees),
    estimateFees: async (
      context: StacksContext,
      transactionIntent: TransactionIntent<MemoNotSupported, StacksTxData>,
      options?: { customFeesParameters?: FeeEstimation["parameters"] },
    ): Promise<FeeEstimation> =>
      estimateFees(await context.config(), transactionIntent, options?.customFeesParameters),
    // Stacks is single-signature: the framework requires throwing if more/fewer than one
    // signature is supplied (nested/multi-call intents aren't produced by craftTransaction here).
    combine: (_context: StacksContext, tx: string, signature: string[], _options?): string => {
      if (signature.length !== 1) {
        throw new Error("stacks: combine expects exactly one signature");
      }
      return combine(tx, signature[0]);
    },
    broadcast: async (context: StacksContext, tx: string, _options?): Promise<string> =>
      broadcast(await context.config(), tx),
    validateIntent: (
      _context: StacksContext,
      transactionIntent: TransactionIntent<MemoNotSupported, StacksTxData>,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      validateIntent(transactionIntent, balances, options?.customFees),
    getNextSequence: async (context: StacksContext, address: string): Promise<bigint> =>
      getNextSequence(await context.config(), address),
    validateAddress: (
      _context: StacksContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),
    craftTransactionData: (
      _context: StacksContext,
      intent: TransactionIntent<MemoNotSupported, StacksTxData>,
    ): StacksTxData => craftTransactionData(intent),
    getStakes: async (context: StacksContext, address: string, _options?): Promise<Page<Stake>> =>
      getStakes(await context.config(), address),
  } satisfies CoinModuleImpl<StacksCurrencyConfig, MemoNotSupported, StacksTxData>;
}
