import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  AddressValidationCurrencyParameters,
  CoinModuleApi,
  Balance,
  BalanceOptions,
  BroadcastConfig,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  MemoNotSupported,
  StakingTransactionIntent,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import coinConfig, { SolanaCoinConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftRawTransaction } from "../logic/craftRawTransaction";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getNextSequence } from "../logic/getNextSequence";
import { getStakes } from "../logic/getStakes";
import { getValidators } from "../logic/getValidators";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";
import { getChainAPI } from "../network";
import { endpointByCurrencyId } from "../utils";

type SolanaCoinModuleApi = CoinModuleApi<StringMemo | MemoNotSupported>;

export function createApi(config: SolanaCoinConfig, currencyId: string): SolanaCoinModuleApi {
  coinConfig.setCoinConfig(() => ({
    ...config,
    status: { type: "active" as const },
  }));

  const api = getChainAPI({ endpoint: endpointByCurrencyId(currencyId) });

  return {
    broadcast: (tx: string, _broadcastConfig?: BroadcastConfig) => {
      return broadcast(api, tx);
    },
    combine: (tx: string, signature: string, _pubkey?: string) => {
      return combine(tx, signature);
    },
    craftTransaction: (
      intent: TransactionIntent<StringMemo | MemoNotSupported> | StakingTransactionIntent,
      customFees?: FeeEstimation,
    ) => {
      return craftTransaction(api, intent, customFees);
    },
    craftRawTransaction: (tx: string, sender: string, _publicKey: string, _sequence: bigint) => {
      return craftRawTransaction(tx, sender);
    },
    estimateFees: (
      intent: TransactionIntent<StringMemo | MemoNotSupported>,
      customFeesParameters?: FeeEstimation["parameters"],
    ) => {
      return estimateFees(api, intent, customFeesParameters);
    },
    getBalance: (address: string, options?: BalanceOptions) =>
      rejectBalanceOptions(
        () =>
          getBalance(api, address, {
            token2022Enabled: config.token2022Enabled,
          }),
        options,
      ),
    lastBlock: () => {
      return lastBlock(api);
    },
    listOperations: (_address: string, _options: ListOperationsOptions) => {
      return listOperations(api, _address, _options);
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
    getValidators: () => getValidators(config.validatorsUrl),
    getStakes: (address: string, cursor?: Cursor) => {
      return getStakes(api, address, cursor);
    },
    validateIntent: (
      intent: TransactionIntent<StringMemo | MemoNotSupported>,
      balances: Balance[],
      customFees?: FeeEstimation,
    ) => {
      return validateIntent(intent, balances, customFees);
    },
    getNextSequence: async (address: string) => {
      return getNextSequence(address);
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
