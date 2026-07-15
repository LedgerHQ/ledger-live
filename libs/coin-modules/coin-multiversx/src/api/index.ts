import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import type {
  AddressValidationCurrencyParameters,
  Balance,
  BalanceOptions,
  BroadcastConfig,
  CoinModuleApi,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import coinConfig, { type MultiversXCoinConfig } from "../config";
import { createNetworkApi } from "../network/api";
import { broadcast } from "../logic/transaction/broadcast";
import { combine } from "../logic/transaction/combine";
import { craftTransaction } from "../logic/transaction/craftTransaction";
import { estimateFees } from "../logic/transaction/estimateFees";
import { getBalance } from "../logic/account/getBalance";
import { getNextSequence } from "../logic/account/getNextSequence";
import { getStakes } from "../logic/staking/getStakes";
import { getValidators } from "../logic/staking/getValidators";
import { lastBlock } from "../logic/history/lastBlock";
import { listOperations } from "../logic/history/listOperations";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";

export function createApi(config: MultiversXCoinConfig, _currencyId: string): CoinModuleApi {
  coinConfig.setCoinConfig(() => ({
    ...config,
    status: { type: "active" as const },
  }));

  const api = createNetworkApi(config.apiEndpoint, config.delegationApiEndpoint);

  return {
    broadcast: (tx: string, _broadcastConfig?: BroadcastConfig) => {
      return broadcast(api, tx);
    },
    combine: (tx: string, signature: string, pubkey?: string) => {
      return combine(tx, signature, pubkey);
    },
    craftTransaction: (
      intent: TransactionIntent | StakingTransactionIntent,
      customFees?: FeeEstimation,
    ) => {
      return craftTransaction(api, intent, customFees);
    },
    craftRawTransaction: (_tx: string, _sender: string, _publicKey: string, _sequence: bigint) => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: (
      intent: TransactionIntent,
      customFeesParameters?: FeeEstimation["parameters"],
    ) => {
      return estimateFees(intent, customFeesParameters);
    },
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(() => getBalance(api, address), options),
    lastBlock: () => {
      return lastBlock(api);
    },
    listOperations: (address: string, options: ListOperationsOptions) => {
      return listOperations(api, address, options);
    },
    getBlock: () => {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo: () => {
      throw new Error("getBlockInfo is not supported");
    },
    getRewards: (_address: string, _cursor?: Cursor) => {
      throw new Error("getRewards is not supported");
    },
    getValidators: (_cursor?: Cursor) => {
      return getValidators(api, _cursor);
    },
    getStakes: (address: string, cursor?: Cursor) => {
      return getStakes(api, address, cursor);
    },
    validateIntent: (
      intent: TransactionIntent | StakingTransactionIntent,
      balances: Balance[],
      customFees?: FeeEstimation,
    ) => {
      return validateIntent(intent, balances, customFees);
    },
    getNextSequence: (address: string) => {
      return getNextSequence(api, address);
    },
    validateAddress: (
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ) => {
      return validateAddress(address, parameters);
    },
    craftTransactionData,
  };
}
