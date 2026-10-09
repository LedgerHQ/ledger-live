import type { Logger } from "@ledgerhq/coin-module-framework/config";
import { delay } from "@ledgerhq/coin-module-framework/promises";
import BigNumber from "bignumber.js";
import type { TronCoinConfig } from "../../config";
import {
  EnergyDelegationTimeoutError,
  EnergyDeliveryAbortedError,
  EnergyRentProviderNotConfigured,
  TronifyApiError,
} from "../../types/errors";
import {
  ENERGY_RENT_PAYMENT_MAX_EXPIRY_MS,
  ENERGY_RENT_PAYMENT_MAX_FEE_LIMIT,
  ENERGY_RENT_POLL_INTERVAL_MS,
  ENERGY_RENT_POLL_MAX_CONSECUTIVE_ERRORS,
  ENERGY_RENT_POLL_TIMEOUT_MS,
  TRONIFY_PAY_ASSET,
  payAssetBaseUnits,
} from "../constants";
import { getTronifyConfig } from "../../network/tronify";
import { decode58Check } from "../../network/format";
import { getTronAccountNetwork } from "../../network";
import { abiDecodeTrc20Transfer, type Trc20TransferData } from "../../network/utils";
import { decodeTransaction, isCanonicalTriggerSmartContractTx } from "../utils";
import { maxRentBaseUnits, tronifyPaymentAddresses } from "./paymentPolicy";
import { tronifyProvider } from "./tronify";
import type {
  EnergyProvider,
  EnergyRentOrder,
  EnergyRentOrderRef,
  EnergyRentQuote,
  EnergyRentRequest,
  EnergyRentSignedTransaction,
  EnergyRentStatus,
  VerifiedEnergyRentOrder,
} from "./types";

export * from "./types";
export * from "./signing";
export * from "./rejection";

/** The sole config-driven energy-rent provider resolver (energyProviders.ts's lookup is display-only). */
export function getEnergyProvider(config: TronCoinConfig): EnergyProvider {
  const energyRent = config.energyRent;
  if (!energyRent) {
    throw new EnergyRentProviderNotConfigured("No energy-rent provider configured");
  }
  if (energyRent.provider === "tronify") {
    // Gates raw-signing (craftRawTransaction): getTronifyConfig throws unless url + sourceFlag exist.
    getTronifyConfig(config);
    return tronifyProvider;
  }
  // `provider` comes from remote coin-config, so guard against an unknown value at runtime.
  throw new EnergyRentProviderNotConfigured(
    `Unsupported energy-rent provider: ${energyRent.provider}`,
  );
}

export function getEnergyRentQuote(
  logger: Logger,
  config: TronCoinConfig,
  request: EnergyRentRequest,
): Promise<EnergyRentQuote> {
  return getEnergyProvider(config).getQuote(logger, config, request);
}

const rejected = (rule: string, message: string, fields?: Record<string, unknown>) =>
  new TronifyApiError(message, { ...fields, rule });

type ApprovedCost = { amount: BigNumber; code: string };

// The ceiling and its coin code bind the order to the fee approved on Review.
function approvedCost({ maxPayCoinAmt, maxPayCoinCode }: EnergyRentRequest): ApprovedCost {
  // No coin code with a ceiling fails closed: an amount alone can't rule out a cheaper-denomination underprice.
  if (maxPayCoinAmt === undefined || maxPayCoinCode === undefined) {
    throw rejected("ceiling", "Energy-rent request carries no approved cost ceiling and coin code");
  }
  const amount = new BigNumber(maxPayCoinAmt);
  if (!amount.isFinite()) {
    throw rejected("ceiling", `Energy-rent cost ceiling "${maxPayCoinAmt}" is not a number`);
  }
  return { amount, code: maxPayCoinCode };
}

// getQuote and createOrder price independently; unchecked, the device could be handed payment
// bytes for more than the user approved.
function assertOrderWithinApprovedCost(
  approved: ApprovedCost,
  order: EnergyRentOrder,
  cap: BigNumber,
): void {
  if (String(order.payCoinCode).toUpperCase() !== approved.code.toUpperCase()) {
    throw rejected(
      "payCoin",
      `Energy-rent order is priced in ${String(order.payCoinCode)}, but ${approved.code} was approved`,
    );
  }

  const charged = new BigNumber(order.payCoinAmt);
  // Unparseable/negative payCoinAmt must fail, not silently compare false.
  if (!charged.isFinite() || charged.isNegative()) {
    throw rejected(
      "ceiling",
      `Cannot verify energy-rent cost: order returned "${order.payCoinAmt}"`,
    );
  }
  if (charged.isGreaterThan(approved.amount)) {
    const withinCap = payAssetBaseUnits(order.payCoinAmt).isLessThanOrEqualTo(cap);
    throw rejected(
      "ceiling",
      `Energy-rent order costs ${order.payCoinAmt}, above the approved ${approved.amount.toFixed()}`,
      withinCap ? { payCoinAmt: order.payCoinAmt } : undefined,
    );
  }
}

// abiDecodeTrc20Transfer tolerates trailing bytes and any address padding; the payment we sign must
// be exactly transfer(address,uint256), its address word in the TRON (41) or EVM (00) form.
const TRC20_TRANSFER_CALL = /^a9059cbb0{22}(00|41)[0-9a-f]{104}$/i;

function decodeStrictTrc20Transfer(data: unknown): Trc20TransferData | null {
  if (typeof data !== "string" || !TRC20_TRANSFER_CALL.test(data)) return null;
  return abiDecodeTrc20Transfer(data);
}

type DecodedContract = {
  type?: string;
  Permission_id?: number;
  parameter?: {
    value?: {
      owner_address?: string;
      contract_address?: string;
      data?: string;
      call_value?: number;
      call_token_value?: number;
      token_id?: number;
    };
  };
};

async function decodePayment(
  order: EnergyRentOrder,
): Promise<{ contracts: DecodedContract[]; rawData: Record<string, unknown> }> {
  try {
    const { raw_data } = await decodeTransaction(order.transaction.raw_data_hex);
    return {
      contracts: (raw_data.contract as DecodedContract[] | undefined) ?? [],
      rawData: raw_data,
    };
  } catch (cause) {
    throw new TronifyApiError(
      "Could not decode the energy-rent payment transaction for verification",
      { rule: "decode", cause },
    );
  }
}

const isUnset = (value: unknown): boolean =>
  value === undefined || value === null || (value as { length?: unknown }).length === 0;

// Tronify's payments set none of these: only the fields a plain transfer needs get signed.
function assertNoExtraFields(rawData: Record<string, unknown>, contract: DecodedContract): void {
  if (!isUnset(rawData.data)) throw rejected("memo", "Energy-rent payment carries a memo");
  if (!isUnset(rawData.scripts)) throw rejected("scripts", "Energy-rent payment carries scripts");
  if (!isUnset(rawData.auths)) {
    throw rejected("auths", "Energy-rent payment carries authorities");
  }
  if (contract.Permission_id !== undefined && contract.Permission_id !== 0) {
    throw rejected("permission", "Energy-rent payment is signed under a non-owner permission");
  }
}

// Binds the signed amount to the order, which is what the UI shows and reserves. A sub-unit quote
// may be paid rounded either way.
function assertTransferAmount(
  transfer: Trc20TransferData,
  order: EnergyRentOrder,
  cap: BigNumber,
): void {
  const approved = payAssetBaseUnits(order.payCoinAmt);
  if (!approved.isFinite() || !approved.isGreaterThan(0)) {
    throw rejected(
      "amount",
      `Cannot verify energy-rent payment amount: approved "${order.payCoinAmt}"`,
    );
  }
  if (transfer.amount.isGreaterThan(approved)) {
    throw rejected(
      "amount",
      `Energy-rent payment moves ${transfer.amount.toFixed()} USDT base units, above the approved ${approved.toFixed()}`,
    );
  }
  const approvedFloor = new BigNumber(order.payCoinAmt)
    .shiftedBy(TRONIFY_PAY_ASSET.unit.magnitude)
    .integerValue(BigNumber.ROUND_FLOOR);
  if (!transfer.amount.isGreaterThan(0) || transfer.amount.isLessThan(approvedFloor)) {
    throw rejected(
      "amount",
      `Energy-rent payment moves ${transfer.amount.toFixed()} USDT base units, below the approved ${approvedFloor.toFixed()}`,
    );
  }
  if (transfer.amount.isGreaterThan(cap)) {
    throw rejected(
      "cap",
      `Energy-rent payment moves ${transfer.amount.toFixed()} USDT base units, above the ${cap.toFixed()} cap`,
    );
  }
}

/** Returns the payment's expiration. */
function assertPaymentWindow(rawData: Record<string, unknown>): number {
  const { fee_limit: feeLimit, expiration } = rawData;
  // fee_limit caps what the TVM may burn from the payer.
  if (
    feeLimit !== undefined &&
    !(typeof feeLimit === "number" && feeLimit <= ENERGY_RENT_PAYMENT_MAX_FEE_LIMIT)
  ) {
    throw rejected(
      "feeLimit",
      `Energy-rent payment carries fee_limit ${JSON.stringify(feeLimit)}, above the ${ENERGY_RENT_PAYMENT_MAX_FEE_LIMIT} sun bound`,
    );
  }

  // An expired payment moves no funds, but the network rejects it only after the user has signed.
  const now = Date.now();
  const latestExpiration = now + ENERGY_RENT_PAYMENT_MAX_EXPIRY_MS;
  if (
    typeof expiration !== "number" ||
    !Number.isFinite(expiration) ||
    expiration <= now ||
    expiration > latestExpiration
  ) {
    throw rejected(
      "expiration",
      `Energy-rent payment expires at ${JSON.stringify(expiration)}, outside the accepted (${now}, ${latestExpiration}] window`,
    );
  }
  return expiration;
}

// Verifies the signed bytes themselves (not just provider-declared payCoinAmt/payCoinCode) match the
// approved USDT transfer — otherwise the device could sign a payment other than what was approved.
async function assertSignableTransferMatchesRequest(
  request: EnergyRentRequest,
  order: EnergyRentOrder,
  limits: { payees: ReadonlySet<string>; cap: BigNumber },
): Promise<number> {
  // The caller may approve any coin code; only a USDT payment can be decoded and bounded here.
  if (String(order.payCoinCode).toUpperCase() !== TRONIFY_PAY_ASSET.unit.code) {
    throw rejected(
      "payCoin",
      `Energy-rent order is priced in ${String(order.payCoinCode)}; only ${TRONIFY_PAY_ASSET.unit.code} payments can be verified`,
    );
  }

  const { contracts, rawData } = await decodePayment(order);
  if (contracts.length !== 1 || contracts[0]?.type !== "TriggerSmartContract") {
    const shape =
      contracts.length === 1 ? String(contracts[0]?.type) : `${contracts.length} contract(s)`;
    throw rejected(
      "shape",
      `Energy-rent payment must be a single USDT transfer, but the signed bytes carry ${shape}`,
    );
  }
  if (!isCanonicalTriggerSmartContractTx(order.transaction.raw_data_hex)) {
    throw rejected("encoding", "Energy-rent payment carries bytes the decoder does not read");
  }
  assertNoExtraFields(rawData, contracts[0]);

  const value = contracts[0].parameter?.value ?? {};
  // decode58Check and the decoder both yield lower-case 0x41-prefixed hex, so compare directly.
  const signedOwner = (value.owner_address ?? "").toLowerCase();
  if (signedOwner !== decode58Check(request.payerAddress).toLowerCase()) {
    throw rejected(
      "owner",
      "Energy-rent payment is signed from a different owner than the approved payer",
    );
  }
  const calledContract = (value.contract_address ?? "").toLowerCase();
  if (calledContract !== decode58Check(TRONIFY_PAY_ASSET.assetReference).toLowerCase()) {
    throw rejected("contract", "Energy-rent payment calls a contract other than USDT");
  }
  if (value.call_value || value.call_token_value || value.token_id) {
    throw rejected(
      "callValue",
      "Energy-rent payment attaches TRX or TRC-10 value to the USDT call",
    );
  }

  const transfer = decodeStrictTrc20Transfer(value.data);
  if (!transfer) {
    throw rejected(
      "transferCall",
      "Energy-rent payment data is not a USDT transfer(address,uint256) call",
    );
  }
  if (!limits.payees.has(transfer.to.toLowerCase())) {
    throw rejected("payee", "Energy-rent payment goes to an address Tronify does not list");
  }

  assertTransferAmount(transfer, order, limits.cap);
  return assertPaymentWindow(rawData);
}

export async function craftEnergyRentTransaction(
  logger: Logger,
  config: TronCoinConfig,
  request: EnergyRentRequest,
): Promise<VerifiedEnergyRentOrder> {
  // Read before ordering, so a missing payee list never leaves an order behind.
  const limits = { payees: tronifyPaymentAddresses(config), cap: maxRentBaseUnits(logger, config) };
  let orderId: string | undefined;
  try {
    const approved = approvedCost(request);
    const order = await getEnergyProvider(config).createOrder(logger, config, request);
    orderId = order.orderId;
    assertOrderWithinApprovedCost(approved, order, limits.cap);
    const paymentExpiresAt = await assertSignableTransferMatchesRequest(request, order, limits);
    return { ...order, paymentExpiresAt };
  } catch (error) {
    // Flags payments refused before signing; a failed Tronify call carries no rule.
    if (error instanceof TronifyApiError && error.rule) {
      logger("tron/energyRent", "rent payment rejected before signing", {
        rule: error.rule,
        orderId: orderId ?? error.orderId,
      });
    }
    throw error;
  }
}

export function broadcastEnergyRentTransaction(
  logger: Logger,
  config: TronCoinConfig,
  payment: { orderId: string; signedTransaction: EnergyRentSignedTransaction },
): Promise<void> {
  return getEnergyProvider(config).submitPayment(logger, config, payment);
}

export function getEnergyRentStatus(
  logger: Logger,
  config: TronCoinConfig,
  order: EnergyRentOrderRef,
): Promise<EnergyRentStatus> {
  return getEnergyProvider(config).getOrderStatus(logger, config, order);
}

// Identity-checked deadline marker for countPollError; never escapes this module.
const POLL_DEADLINE_REACHED = new Error("energy-rent-poll-deadline");

// Enforced even mid-request: otherwise a hung status call would keep the poll pending forever.
function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const expiry = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(POLL_DEADLINE_REACHED), ms);
  });
  return Promise.race([promise, expiry]).finally(() => clearTimeout(timer)) as Promise<T>;
}

const energyDeliveryTimeout = (paymentTxId?: string, cause?: unknown) =>
  new EnergyDelegationTimeoutError("Energy delivery timed out", {
    paymentTxId,
    ...(cause !== undefined ? { cause } : {}),
  });

/** Budget exhaustion surfaces as the timeout, not a failure, so a retry never charges a second
 * rental (LIVE-32780 AC2). */
function countPollError(
  error: unknown,
  consecutiveErrors: number,
  maxConsecutiveErrors: number,
  paymentTxId?: string,
): number {
  if (error === POLL_DEADLINE_REACHED) throw energyDeliveryTimeout(paymentTxId);
  const next = consecutiveErrors + 1;
  if (next > maxConsecutiveErrors) throw energyDeliveryTimeout(paymentTxId, error);
  return next;
}

/** Polls `getStatus` until delivered/failed/timeout. Tolerates up to `maxConsecutiveErrors`
 * transient failures in a row so a status blip doesn't abandon an already-paid rental. */
export async function awaitEnergyDeliveryWith(
  getStatus: () => Promise<EnergyRentStatus>,
  opts?: {
    intervalMs?: number;
    timeoutMs?: number;
    paymentTxId?: string;
    maxConsecutiveErrors?: number;
    signal?: AbortSignal;
  },
): Promise<void> {
  const intervalMs = opts?.intervalMs ?? ENERGY_RENT_POLL_INTERVAL_MS;
  const timeoutMs = opts?.timeoutMs ?? ENERGY_RENT_POLL_TIMEOUT_MS;
  const maxConsecutiveErrors =
    opts?.maxConsecutiveErrors ?? ENERGY_RENT_POLL_MAX_CONSECUTIVE_ERRORS;
  const deadline = Date.now() + timeoutMs;
  const remaining = () => deadline - Date.now();
  const nextDelay = () => delay(Math.min(intervalMs, Math.max(remaining(), 0)));

  let consecutiveErrors = 0;
  for (;;) {
    // Abort (reset/unmount) stops before the next read and skips the on-chain reconciliation a timeout triggers.
    if (opts?.signal?.aborted) throw new EnergyDeliveryAbortedError();
    if (remaining() <= 0) throw energyDeliveryTimeout(opts?.paymentTxId);

    let status: EnergyRentStatus;
    try {
      status = await withDeadline(getStatus(), remaining());
    } catch (error) {
      consecutiveErrors = countPollError(
        error,
        consecutiveErrors,
        maxConsecutiveErrors,
        opts?.paymentTxId,
      );
      await nextDelay();
      continue;
    }

    consecutiveErrors = 0;
    if (status === "delivered") return;
    if (status === "failed") throw new TronifyApiError("Energy rent order failed");
    await nextDelay();
  }
}

/** `EnergyLimit − EnergyUsed`, clamped at 0. Delegated-in energy raises `EnergyLimit` (Stake 2.0), so this
 * is the delivery authority (ADR-058 C4). */
async function getOnChainEnergyAvailable(
  logger: Logger,
  config: TronCoinConfig,
  address: string,
): Promise<BigNumber> {
  const info = await getTronAccountNetwork(logger, config, address);
  return BigNumber.maximum(0, info.energyLimit.minus(info.energyUsed));
}

/** Resolve once the receiver's on-chain energy covers `energyNeeded` (ADR-058 C4); the threshold starts
 * unmet since only an energy-deficient sender is offered this. The provider only fails fast on `failed`. */
export function awaitEnergyDelivery(
  logger: Logger,
  config: TronCoinConfig,
  ref: EnergyRentOrderRef,
  target: { receiverAddress: string; energyNeeded: bigint },
  opts?: { intervalMs?: number; timeoutMs?: number; paymentTxId?: string; signal?: AbortSignal },
): Promise<void> {
  const needed = new BigNumber(target.energyNeeded.toString());
  return awaitEnergyDeliveryWith(async () => {
    // On-chain is the sole authority for "delivered"; short-circuits the advisory provider call.
    const available = await getOnChainEnergyAvailable(logger, config, target.receiverAddress);
    if (available.gte(needed)) return "delivered";
    // Provider is advisory: only explicit "failed" counts, so its downtime can't abort a real delivery.
    try {
      const status = await getEnergyRentStatus(logger, config, ref);
      return status === "failed" ? "failed" : "pending";
    } catch {
      return "pending";
    }
  }, opts);
}

/** One-shot {@link awaitEnergyDelivery} gate for the reconcile paths. */
export async function isEnergyDeliveredOnChain(
  logger: Logger,
  config: TronCoinConfig,
  target: { receiverAddress: string; energyNeeded: bigint },
): Promise<boolean> {
  const available = await getOnChainEnergyAvailable(logger, config, target.receiverAddress);
  return available.gte(new BigNumber(target.energyNeeded.toString()));
}
