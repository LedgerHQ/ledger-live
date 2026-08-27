import type {
  CoinModuleImpl,
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
  TransactionIntent,
  TransactionValidation,
  Validator,
  BalanceOptions,
} from "@ledgerhq/coin-module-framework/api/index";
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
// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed:
//   - `craftRawTransaction` — the chain takes no externally-built transaction.
//   - `register`            — no enrollment step.
//   - `getStakes`, `getRewards` — no staking positions or reward events are read here; only the
//                             validator list is, which `getValidators` serves.
// The consumer resolver applies `withDefaults`, which answers "not supported" for each.
// The return type is the precise object shape `satisfies CoinModuleImpl` infers. Annotating it
// would widen every optional capability back and defeat the authoring type, which is the point of
// the migration — hence the exemption below rather than a return annotation.
// oxlint-disable-next-line explicit-function-return-type
export function createApi(currencyId: string) {
  // The {@link EvmContext} is threaded to every public API method (ADR-019) and forwarded to the
  // low layers, which resolve config through `context.config(currencyId)` — no module-level
  // singleton read.
  return {
    broadcast: (
      context: EvmContext,
      tx: string,
      options?: { broadcastConfig?: BroadcastConfig },
    ): Promise<string> =>
      broadcast(context, currencyId, { signature: tx, broadcastConfig: options?.broadcastConfig }),
    call: async (context: EvmContext, params: CallParams): Promise<string> => {
      const config = await context.config(currencyId);
      const callParams = parseCallParams(params);
      return getNodeApi(config, currencyId).call(currencyId, callParams);
    },
    combine: (
      _context: EvmContext,
      tx: string,
      signature: string[],
      _options?: { pubkey?: string },
    ): string => combine(tx, signature),
    craftTransaction: (
      context: EvmContext,
      transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>,
      options?: { customFees?: FeeEstimation },
    ): Promise<CraftedTransaction> =>
      craftTransaction(context, currencyId, {
        transactionIntent,
        customFees: options?.customFees,
      }),
    estimateFees: (
      context: EvmContext,
      transactionIntent: TransactionIntent<MemoNotSupported, BufferTxData>,
      options?: {
        customFeesParameters?: FeeEstimation["parameters"];
      },
    ): Promise<FeeEstimation> =>
      estimateFees(context, currencyId, transactionIntent, options?.customFeesParameters),
    getBalance: (
      context: EvmContext,
      address: string,
      options?: BalanceOptions,
    ): Promise<Balance[]> => getBalance(context, currencyId, address, options),
    lastBlock: (context: EvmContext): Promise<BlockInfo> => lastBlock(context, currencyId),
    listOperations: (
      context: EvmContext,
      address: string,
      options: ListOperationsOptions,
    ): Promise<Page<Operation<MemoNotSupported>>> =>
      listOperations(context, currencyId, address, options),
    getBlock: (context: EvmContext, height: number): Promise<Block> =>
      getBlock(context, currencyId, height),
    getBlockInfo: (context: EvmContext, height: number): Promise<BlockInfo> =>
      getBlockInfo(context, currencyId, height),
    getValidators: async (
      context: EvmContext,
      options?: { cursor?: Cursor },
    ): Promise<Page<Validator>> => {
      const config = await context.config(currencyId);
      return getValidatorsPage(config, currencyId, options?.cursor);
    },
    getNextSequence: (context: EvmContext, address: string): Promise<bigint> =>
      getNextSequence(context, currencyId, address),
    validateAddress: (_context: EvmContext, address, parameters): Promise<boolean> =>
      validateAddress(address, parameters),
    validateIntent: (
      context: EvmContext,
      intent: TransactionIntent<MemoNotSupported, BufferTxData>,
      balances: Balance[],
      options?: { customFees?: FeeEstimation },
    ): Promise<TransactionValidation> =>
      validateIntent(context, currencyId, intent, balances, options?.customFees),
    craftTransactionData: (
      _context: EvmContext,
      intent: TransactionIntent<MemoNotSupported, BufferTxData>,
    ): BufferTxData => craftTransactionData(intent),
  } satisfies CoinModuleImpl<EvmConfigInfo, MemoNotSupported, BufferTxData>;
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
