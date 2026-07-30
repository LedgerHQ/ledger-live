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
import { getBalance } from "../logic/account/getBalance";
import { getBlockInfo } from "../logic/history/getBlockInfo";
import { lastBlock } from "../logic/history/lastBlock";
import { listOperations } from "../logic/history/listOperations";
import { getStakes } from "../logic/staking/getStakes";
import { getValidators } from "../logic/staking/getValidators";
import { broadcast } from "../logic/transaction/broadcast";
import { combine } from "../logic/transaction/combine";
import { craftTransaction, type NearIntent } from "../logic/transaction/craftTransaction";
import { estimateFees } from "../logic/transaction/estimateFees";
import { validateIntent } from "../logic/transaction/validateIntent";

/**
 * CoinModuleApi ("Alpaca") entry point for NEAR.
 *
 * NEAR is account-based with real delegated staking through staking pool contracts, so the staking
 * reads are implemented and `stakingSupported` is set. What is not implemented is deliberate:
 *
 * - `getRewards`: a staking pool compounds rewards into the staked balance, so there is no discrete
 *   reward-distribution event to list.
 * - `getBlock`: reading a block's transactions costs one extra call per chunk; only the header,
 *   which `getBlockInfo` returns, is cheap.
 * - `getNextSequence`: a NEAR nonce belongs to an access key, not to an account, so it cannot be
 *   resolved from an address alone. `craftTransaction` resolves it from the sender public key.
 * - `call` and `craftRawTransaction`: no contract-call surface in this module.
 * - tokens: the module has no NEP-141 support, so every balance and operation is native.
 */
/**
 * `stakingSupported` is not part of `CoinModuleApi`; the wallet framework reads it off the bridge
 * api to decide whether to fetch validators during a sync. It is declared inline rather than by
 * importing `BridgeApi`, which coin modules are not allowed to depend on.
 */
export function createApi(
  config: NearCoinConfig,
  _currencyId: string,
): CoinModuleApi & { stakingSupported: true } {
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
    stakingSupported: true,
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
