import { rejectBalanceOptions } from "@ledgerhq/coin-module-framework/api/getBalance/rejectBalanceOptions";
import {
  AccountInfo,
  Balance,
  BlockInfo,
  CoinModuleImpl,
  ListOperationsOptions,
  Operation,
  Page,
  TransactionIntent,
  TransactionValidation,
  BalanceOptions,
  Block,
  AddressValidationCurrencyParameters,
} from "@ledgerhq/coin-module-framework/api/index";
import type { TronContext, TronCoinConfig } from "../config";
import {
  broadcast,
  buildEnergyRentRequest,
  combine,
  craftRawTransaction,
  craftTransaction,
  estimateFees,
  estimateSponsoredFeeQuote,
  estimateTronifyFees,
  getAccountInfo,
  getBalance,
  getBlock,
  getBlockInfo,
  getStakes,
  getValidators,
  lastBlock,
  listFeeOptions as listFeeOptionsLogic,
  listOperations as listOperationsLogic,
  validateAddress,
  validateIntent,
} from "../logic";
import { TRONIFY_FEE_OPTION_ID } from "../logic/constants";
import { TRONIFY_PROVIDER } from "../logic/energyProviders";
import {
  awaitEnergyDelivery,
  broadcastEnergyRentTransaction,
  buildSignedEnergyRentTransaction,
  craftEnergyRentTransaction,
  getEnergyProvider,
  getEnergyRentSignaturePayload,
  getEnergyRentStatus,
  isEnergyDeliveredOnChain,
  rentPayment,
  reservationDedupKey,
} from "../logic/energyRent";
import type {
  EnergyRentOrder,
  EnergyRentOrderRef,
  EnergyRentRequest,
  EnergyRentSignedTransaction,
  EnergyRentUnsignedTransaction,
} from "../logic/energyRent";
import { defaultFetchParams, getBlock as getBlockNetwork } from "../network";
import type { TronMemo, TronTxData } from "../types";

const MAX_TRONGRID_LIMIT = 200;

// Re-exported for consumers (the generic fee-picker); canonical definition lives in logic/constants.
export { TRONIFY_FEE_OPTION_ID };

// Checked against CoinModuleImpl with `satisfies` rather than annotated as it, so the precise shape
// survives and a caller sees exactly which methods exist.
//
// Omitted rather than stubbed, and why:
//   - `call`                — Tron contract reads (triggerconstantcontract) are not supported yet.
//   - `getRewards`          — withdrawals already appear in `listOperations`.
//   - `register`            — no enrollment step.
// `craftRawTransaction` IS implemented (below) — the Tronify sponsorship flow (LIVE-32780) signs a
// pre-built payment tx and needs this pass-through; the ordinary send path never calls it directly.
// The consumer resolver applies `withDefaults`, which answers "not supported" for each of them.
export function createApi() {
  const base = {
    broadcast: async (context, tx, _options?) => {
      const config = await context.config();
      return broadcast(context.logger, config, tx);
    },
    combine: (_context, tx, signature, _options?) => combine(tx, signature),
    // Returns Tronify's pre-built payment tx verbatim (re-crafting would sign different bytes). Gated
    // on a configured+supported provider — ungated, any raw-sign caller could get arbitrary bytes signed.
    craftRawTransaction: async (context, transaction, _sender, _publicKey, _sequence) => {
      getEnergyProvider(await context.config());
      return craftRawTransaction(transaction);
    },
    craftTransaction: async (context, transactionIntent, options?) => {
      const config = await context.config();
      return craftTransaction(context.logger, config, transactionIntent, options?.customFees);
    },
    estimateFees: async (context, transactionIntent, options?) => {
      const config = await context.config();
      if (options?.feeOption?.feeOptionId === TRONIFY_FEE_OPTION_ID) {
        return estimateTronifyFees(context.logger, config, transactionIntent);
      }
      return estimateFees(context.logger, config, transactionIntent);
    },
    // Fee-option discovery (ADR-050 Option 3): advertises [tronify, standard] for eligible TRC-20
    // sends, [standard] otherwise. See logic/feeOptions.ts.
    listFeeOptions: (context, transactionIntent) => listFeeOptionsLogic(context, transactionIntent),
    getAccountInfo: async (context, address): Promise<AccountInfo> => {
      const config = await context.config();
      return getAccountInfo(context.logger, config, address);
    },
    getBalance: async (context, address: string, options?: BalanceOptions): Promise<Balance[]> => {
      const config = await context.config();
      return rejectBalanceOptions(() => getBalance(context.logger, config, address), options);
    },
    lastBlock: async (context): Promise<BlockInfo> => {
      const config = await context.config();
      return lastBlock(context.logger, config);
    },
    listOperations,
    getBlock: async (context, height): Promise<Block> => {
      const config = await context.config();
      return getBlock(context.logger, config, height);
    },
    getBlockInfo: async (context, height): Promise<BlockInfo> => {
      const config = await context.config();
      return getBlockInfo(context.logger, config, height);
    },
    getStakes: async (context, address, options?) => {
      const config = await context.config();
      return getStakes(context.logger, config, address, options?.cursor);
    },
    // Unsupported chain-wide, as it is for cosmos, cardano and tezos: `Reward` describes a distribution
    // event with a `receivedAt` date, and Trongrid exposes only the *pending* accrued total
    // (`tronResources.unwithdrawnReward`), which `getStakes` reports as `amountRewarded` instead.
    getValidators: async (context, options?) => {
      const config = await context.config();
      return getValidators(context.logger, config, options?.cursor);
    },
    validateIntent: async (
      context,
      transactionIntent,
      balances,
      options,
    ): Promise<TransactionValidation> => {
      const config = await context.config();
      return validateIntent(
        context.logger,
        config,
        transactionIntent,
        balances,
        options?.customFees,
      );
    },
    // Tron uses (timestamp + ref_block_hash) for replay protection rather than
    // a per-account nonce, so getNextSequence has no meaningful value here.
    getNextSequence: async (_context: TronContext, _address: string) => 0n,
    validateAddress: async (
      _context: TronContext,
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ): Promise<boolean> => validateAddress(address, parameters),
    craftTransactionData: (_context, intent) => craftTransactionData(intent),
  } satisfies CoinModuleImpl<TronCoinConfig, TronMemo, TronTxData>;

  return base;
}

/** Energy-rent seam (Tronify sponsored send), kept off {@link createApi} since it isn't part of the
 * generic `CoinModuleImpl`/`CoinModuleApi` contract; resolved via the registry's sponsored-API loaders. */
export function createSponsoredSendApi(context: TronContext) {
  return {
    feeOptionId: TRONIFY_FEE_OPTION_ID,
    providerName: TRONIFY_PROVIDER.name,
    // The rented energy covers the fee, so validateIntent's NotEnoughGas must not block the send.
    waivesErrorKeys: ["gasLimit"] as const,
    // ...and TronNotEnoughEnergy's burn warning describes the shortfall the rental fills.
    waivesWarningKeys: ["amount"] as const,
    reservationDedupKey,
    listFeeOptions: (intent: TransactionIntent<TronMemo, TronTxData>) =>
      listFeeOptionsLogic(context, intent),
    // Called with logger+config directly, not a framework Context.
    estimateSponsoredFeeQuote: async (intent: TransactionIntent<TronMemo, TronTxData>) =>
      estimateSponsoredFeeQuote(context.logger, await context.config(), intent),
    buildEnergyRentRequest: async (
      intent: TransactionIntent<TronMemo, TronTxData>,
      approvedFee: bigint,
    ) => buildEnergyRentRequest(context.logger, await context.config(), intent, approvedFee),
    craftEnergyRentTransaction: async (request: EnergyRentRequest) =>
      craftEnergyRentTransaction(context.logger, await context.config(), request),
    submitEnergyRentPayment: async (payment: {
      orderId: string;
      signedTransaction: EnergyRentSignedTransaction;
    }) => broadcastEnergyRentTransaction(context.logger, await context.config(), payment),
    getEnergyRentStatus: async (ref: EnergyRentOrderRef) =>
      getEnergyRentStatus(context.logger, await context.config(), ref),
    awaitEnergyDelivery: async (
      ref: EnergyRentOrderRef,
      target: { receiverAddress: string; energyNeeded: bigint },
      opts?: {
        intervalMs?: number;
        timeoutMs?: number;
        paymentTxId?: string;
        signal?: AbortSignal;
      },
    ) => awaitEnergyDelivery(context.logger, await context.config(), ref, target, opts),
    // The provider's advisory "delivered" must be corroborated on-chain before TX-C releases (ADR-058 C4).
    isEnergyDelivered: async (target: { receiverAddress: string; energyNeeded: bigint }) =>
      isEnergyDeliveredOnChain(context.logger, await context.config(), target),
    // Wire transforms kept behind the seam so the generic Send flow never handles coin-tron's Tronify payload.
    getEnergyRentSignaturePayload: (transaction: EnergyRentUnsignedTransaction) =>
      getEnergyRentSignaturePayload(transaction),
    buildSignedEnergyRentTransaction: (
      transaction: EnergyRentUnsignedTransaction,
      deviceSignature: string,
    ) => buildSignedEnergyRentTransaction(transaction, deviceSignature),
    rentPayment: (order: EnergyRentOrder) => rentPayment(order),
  };
}

/**
 * Per ADR-047 the Tron-specific transaction fields live in {@link TronTxData} on the intent, so by
 * the time an intent reaches this API the payload is already built — by
 * `BridgeApi.buildIntentData`, which is the only layer that knows the wallet's Tron transaction
 * shape. This member exists to satisfy `CoinModuleApi` and to keep a caller that builds an intent
 * by hand (the coin-tester, a script) from losing data it already supplied.
 */
function craftTransactionData(intent: TransactionIntent<TronMemo, TronTxData>): TronTxData {
  return intent.data ?? { type: "tron" };
}

async function listOperations(
  context: TronContext,
  address: string,
  { minHeight, order, cursor, limit }: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (limit !== undefined && limit > MAX_TRONGRID_LIMIT) {
    throw new Error(`limit must be <= ${MAX_TRONGRID_LIMIT} for Tron (TronGrid API restriction)`);
  }
  const config = await context.config();
  const effectiveLimit = limit ?? MAX_TRONGRID_LIMIT;
  const effectiveOrder = order ?? "asc";

  let minTimestamp = defaultFetchParams.minTimestamp;
  if (minHeight > 0) {
    // getBlock rejects when minHeight points just past the chain tip (block not yet
    // produced); fall back to the default bound instead of failing the whole listing.
    const block = await getBlockNetwork(context.logger, config, minHeight).catch(() => null);
    minTimestamp = block?.time?.getTime() ?? defaultFetchParams.minTimestamp;
  }

  return listOperationsLogic(context.logger, config, address, {
    limit: effectiveLimit,
    minTimestamp,
    order: effectiveOrder,
    cursor,
  });
}
