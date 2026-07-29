import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
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
  MemoNotSupported,
  Page,
  Reward,
  StakingTransactionIntent,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import coinConfig, { CosmosCoinConfig } from "../config";
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

type CosmosCoinModuleApi = CoinModuleApi<StringMemo | MemoNotSupported>;

/**
 * CoinModuleApi ("Alpaca") entry point for Cosmos-SDK chains. `currencyId` selects
 * the chain; endpoint and chain parameters resolve per currency via {@link CosmosAPI},
 * so a single factory serves every Cosmos-family currency.
 */
const configs: Record<string, CosmosCoinConfig> = {};

export function createApi(config: CosmosCoinConfig, currencyId: string): CosmosCoinModuleApi {
  configs[currencyId] = config;
  coinConfig.setCoinConfig(
    (id?: string) =>
      ({ ...((id && configs[id]) || config), status: { type: "active" } }) as CosmosCoinConfig,
  );

  const api = new CosmosAPI(currencyId);

  return {
    async call() {
      throw new Error("call is not supported");
    },
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(api, address), options),
    getNextSequence: (address: string) => getNextSequence(api, address),
    lastBlock: () => lastBlock(api),
    validateAddress: (address: string, parameters: Partial<AddressValidationCurrencyParameters>) =>
      validateAddress(address, { ...parameters, currencyId }),
    craftTransactionData,

    craftTransaction: (
      intent: TransactionIntent<StringMemo | MemoNotSupported> | StakingTransactionIntent,
      customFees?: FeeEstimation,
    ) => craftTransaction(api, currencyId, intent, customFees),
    estimateFees: (
      intent: TransactionIntent<StringMemo | MemoNotSupported>,
      customFeesParameters?: FeeEstimation["parameters"],
    ) => estimateFees(api, intent, customFeesParameters),
    combine: (tx: string, signature: string, pubkey?: string) => combine(tx, signature, pubkey),
    broadcast: (tx: string, _broadcastConfig?: BroadcastConfig) => broadcast(api, tx),

    listOperations: (address: string, options: ListOperationsOptions) =>
      listOperations(api, address, options),
    validateIntent: (
      intent: TransactionIntent<StringMemo | MemoNotSupported>,
      balances: Balance[],
      customFees?: FeeEstimation,
    ) => validateIntent(currencyId, intent, balances, customFees),

    getStakes: (address: string, cursor?: Cursor) => getStakes(api, address, cursor),
    getValidators: (cursor?: Cursor) => getValidators(api, cursor),

    // --- not supported by the Cosmos coin module ---
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    getRewards: (_address: string, _cursor?: Cursor): Promise<Page<Reward>> => {
      throw new Error("getRewards is not supported");
    },
    getBlock: (_height: number): Promise<Block> => {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo: (_height: number): Promise<BlockInfo> => {
      throw new Error("getBlockInfo is not supported");
    },
  };
}
