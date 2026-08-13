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
import { type EvmConfigInfo, type EvmContext } from "../config";
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

// The framework contract passes opaque params (object or array); EVM only accepts the object
// form { to, data, block? }, and parseCallParams rejects arrays defensively at runtime. `call`
// returns a hex string, which satisfies the framework's `CallResult` (unknown).
export function createApi(
  currencyId: string,
): CoinModuleApi<EvmConfigInfo, MemoNotSupported, BufferTxData> {
  const currency = getCryptoCurrencyById(currencyId);

  // The {@link EvmContext} is threaded to every public API method (ADR-019) and forwarded to the
  // low layers, which resolve config through `context.config(currency.id)` — no module-level
  // singleton read. `setCoinConfig` above is kept only so external consumers (e.g. Celo) that build
  // their own context via `getCoinConfig` keep working.
  return {
    broadcast: (
      context: EvmContext,
      tx: string,
      options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> =>
      broadcast(context, currency, { signature: tx, broadcastConfig: options?.broadcastConfig }),
    call: async (context: EvmContext, params: CallParams): Promise<string> => {
      const config = await context.config(currency.id);
      const callParams = parseCallParams(params);
      return getNodeApi(config, currency).call(currency, callParams);
    },
    combine: (
      _context: EvmContext,
      tx: string,
      signature: string[],
      _options?: { pubkey?: string },
    ) => combine(tx, signature),
    craftTransaction: (
      context: EvmContext,
      transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> =>
      craftTransaction(context, currency, {
        transactionIntent,
        customFees: options?.customFees,
      }),
    craftRawTransaction: (
      _context: EvmContext,
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ): Promise<CraftedTransaction> => {
      throw new Error("craftRawTransaction is not supported");
    },
    estimateFees: (
      context: EvmContext,
      transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>,
      options?: {
        customFeesParameters?: FeeEstimation["parameters"];
      },
    ): Promise<FeeEstimation> =>
      estimateFees(context, currency, transactionIntent, options?.customFeesParameters),
    getBalance: (
      context: EvmContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => getBalance(context, currency, address, options),
    lastBlock: (context: EvmContext): Promise<BlockInfo> => lastBlock(context, currency),
    listOperations: (
      context: EvmContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation<MemoNotSupported>>> =>
      listOperations(context, currency, address, options),
    getBlock: (context: EvmContext, height: number): Promise<Block> =>
      getBlock(context, currency, height),
    getBlockInfo: (context: EvmContext, height: number): Promise<BlockInfo> =>
      getBlockInfo(context, currency, height),
    async register() {
      throw new Error("register is not supported");
    },
    getStakes(_context: EvmContext, _address: string): Promise<Page<Stake>> {
      throw new Error("getStakes is not supported");
    },
    getRewards(
      _context: EvmContext,
      _address: string,
      _options?: { cursor?: Cursor },
    ): Promise<Page<Reward>> {
      throw new Error("getRewards is not supported");
    },
    getValidators: async (
      context: EvmContext,
      options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> => {
      const config = await context.config(currency.id);
      return getValidatorsPage(config, currency.id, options?.cursor);
    },
    getNextSequence: (context: EvmContext, address: string): Promise<bigint> =>
      getNextSequence(context, currency, address),
    validateAddress: (_context: EvmContext, address, parameters) =>
      validateAddress(address, parameters),
    validateIntent: (
      context: EvmContext,
      intent: TransactionIntent<MemoNotSupported, BufferTxData>,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      validateIntent(context, currency, intent, balances, options?.customFees),
    craftTransactionData: (
      _context: EvmContext,
      intent: TransactionIntent<MemoNotSupported, BufferTxData>,
    ) => craftTransactionData(intent),
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
