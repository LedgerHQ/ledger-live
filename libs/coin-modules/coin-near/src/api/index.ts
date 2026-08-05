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
import { setCoinConfig, type NearCoinConfig } from "../config";
import { isValidAddress } from "../logic";
import { getBalance } from "../logic/getBalance";
import { getBlockInfo } from "../logic/getBlockInfo";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { getStakes } from "../logic/getStakes";
import { getValidators } from "../logic/getValidators";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftTransaction, type NearIntent } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { validateIntent } from "../logic/validateIntent";

// CoinModuleApi ("Alpaca") entry point for NEAR. Staking reads are implemented (real pool-contract
// delegation); getRewards/getBlock/getNextSequence/call/craftRawTransaction and tokens are not — see the inline throws below for why.
export function createApi(config: NearCoinConfig, _currencyId: string): CoinModuleApi {
  setCoinConfig(config);

  return {
    // --- Blocks / chain state ---
    lastBlock: (): Promise<BlockInfo> => lastBlock(),
    getBlockInfo: (height: number): Promise<BlockInfo> => getBlockInfo(height),

    // --- Account state ---
    getBalance: (address: string, options?: BalanceOptions): Promise<Balance[]> =>
      rejectBalanceOptions(() => getBalance(address), options),
    listOperations: (address: string, options: ListOperationsOptions): Promise<Page<Operation>> =>
      listOperations(address, options),

    // --- Transaction lifecycle ---
    craftTransaction: (
      transactionIntent: NearIntent,
      customFees?: FeeEstimation,
    ): Promise<CraftedTransaction> => craftTransaction(transactionIntent, customFees),
    estimateFees: (
      transactionIntent: NearIntent,
      customFeesParameters?: FeeEstimation["parameters"],
    ): Promise<FeeEstimation> => estimateFees(transactionIntent, customFeesParameters),
    combine,
    broadcast: (tx: string, broadcastConfig?: BroadcastConfig): Promise<string> =>
      broadcast(tx, broadcastConfig),
    validateIntent: (
      transactionIntent: NearIntent,
      balances: Balance[],
      customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => validateIntent(transactionIntent, balances, customFees),
    craftTransactionData,
    validateAddress: async (
      address: string,
      _parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => isValidAddress(address),

    // --- Staking ---
    getStakes: (address: string, cursor?: Cursor): Promise<Page<Stake>> =>
      getStakes(address, cursor),
    getValidators: (cursor?: Cursor): Promise<Page<Validator>> => getValidators(cursor),

    // --- Not supported ---
    getBlock: (_height: number): Promise<Block> => {
      throw new Error("getBlock is not supported");
    },
    getNextSequence: (_address: string): Promise<bigint> => {
      throw new Error(
        "getNextSequence is not applicable for Near: the nonce belongs to an access key, not to an account",
      );
    },
    getRewards: (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    call: async () => {
      throw new Error("call is not supported");
    },
  };
}

export default createApi;
