import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  AddressValidationCurrencyParameters,
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
  TransactionValidation,
  Validator,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import type { NearConfig, NearContext } from "../config";
import { isValidAddress } from "../logic";
import { getBalance } from "../logic/getBalance";
import { getBlockInfo } from "../logic/getBlockInfo";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { getStakes } from "../logic/getStakes";
import { getValidators } from "../logic/getValidators";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { validateIntent } from "../logic/validateIntent";

// CoinModuleApi ("Alpaca") entry point for NEAR. Every method takes a NearContext first (ADR-019)
// and threads it to the logic/network layers, which resolve config from `context.config()` — the
// api path never reads the getCoinConfig() singleton. createApi keeps its `config` param and seeds
// it via setCoinConfig only for the classic account bridge, which still resolves config that way.
//
// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist. Staking reads are implemented (real
// pool-contract delegation); tokens are not.
//
// Omitted rather than stubbed, and why:
//   - `getNextSequence`     — no account-level nonce: on NEAR the nonce belongs to an access key,
//                             not to an account.
//   - `getRewards`          — there is no reward distribution event to list; a staking pool
//                             compounds rewards into the staked balance, which `getStakes` reports.
//   - `getBlock`            — reading a block together with all its transactions is not supported.
//   - `craftRawTransaction` — the module accepts no externally-built transaction.
//   - `call`                — no read-only contract-call escape hatch is exposed.
//   - `register`            — no enrollment step.
// The consumer resolver applies `withDefaults`, which answers "not supported" for each of them.
export function createApi() {
  return {
    // --- Blocks / chain state ---
    lastBlock: (context: NearContext): Promise<BlockInfo> => lastBlock(context),
    getBlockInfo: (context: NearContext, height: number): Promise<BlockInfo> =>
      getBlockInfo(context, height),

    // --- Account state ---
    getBalance: (
      context: NearContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => rejectBalanceOptions(() => getBalance(context, address), options),
    listOperations: (
      context: NearContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation>> => listOperations(context, address, options),

    // --- Transaction lifecycle ---
    craftTransaction: (context, transactionIntent, options?): Promise<CraftedTransaction> =>
      craftTransaction(context, transactionIntent, options?.customFees),
    estimateFees: (context, transactionIntent, options?): Promise<FeeEstimation> =>
      estimateFees(context, transactionIntent, options?.customFeesParameters),
    combine: (
      _context: NearContext,
      tx: string,
      signature: string[],
      options?: { pubkey?: string },
    ): string => combine(tx, signature, options?.pubkey),
    broadcast: (
      context: NearContext,
      tx: string,
      options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> => broadcast(context, tx, options?.broadcastConfig),
    validateIntent: (
      context,
      transactionIntent,
      balances,
      options?,
    ): Promise<TransactionValidation> =>
      validateIntent(context, transactionIntent, balances, options?.customFees),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
    validateAddress: async (
      _context: NearContext,
      address: string,
      _parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => isValidAddress(address),

    // --- Staking ---
    getStakes: (
      context: NearContext,
      address: string,
      options?: { cursor?: Cursor },
    ): Promise<Page<Stake>> => getStakes(context, address, options?.cursor),
    getValidators: (
      context: NearContext,
      options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> => getValidators(context, options?.cursor),
  } satisfies CoinModuleImpl<NearConfig>;
}

export default createApi;
