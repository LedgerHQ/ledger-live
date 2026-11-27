import type {
  CoinModuleImpl,
  Balance,
  BalanceOptions,
  BlockInfo,
  Block,
  CraftedTransaction,
  FeeEstimation,
  ListOperationsOptions,
  Operation,
  Page,
  TransactionIntent,
  AddressValidationCurrencyParameters,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import {
  serializeTransfer,
  serializeTransferWithMemo,
  TransactionType,
} from "@ledgerhq/concordium-core";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { validateAddress } from "../bridge/validateAddress";
import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  broadcast,
  combine,
  craftRawTransaction,
  craftTransaction as craftTransactionLogic,
  estimateFees as estimateFeesLogic,
  getBalance,
  getBlock,
  getBlockInfo,
  getNextValidSequence,
  lastBlock,
  listOperations as listOperationsLogic,
} from "../logic";
import { getAccountStatus, type ConcordiumAccountStatus } from "../logic/account/getAccountStatus";
import {
  withConfig,
  type ConcordiumCoinConfig,
  type ConcordiumContext,
  type ConcordiumMemo,
} from "../types";
import { mapRawOperationToApiOperation } from "./utils";

/** Resolves the config once per call, so every request of the call reaches the same proxy. */
const pin = async (context: ConcordiumContext): Promise<ConcordiumContext> =>
  withConfig(context, await context.config());

// Not in `CoinModuleApi` yet.
type AccountStatusCapability<C> = {
  getAccountStatus: (context: C, key: string) => Promise<ConcordiumAccountStatus>;
};

/**
 * In the {@link Context}-based API (ADR-019) each method resolves the coin configuration once and
 * hands the concordium network/logic layers, which take the `Context` as their first argument, a
 * context pinned to it; the config alone selects the chain. The classic bridge threads the
 * `Context` it receives the same way, pinned to the config of the account's currency.
 *
 * Checked against {@link CoinModuleImpl} with `satisfies` rather than annotated as it, so the
 * precise shape survives and a caller sees exactly which methods exist.
 *
 * Omitted rather than stubbed:
 *   - `call`, `register` — the module implements neither.
 *   - `getStakes`, `getRewards`, `getValidators` — Concordium staking is not exposed here.
 *   - `validateIntent` — no intent validation is implemented on this path.
 *   - `getNextSequence` — not published; the crafting path resolves the sequence internally via
 *     `getNextValidSequence`.
 * The consumer resolver applies `withDefaults`, which answers "not supported" for each of them.
 */
export function createApi() {
  return {
    broadcast: async (context, tx, _options?) => broadcast(await pin(context), tx),
    combine: (_context, tx, signature, _options?) => combine(tx, signature),
    craftTransaction: async (context, transactionIntent, _options?) =>
      craftTransaction(await pin(context), transactionIntent),
    craftRawTransaction: async (context, transaction, sender, publicKey, sequence) =>
      craftRawTransaction(await pin(context), transaction, sender, publicKey, sequence),
    estimateFees: async (context, transactionIntent, _options?) =>
      estimateFees(await pin(context), transactionIntent),
    getAccountStatus: async (context: ConcordiumContext, publicKey: string) => {
      const signal = context.signal instanceof AbortSignal ? context.signal : undefined;
      return getAccountStatus(await pin(context), publicKey, signal);
    },
    getBalance: (context, address: string, options?: BalanceOptions): Promise<Balance[]> =>
      rejectBalanceOptions(async () => getBalance(await pin(context), address), options),
    lastBlock: async (context): Promise<BlockInfo> => lastBlock(await pin(context)),
    listOperations: async (context, address, options): Promise<Page<Operation>> =>
      listOperations(await pin(context), address, options),
    getBlock: async (context, height): Promise<Block> => getBlock(await pin(context), height),
    getBlockInfo: async (context, height): Promise<BlockInfo> =>
      getBlockInfo(await pin(context), height),
    validateAddress: async (
      _context: ConcordiumContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  } satisfies CoinModuleImpl<ConcordiumCoinConfig, ConcordiumMemo> &
    AccountStatusCapability<ConcordiumContext>;
}

/**
 * Crafting ignores `asset` and always emits a native transfer, so without this
 * a PLT intent would be signed as a CCD transfer of the same integer amount.
 * `getBalance` reports PLT balances, which makes such an intent constructible;
 * PLT crafting itself lands in LIVE-28337.
 */
function assertNativeAsset(transactionIntent: TransactionIntent<ConcordiumMemo>): void {
  invariant(
    transactionIntent.asset.type === "native",
    "concordium: asset type %s is not supported",
    transactionIntent.asset.type,
  );
}

async function craftTransaction(
  context: ConcordiumContext,
  transactionIntent: TransactionIntent<ConcordiumMemo>,
): Promise<CraftedTransaction> {
  assertNativeAsset(transactionIntent);

  const nextSequenceNumber = await getNextValidSequence(context, transactionIntent.sender);
  const memo =
    "memo" in transactionIntent && transactionIntent.memo?.type === "string"
      ? transactionIntent.memo.value
      : undefined;
  const structuredTransaction = await craftTransactionLogic(
    { address: transactionIntent.sender, nextSequenceNumber },
    {
      recipient: transactionIntent.recipient,
      amount: new BigNumber(transactionIntent.amount.toString()),
      ...(memo ? { memo } : {}),
    },
  );
  const serialized =
    structuredTransaction.type === TransactionType.TransferWithMemo
      ? serializeTransferWithMemo(structuredTransaction)
      : serializeTransfer(structuredTransaction);
  return { transaction: serialized.toString("hex") };
}

async function estimateFees(
  context: ConcordiumContext,
  transactionIntent: TransactionIntent<ConcordiumMemo>,
): Promise<FeeEstimation> {
  // Rejected here too, or a caller gets a plausible native fee for a send that
  // cannot be crafted.
  assertNativeAsset(transactionIntent);

  const memo =
    "memo" in transactionIntent && transactionIntent.memo?.type === "string"
      ? transactionIntent.memo.value
      : undefined;

  const estimation = await estimateFeesLogic(context, memo);

  return { value: estimation.cost };
}

async function listOperations(
  context: ConcordiumContext,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  const { items, next } = await listOperationsLogic(context, address, options);

  return {
    items: items.map(op => mapRawOperationToApiOperation(op, address)),
    next,
  };
}
