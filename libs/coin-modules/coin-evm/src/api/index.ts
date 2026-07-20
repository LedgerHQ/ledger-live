import type {
  CoinModuleApi,
  Balance,
  Block,
  BlockInfo,
  BroadcastConfig,
  BufferTxData,
  CallParams,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  MemoNotSupported,
  Operation,
  Page,
  Reward,
  Stake,
  TransactionIntent,
  TransactionValidation,
  Validator,
  BalanceOptions,
} from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { EvmCoinConfig, setCoinConfig, type EvmConfig } from "../config";
import { craftTransactionData } from "../logic/craftTransactionData";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getBlock,
  getBlockInfo,
  getNextSequence,
  lastBlock,
  listOperations,
  validateIntent,
} from "../logic/index";
import { validateAddress } from "../logic/validateAddress";
import { getNodeApi } from "../network/node";
import type { EvmCallParams } from "../network/node/types";
import { getValidatorsPage } from "../staking/validators";
import { isHexString } from "../utils";

// NOTE Celo still relies on the EVM coin config and injects its own
// while creating an unused instance of API
// TODO Change to Record<string, EvmConfig> once Celo bridge is removed
const configs: Record<string, EvmConfig | (() => EvmCoinConfig)> = {};

// The framework contract passes opaque params (object or array); EVM only accepts the object
// form { to, data, block? }, and parseCallParams rejects arrays defensively at runtime.
type EvmCoinModuleApi = CoinModuleApi<MemoNotSupported, BufferTxData> & {
  call: (params: CallParams) => Promise<string>;
};

export function createApi(
  config: EvmConfig | (() => EvmCoinConfig),
  currencyId: string,
): EvmCoinModuleApi {
  configs[currencyId] = config;
  setCoinConfig(id => {
    const evmConfig = configs[id];
    return typeof evmConfig === "function"
      ? evmConfig()
      : { info: { ...evmConfig, status: { type: "active" } } };
  });
  const currency = getCryptoCurrencyById(currencyId);

  return {
    broadcast: (tx: string, broadcastConfig?: BroadcastConfig): Promise<string> =>
      broadcast(currency, { signature: tx, broadcastConfig }),
    call: async (params: CallParams): Promise<string> => {
      const callParams = parseCallParams(params);
      return getNodeApi(currency).call(currency, callParams);
    },
    combine,
    craftTransaction: (
      transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>,
      customFees?: FeeEstimation,
    ): Promise<CraftedTransaction> => craftTransaction(currency, { transactionIntent, customFees }),
    craftRawTransaction: (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: (
      transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>,
      customFeesParameters?: FeeEstimation["parameters"],
    ): Promise<FeeEstimation> => estimateFees(currency, transactionIntent, customFeesParameters),
    getBalance: (address: string, options?: BalanceOptions): Promise<Balance[]> =>
      getBalance(currency, address, options),
    lastBlock: (): Promise<BlockInfo> => lastBlock(currency),
    listOperations: (
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation<MemoNotSupported>>> => listOperations(currency, address, options),
    getBlock: (height: number): Promise<Block> => getBlock(currency, height),
    getBlockInfo: (height: number): Promise<BlockInfo> => getBlockInfo(currency, height),
    getStakes(_address: string): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(_address: string, _cursor?: Cursor): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators: (cursor?: Cursor): Promise<Page<Validator>> =>
      getValidatorsPage(currency.id, cursor),
    getNextSequence: (address: string): Promise<bigint> => getNextSequence(currency, address),
    validateAddress,
    validateIntent: (
      intent: TransactionIntent<MemoNotSupported, BufferTxData>,
      balances: Balance[],
      customFees?: FeeEstimation,
    ): Promise<TransactionValidation> => validateIntent(currency, intent, balances, customFees),
    craftTransactionData,
  };
}

export function parseCallParams(params: unknown): EvmCallParams {
  if (Array.isArray(params) || params === null || typeof params !== "object") {
    throw new TypeError("Invalid EVM call params: expected an object");
  }

  const { to, data, block } = params as Record<string, unknown>;
  if (typeof to !== "string" || !isHexString(to, 20)) {
    throw new TypeError('Invalid EVM call params: "to" must be a 0x-prefixed 20-byte hex address');
  }
  if (typeof data !== "string" || !isHexString(data)) {
    throw new TypeError('Invalid EVM call params: "data" must be 0x-prefixed hex calldata');
  }
  if (block !== undefined && typeof block !== "string" && typeof block !== "number") {
    throw new TypeError('Invalid EVM call params: "block" must be a string or number');
  }
  if (typeof block === "string" && block.length === 0) {
    throw new TypeError('Invalid EVM call params: "block" must be a non-empty string');
  }
  if (typeof block === "number" && (!Number.isSafeInteger(block) || block < 0)) {
    throw new TypeError('Invalid EVM call params: numeric "block" must be a non-negative integer');
  }

  return block === undefined ? { to, data } : { to, data, block };
}
