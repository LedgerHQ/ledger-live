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
import type { Context } from "@ledgerhq/coin-module-framework/config";
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
import type { ConcordiumCoinConfig, ConcordiumMemo } from "../types";
import { mapRawOperationToApiOperation } from "./utils";

type ConcordiumApiContext = Context<ConcordiumCoinConfig>;

/**
 * In the {@link Context}-based API (ADR-019) the coin configuration is resolved per call from
 * `context.config()` and threaded explicitly (as the required first argument) into the concordium
 * network/logic layers. The `currencyId` used for chain selection is captured once from
 * {@link createApi} and forwarded from this closure unchanged. The classic bridge resolves the same
 * config from its `getCoinConfig` singleton and threads it the same way.
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
export function createApi(currencyId: string) {
  return {
    broadcast: async (context, tx, _options?) => {
      const config = await context.config();
      return broadcast(config, tx, currencyId);
    },
    combine: (_context, tx, signature, _options?) => combine(tx, signature),
    craftTransaction: async (context, transactionIntent, _options?) => {
      const config = await context.config();
      return craftTransaction(config, transactionIntent, currencyId);
    },
    craftRawTransaction: async (_context, transaction, sender, publicKey, sequence) => {
      return craftRawTransaction(transaction, sender, publicKey, sequence);
    },
    estimateFees: async (context, transactionIntent, _options?) => {
      const config = await context.config();
      return estimateFees(config, transactionIntent, currencyId);
    },
    getBalance: async (context, address: string, options?: BalanceOptions): Promise<Balance[]> => {
      const config = await context.config();
      return rejectBalanceOptions(() => getBalance(config, address, currencyId), options);
    },
    lastBlock: async (context): Promise<BlockInfo> => {
      const config = await context.config();
      return lastBlock(config, currencyId);
    },
    listOperations: async (context, address, options): Promise<Page<Operation>> => {
      const config = await context.config();
      return listOperations(config, address, options, currencyId);
    },
    getBlock: async (context, height): Promise<Block> => {
      const config = await context.config();
      return getBlock(config, height, currencyId);
    },
    getBlockInfo: async (context, height): Promise<BlockInfo> => {
      const config = await context.config();
      return getBlockInfo(config, height, currencyId);
    },
    validateAddress: async (
      _context: ConcordiumApiContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  } satisfies CoinModuleImpl<ConcordiumCoinConfig, ConcordiumMemo>;
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
  config: ConcordiumCoinConfig,
  transactionIntent: TransactionIntent<ConcordiumMemo>,
  currencyId: string,
): Promise<CraftedTransaction> {
  assertNativeAsset(transactionIntent);

  const nextSequenceNumber = await getNextValidSequence(
    config,
    transactionIntent.sender,
    currencyId,
  );
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
  config: ConcordiumCoinConfig,
  transactionIntent: TransactionIntent<ConcordiumMemo>,
  currencyId: string,
): Promise<FeeEstimation> {
  // Rejected here too, or a caller gets a plausible native fee for a send that
  // cannot be crafted.
  assertNativeAsset(transactionIntent);

  const memo =
    "memo" in transactionIntent && transactionIntent.memo?.type === "string"
      ? transactionIntent.memo.value
      : undefined;

  const estimation = await estimateFeesLogic(config, currencyId, memo);

  return { value: estimation.cost };
}

async function listOperations(
  config: ConcordiumCoinConfig,
  address: string,
  options: ListOperationsOptions,
  currencyId: string,
): Promise<Page<Operation>> {
  const { items, next } = await listOperationsLogic(config, address, options, currencyId);

  return {
    items: items.map(mapRawOperationToApiOperation),
    next,
  };
}
