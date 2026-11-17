import BigNumber from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { createAccountNotFound, ServerError } from "@ledgerhq/wallet-api-core";
import {
  TRONIFY_CREATE_RENT_RECORD_METHOD,
  TRONIFY_GET_QUOTE_METHOD,
  TRONIFY_IS_ENERGY_DELIVERED_METHOD,
  TRONIFY_UPLOAD_HASH_METHOD,
  type CreateTronifyRentRecordParams,
  type CreateTronifyRentRecordResult,
  type GetTronifyQuoteParams,
  type GetTronifyQuoteResult,
  type IsTronifyEnergyDeliveredParams,
  type IsTronifyEnergyDeliveredResult,
  type UploadTronifyHashParams,
  type UploadTronifyHashResult,
} from "@ledgerhq/wallet-api-exchange-module";
import { customWrapper } from "@ledgerhq/wallet-api-server";
import { buildGenericTransactionIntent } from "../../bridge/generic-coin-framework/buildIntent";
import {
  getSponsoredCoinApi,
  type SponsoredCoinApi,
  type SponsoredFeeAsset,
} from "../../bridge/generic-coin-framework/sponsored";
import type { GenericTransaction } from "../../bridge/generic-coin-framework/types";
import {
  getPendingRent,
  markPendingRentDelivered,
  PENDING_RENT_EXPIRY_MARGIN_MS,
  recordPendingRent,
} from "../../flows/send/sponsored/pendingRents";
import { genericValidateAddress } from "../../bridge/generic-coin-framework/validateAddress";
import { getAccountIdFromWalletAccountId } from "../converters";
import type { GetFeatureFn } from "../FeatureFlags/resolver";
import {
  createAccounIdNotFound,
  createTronifyDisabled,
  createTronifyInsufficientBalance,
  createTronifyOrderFailed,
  createTronifyOrderNotFound,
  createTronifyPriceAboveApproved,
  createTronifyQuoteFailed,
  createTronifyRentPending,
  createTronifyUnavailable,
  createTronifyUnsupportedAccount,
  createTronifyUnsupportedTransfer,
  createTronifyUploadFailed,
  createWrongTronifyParams,
  ExchangeError,
  type ExchangeErrorData,
} from "./error";

type TronifyDeps = {
  accounts: AccountLike[];
  getFeature?: GetFeatureFn;
};

const SEAM_KIND = "local";

const POSITIVE_INTEGER = /^[1-9]\d*$/;

type TronSender = { payer: Account; tokenAccount: TokenAccount };

/** The TRC-20 token account that sends, and the TRON account behind it that holds the energy. */
function resolveTronSender(fromAccountId: string, accounts: AccountLike[]): TronSender {
  const accountId = getAccountIdFromWalletAccountId(fromAccountId);
  if (!accountId) throw new ExchangeError(createAccounIdNotFound(fromAccountId));

  const account = accounts.find(acc => acc.id === accountId);
  if (!account) throw new ServerError(createAccountNotFound(fromAccountId));

  // Only a TRC-20 transfer consumes energy, so a native TRX or TRC-10 account has nothing to rent.
  // The parent is looked up directly: `getParentAccount` throws an untyped error when it is missing.
  const parent =
    account.type === "TokenAccount"
      ? accounts.find(
          (acc): acc is Account => acc.type === "Account" && acc.id === account.parentId,
        )
      : undefined;
  if (
    account.type !== "TokenAccount" ||
    account.token.tokenType !== "trc20" ||
    parent?.currency.family !== "tron"
  ) {
    throw new ExchangeError(createTronifyUnsupportedAccount(fromAccountId));
  }
  return { payer: parent, tokenAccount: account };
}

function assertTronifyEnabled(getFeature: GetFeatureFn | undefined): void {
  if (getFeature?.("gasSponsorship")?.enabled !== true) {
    throw new ExchangeError(createTronifyDisabled());
  }
}

async function loadTronifySeam(payer: Account): Promise<SponsoredCoinApi> {
  const seam = await getSponsoredCoinApi(payer.currency.id, SEAM_KIND).catch(() => {
    throw new ExchangeError(createTronifyUnavailable());
  });
  if (!seam) throw new ExchangeError(createTronifyUnavailable());
  return seam;
}

function isTransferParams(
  params: GetTronifyQuoteParams | undefined,
): params is GetTronifyQuoteParams {
  return (
    !!params &&
    typeof params.fromAccountId === "string" &&
    typeof params.recipient === "string" &&
    params.recipient !== "" &&
    typeof params.amount === "string" &&
    POSITIVE_INTEGER.test(params.amount)
  );
}

/** The TRC-20 send intent the Send flow would build for the same transfer. */
async function buildTransferIntent(
  { payer, tokenAccount }: TronSender,
  { recipient, amount }: GetTronifyQuoteParams,
): Promise<unknown> {
  // Checked locally: an invalid address otherwise surfaces as an opaque decode error mid-estimate.
  const isValid = await genericValidateAddress(payer.currency.id, SEAM_KIND)(recipient, {});
  if (!isValid) throw new ExchangeError(createWrongTronifyParams({ recipient }));

  const transaction: GenericTransaction = {
    family: payer.currency.family,
    recipient,
    amount: new BigNumber(amount),
    useAllAmount: false,
    subAccountId: tokenAccount.id,
  };
  return buildGenericTransactionIntent(payer.currency.family, SEAM_KIND, payer, transaction);
}

/** Every Tronify failure gets a code the live app can fall back on: no silent fallback (ADR-050). */
function toTronifyError(
  error: unknown,
  createOtherFailure: (reason: string) => ExchangeErrorData,
): ExchangeError {
  if (error instanceof ExchangeError) return error;
  const name = error instanceof Error ? error.name : undefined;
  const reason = error instanceof Error ? error.message : String(error);
  switch (name) {
    case "EnergyRentUnsupportedIntent":
      return new ExchangeError(createTronifyUnsupportedTransfer(reason));
    case "EnergyRentProviderNotConfigured":
      return new ExchangeError(createTronifyUnavailable());
    default:
      return new ExchangeError(createOtherFailure(reason));
  }
}

const toQuoteError = (error: unknown) => toTronifyError(error, createTronifyQuoteFailed);

function toWireFeeAsset({ unit, ...asset }: SponsoredFeeAsset): GetTronifyQuoteResult["feeAsset"] {
  return {
    type: asset.type,
    ...("assetReference" in asset && asset.assetReference
      ? { assetReference: asset.assetReference }
      : {}),
    unit: { name: unit.name, code: unit.code, magnitude: unit.magnitude },
  };
}

/**
 * `custom.exchange.tronify.getQuote`: the Tronify rent for a TRC-20 transfer, next to the TRX burn
 * it replaces. No order is created.
 */
export async function getTronifyQuote(
  params: GetTronifyQuoteParams | undefined,
  { accounts, getFeature }: TronifyDeps,
): Promise<GetTronifyQuoteResult> {
  if (!isTransferParams(params)) throw new ExchangeError(createWrongTronifyParams(params));
  assertTronifyEnabled(getFeature);

  const sender = resolveTronSender(params.fromAccountId, accounts);
  const seam = await loadTronifySeam(sender.payer);
  const intent = await buildTransferIntent(sender, params);

  const quote = await seam.estimateSponsoredFeeQuote(intent).catch(error => {
    throw toQuoteError(error);
  });
  return {
    feeAsset: toWireFeeAsset(quote.feeAsset),
    value: quote.value.toString(),
    originalValue: quote.originalValue.toString(),
  };
}

export type TronifyRentOrder = {
  orderId: string;
  /** The TRON account: energy and pending rents are per TRON account, not per token. */
  mainAccountId: string;
  payerAddress: string;
  receiverAddress: string;
  transaction: unknown;
  paymentTxId: string;
  energyNeeded: bigint;
  paymentExpiresAt: number;
  signableUntilMs: number;
};

// Module-level: the apps re-create `handlers()` in a `useMemo`, and an order must outlive that.
const rentOrders = new Map<string, TronifyRentOrder>();

function pruneUnsignableRentOrders(now: number): void {
  for (const [orderId, order] of rentOrders) {
    if (order.signableUntilMs <= now) rentOrders.delete(orderId);
  }
}

/** The order `createRentRecord` kept under `orderId`, while its payment can still be signed. */
export function getTronifyRentOrder(orderId: string): TronifyRentOrder | undefined {
  pruneUnsignableRentOrders(Date.now());
  return rentOrders.get(orderId);
}

const latestRentRequestByAccount = new Map<string, object>();

function startRentRequest(mainAccountId: string): () => boolean {
  const request = {};
  latestRentRequestByAccount.set(mainAccountId, request);
  return () => latestRentRequestByAccount.get(mainAccountId) === request;
}

const replacedRentOrder = () =>
  new ExchangeError(createTronifyOrderFailed("a newer rent order replaced this one"));

function keepRentOrder(order: TronifyRentOrder): void {
  pruneUnsignableRentOrders(Date.now());
  for (const [orderId, kept] of rentOrders) {
    if (kept.mainAccountId === order.mainAccountId) rentOrders.delete(orderId);
  }
  rentOrders.set(order.orderId, order);
}

function isRentRecordParams(
  params: CreateTronifyRentRecordParams | undefined,
): params is CreateTronifyRentRecordParams {
  return (
    isTransferParams(params) &&
    typeof params.approvedFee === "string" &&
    POSITIVE_INTEGER.test(params.approvedFee)
  );
}

async function orderRentPayment(
  seam: SponsoredCoinApi,
  sender: TronSender,
  params: CreateTronifyRentRecordParams,
  isLatestRentRequest: () => boolean,
) {
  const intent = await buildTransferIntent(sender, params);
  // Same gate as the Send flow: the rent request alone would rent for any TRC-20 transfer, even one
  // the account has the energy for. It also hides provider failures, so its reason stays neutral.
  const options = await seam.listFeeOptions(intent);
  if (!options.some(option => option.id === seam.feeOptionId)) {
    throw new ExchangeError(createTronifyUnsupportedTransfer("no Tronify fee option"));
  }
  const request = await seam.buildEnergyRentRequest(intent, BigInt(params.approvedFee));
  if (!isLatestRentRequest()) throw replacedRentOrder();
  const order = await seam.craftEnergyRentTransaction(request);
  const signableUntilMs = order.paymentExpiresAt - PENDING_RENT_EXPIRY_MARGIN_MS;
  if (!Number.isFinite(signableUntilMs) || signableUntilMs <= Date.now()) {
    throw new Error("the rent payment expires before it can be signed");
  }
  const { toSign, paymentTxId } = seam.getEnergyRentSignaturePayload(order.transaction);
  return { request, order, toSign, paymentTxId, signableUntilMs };
}

function toRentOrderError(seam: SponsoredCoinApi, error: unknown): ExchangeError {
  if (error instanceof ExchangeError) return error;
  const rejection = seam.classifyRentOrderError(error);
  if (rejection?.reason === "insufficientBalance") {
    return new ExchangeError(createTronifyInsufficientBalance());
  }
  if (rejection?.reason === "priceAboveApproved") {
    return new ExchangeError(createTronifyPriceAboveApproved(rejection.offered.amount.toString()));
  }
  return toTronifyError(error, createTronifyOrderFailed);
}

/**
 * `custom.exchange.tronify.createRentRecord`: creates the Tronify order for a TRC-20 transfer and
 * returns its unsigned rent payment. A new order replaces the account's previous one.
 */
export async function createTronifyRentRecord(
  params: CreateTronifyRentRecordParams | undefined,
  { accounts, getFeature }: TronifyDeps,
): Promise<CreateTronifyRentRecordResult> {
  if (!isRentRecordParams(params)) throw new ExchangeError(createWrongTronifyParams(params));
  assertTronifyEnabled(getFeature);

  const sender = resolveTronSender(params.fromAccountId, accounts);
  // A rent the Send flow paid has not landed yet: a second one would pay for the same energy.
  if (getPendingRent(sender.payer.id)) throw new ExchangeError(createTronifyRentPending());
  const isLatestRentRequest = startRentRequest(sender.payer.id);
  const seam = await loadTronifySeam(sender.payer);

  const { request, order, toSign, paymentTxId, signableUntilMs } = await orderRentPayment(
    seam,
    sender,
    params,
    isLatestRentRequest,
  ).catch(error => {
    throw toRentOrderError(seam, error);
  });
  if (!isLatestRentRequest()) throw replacedRentOrder();

  keepRentOrder({
    orderId: order.orderId,
    mainAccountId: sender.payer.id,
    payerAddress: request.payerAddress,
    receiverAddress: request.receiverAddress,
    transaction: order.transaction,
    paymentTxId,
    energyNeeded: request.energy,
    paymentExpiresAt: order.paymentExpiresAt,
    signableUntilMs,
  });

  return {
    orderId: order.orderId,
    rawTransaction: toSign,
    paymentTxId,
    payCoinCode: order.payCoinCode,
    payCoinAmt: order.payCoinAmt,
    energyNeeded: request.energy.toString(),
  };
}

const HEX_BYTES = /^(?:[0-9a-fA-F]{2})+$/;

function isUploadParams(
  params: UploadTronifyHashParams | undefined,
): params is UploadTronifyHashParams {
  return (
    !!params &&
    typeof params.fromAccountId === "string" &&
    typeof params.orderId === "string" &&
    params.orderId !== "" &&
    typeof params.signedTransactionHex === "string" &&
    HEX_BYTES.test(params.signedTransactionHex)
  );
}

/**
 * `custom.exchange.tronify.uploadHash`: sends the signed rent payment of an order `createRentRecord`
 * kept to Tronify, which broadcasts it. Each order is submitted at most once, even when the upload
 * fails: the payment may have reached the chain, so the live app checks `isEnergyDelivered`.
 */
export async function uploadTronifyHash(
  params: UploadTronifyHashParams | undefined,
  { accounts, getFeature }: TronifyDeps,
): Promise<UploadTronifyHashResult> {
  if (!isUploadParams(params)) throw new ExchangeError(createWrongTronifyParams(params));
  assertTronifyEnabled(getFeature);

  const { payer } = resolveTronSender(params.fromAccountId, accounts);
  const seam = await loadTronifySeam(payer);

  // No await from here to the submit: a concurrent upload of the same order finds it gone.
  const order = getTronifyRentOrder(params.orderId);
  if (!order) throw new ExchangeError(createTronifyOrderNotFound(params.orderId));
  if (order.mainAccountId !== payer.id) {
    throw new ExchangeError(
      createWrongTronifyParams({ fromAccountId: params.fromAccountId, orderId: params.orderId }),
    );
  }
  if (getPendingRent(payer.id)) throw new ExchangeError(createTronifyRentPending());

  let signedTransaction: unknown;
  try {
    // Rejects a signature over any other bytes than the order's payment.
    signedTransaction = seam.buildSignedEnergyRentTransaction(
      order.transaction,
      params.signedTransactionHex,
    );
  } catch {
    throw new ExchangeError(
      createWrongTronifyParams({
        orderId: params.orderId,
        reason: "the signature is not over the order's payment",
      }),
    );
  }

  rentOrders.delete(order.orderId);
  // Held before the submit, as the Send flow does, so neither flow pays for this energy again.
  const holdRent = (submitting: boolean) =>
    recordPendingRent(
      {
        mainAccountId: order.mainAccountId,
        orderId: order.orderId,
        payerAddress: order.payerAddress,
        paymentTxId: order.paymentTxId,
        receiverAddress: order.receiverAddress,
        energyNeeded: order.energyNeeded,
        submitting,
      },
      order.paymentExpiresAt,
    );
  holdRent(true);

  await seam.submitEnergyRentPayment({ orderId: order.orderId, signedTransaction }).catch(error => {
    // The payment may have landed anyway: keep the hold, and let a delivery check release it.
    holdRent(false);
    throw toTronifyError(error, createTronifyUploadFailed);
  });
  // The submit returned, so energy on-chain can now be this payment's delivery.
  holdRent(false);
  return { paymentTxId: order.paymentTxId };
}

/**
 * The rent hold a delivered read of `energyNeeded` would prove landed. The Swap path has no delivery
 * watcher like the Send flow's, so `isEnergyDelivered` releases it. A hold still submitting is not
 * eligible: energy already on-chain is not its delivery.
 */
function rentHoldCoveredBy(payer: Account, energyNeeded: bigint): string | undefined {
  const held = getPendingRent(payer.id);
  return held &&
    !held.submitting &&
    held.receiverAddress === payer.freshAddress &&
    energyNeeded >= held.energyNeeded
    ? held.paymentTxId
    : undefined;
}

/**
 * `custom.exchange.tronify.isEnergyDelivered`: one on-chain read of the payer's available energy
 * against `energyNeeded`. It answers "has the energy arrived", not "will the swap validate".
 */
export async function isTronifyEnergyDelivered(
  params: IsTronifyEnergyDeliveredParams | undefined,
  { accounts, getFeature }: TronifyDeps,
): Promise<IsTronifyEnergyDeliveredResult> {
  if (
    !params ||
    typeof params.fromAccountId !== "string" ||
    typeof params.energyNeeded !== "string" ||
    !POSITIVE_INTEGER.test(params.energyNeeded)
  ) {
    throw new ExchangeError(createWrongTronifyParams(params));
  }
  assertTronifyEnabled(getFeature);

  const { payer } = resolveTronSender(params.fromAccountId, accounts);
  const seam = await loadTronifySeam(payer);

  const energyNeeded = BigInt(params.energyNeeded);
  // Captured before the read: a late response must not release a rent held after it started.
  const heldPaymentTxId = rentHoldCoveredBy(payer, energyNeeded);
  const delivered = await seam.isEnergyDelivered({
    receiverAddress: payer.freshAddress,
    energyNeeded,
  });
  if (delivered && heldPaymentTxId) markPendingRentDelivered(payer.id, heldPaymentTxId);
  return { delivered };
}

export const tronifyHandlers = (deps: TronifyDeps) =>
  ({
    [TRONIFY_GET_QUOTE_METHOD]: customWrapper<GetTronifyQuoteParams, GetTronifyQuoteResult>(
      params => getTronifyQuote(params, deps),
    ),
    [TRONIFY_CREATE_RENT_RECORD_METHOD]: customWrapper<
      CreateTronifyRentRecordParams,
      CreateTronifyRentRecordResult
    >(params => createTronifyRentRecord(params, deps)),
    [TRONIFY_UPLOAD_HASH_METHOD]: customWrapper<UploadTronifyHashParams, UploadTronifyHashResult>(
      params => uploadTronifyHash(params, deps),
    ),
    [TRONIFY_IS_ENERGY_DELIVERED_METHOD]: customWrapper<
      IsTronifyEnergyDeliveredParams,
      IsTronifyEnergyDeliveredResult
    >(params => isTronifyEnergyDelivered(params, deps)),
  }) as const;
