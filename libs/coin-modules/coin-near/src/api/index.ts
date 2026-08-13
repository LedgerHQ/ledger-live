import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  AddressValidationCurrencyParameters,
  Balance,
  BalanceOptions,
  Block,
  BlockInfo,
  BroadcastConfig,
  CoinModuleApi,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  Reward,
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
// Staking reads are implemented (real pool-contract delegation);
// getRewards/getBlock/getNextSequence/call/craftRawTransaction and tokens are not — see the inline
// throws below for why.
export function createApi(): CoinModuleApi<NearConfig> {
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
    craftTransaction: (context, transactionIntent, options): Promise<CraftedTransaction> =>
      craftTransaction(context, transactionIntent, options?.customFees),
    estimateFees: (context, transactionIntent, options): Promise<FeeEstimation> =>
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
      options,
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

    // --- Not supported ---
    getBlock: (_context: NearContext, _height: number): Promise<Block> => {
      throw new Error("getBlock is not supported");
    },
    getNextSequence: (_context: NearContext, _address: string): Promise<bigint> => {
      throw new Error(
        "getNextSequence is not applicable for Near: the nonce belongs to an access key, not to an account",
      );
    },
    getRewards: (
      _context: NearContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
    craftRawTransaction: (
      _context: NearContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    call: async (_context: NearContext) => {
      throw new Error("call is not supported");
    },
  };
}

export default createApi;
