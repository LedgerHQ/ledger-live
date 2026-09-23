import type { Logger } from "@ledgerhq/coin-module-framework/config";
import BigNumber from "bignumber.js";
import type { TronCoinConfig } from "../../config";
import {
  EnergyDelegationTimeoutError,
  EnergyRentProviderNotConfigured,
  TronifyApiError,
} from "../../types/errors";
import {
  ENERGY_RENT_POLL_INTERVAL_MS,
  ENERGY_RENT_POLL_MAX_CONSECUTIVE_ERRORS,
  ENERGY_RENT_POLL_TIMEOUT_MS,
} from "../constants";
import { getTronifyConfig } from "../../network/tronify";
import { decode58Check } from "../../network/format";
import { getTronAccountNetwork } from "../../network";
import { decodeTransaction } from "../utils";
import { tronifyProvider } from "./tronify";
import type {
  EnergyProvider,
  EnergyRentOrder,
  EnergyRentOrderRef,
  EnergyRentQuote,
  EnergyRentRequest,
  EnergyRentSignedTransaction,
  EnergyRentStatus,
} from "./types";

export * from "./types";

/** Resolve the energy-rent provider selected in coin-config (the single provider dispatch point). */
export function getEnergyProvider(config: TronCoinConfig): EnergyProvider {
  const energyRent = config.energyRent;
  if (!energyRent) {
    throw new EnergyRentProviderNotConfigured("No energy-rent provider configured");
  }
  if (energyRent.provider === "tronify") {
    // Name alone is not proof of configuration: this gate opens raw-signing (craftRawTransaction), so
    // reject an under-configured provider here — getTronifyConfig throws unless url + sourceFlag exist.
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

/**
 * Reject an order that would charge more than the amount already approved. Pricing
 * (`getQuote`) and ordering (`createOrder`) are independent provider calls that each return their
 * own `payCoinAmt`, so without this the device could be handed payment bytes for a different (or
 * arbitrarily larger) sum than the one the user agreed to, with the device screen as the only
 * remaining backstop. No ceiling on the request means no approved amount to check against.
 */
function assertOrderWithinApprovedCost(request: EnergyRentRequest, order: EnergyRentOrder): void {
  const { maxPayCoinAmt, maxPayCoinCode } = request;
  if (maxPayCoinAmt === undefined) return;

  // Fail closed on a ceiling amount with no coin code: an amount alone means nothing across
  // denominations, so a provider could price the order in a cheaper-looking coin and slip under it.
  if (maxPayCoinCode === undefined) {
    throw new TronifyApiError(
      `Energy-rent cost ceiling "${maxPayCoinAmt}" has no approved coin code to compare against`,
    );
  }
  // Case-insensitive: the approved code is normalized to upper case at the ceiling's source
  // (buildEnergyRentRequest), so a differently-cased order code from the provider must not
  // false-mismatch a genuinely matching denomination.
  if (String(order.payCoinCode).toUpperCase() !== maxPayCoinCode.toUpperCase()) {
    throw new TronifyApiError(
      `Energy-rent order is priced in ${String(order.payCoinCode)}, but ${maxPayCoinCode} was approved`,
    );
  }

  const approved = new BigNumber(maxPayCoinAmt);
  const charged = new BigNumber(order.payCoinAmt);
  // An unparseable amount is not "within budget" — a non-numeric payCoinAmt would otherwise slip
  // through every comparison below as false.
  if (!approved.isFinite() || !charged.isFinite() || charged.isNegative()) {
    throw new TronifyApiError(
      `Cannot verify energy-rent cost: approved "${maxPayCoinAmt}", order returned "${order.payCoinAmt}"`,
    );
  }
  if (charged.isGreaterThan(approved)) {
    throw new TronifyApiError(
      `Energy-rent order costs ${order.payCoinAmt}, above the approved ${maxPayCoinAmt}`,
    );
  }
}

/** Sun per TRX — a TransferContract's `amount` is native TRX expressed in sun. */
const SUN_PER_TRX = 1_000_000;

/**
 * Verify the bytes the device will actually sign encode the approved TRX rent payment.
 * `assertOrderWithinApprovedCost` checks only the provider-declared `payCoinAmt`/`payCoinCode`
 * metadata, not the `raw_data_hex` that `craftRawTransaction` hands to the signer verbatim, so
 * decode the bytes and bind them to the approved request here.
 *
 * coin-tron supports only TRX-denominated rent (estimateTronifyFees/buildEnergyRentRequest reject a
 * non-TRX quote), so the payment must be exactly one native-TRX `TransferContract`, spending from
 * the approved payer, for no more TRX than the approved cost. Anything else fails closed.
 */
async function assertSignableTransferMatchesRequest(
  request: EnergyRentRequest,
  order: EnergyRentOrder,
): Promise<void> {
  const rawDataHex = order.transaction?.raw_data_hex;
  if (typeof rawDataHex !== "string" || rawDataHex.length === 0) {
    throw new TronifyApiError(
      "Energy-rent order carries no raw transaction to verify before signing",
    );
  }

  type DecodedContract = {
    type?: string;
    parameter?: { value?: { owner_address?: string; amount?: string | number } };
  };
  let contracts: DecodedContract[];
  try {
    const decoded = await decodeTransaction(rawDataHex);
    contracts = (decoded.raw_data?.contract as DecodedContract[] | undefined) ?? [];
  } catch {
    throw new TronifyApiError(
      "Could not decode the energy-rent payment transaction for verification",
    );
  }

  if (contracts.length !== 1 || contracts[0]?.type !== "TransferContract") {
    const shape =
      contracts.length === 1 ? String(contracts[0]?.type) : `${contracts.length} contract(s)`;
    throw new TronifyApiError(
      `Energy-rent payment must be a single native TRX transfer, but the signed bytes carry ${shape}`,
    );
  }

  const value = contracts[0].parameter?.value ?? {};
  // The signed bytes must spend from the approved payer. `decode58Check` and the decoder both yield
  // lower-case hex (with the 0x41 prefix), so compare directly.
  const signedOwner = (value.owner_address ?? "").toLowerCase();
  const approvedOwner = decode58Check(request.payerAddress).toLowerCase();
  if (signedOwner !== approvedOwner) {
    throw new TronifyApiError(
      "Energy-rent payment is signed from a different owner than the approved payer",
    );
  }

  // …and move no more TRX than approved. `order.payCoinAmt` is already bounded by the request
  // ceiling (assertOrderWithinApprovedCost); this binds the actual signed sun amount to it.
  const signedSun = new BigNumber(value.amount ?? "");
  const approvedSun = new BigNumber(order.payCoinAmt).multipliedBy(SUN_PER_TRX);
  if (!signedSun.isFinite() || signedSun.isNegative() || !approvedSun.isFinite()) {
    throw new TronifyApiError(
      `Cannot verify energy-rent payment amount: signed "${String(value.amount)}", approved "${order.payCoinAmt}"`,
    );
  }
  if (signedSun.isGreaterThan(approvedSun)) {
    throw new TronifyApiError(
      `Energy-rent payment moves ${signedSun.toFixed()} sun, above the approved ${approvedSun.toFixed()} sun`,
    );
  }
}

export async function craftEnergyRentTransaction(
  logger: Logger,
  config: TronCoinConfig,
  request: EnergyRentRequest,
): Promise<EnergyRentOrder> {
  const order = await getEnergyProvider(config).createOrder(logger, config, request);
  assertOrderWithinApprovedCost(request, order);
  await assertSignableTransferMatchesRequest(request, order);
  return order;
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

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Rejection marker for a poll that outlived the hard deadline; caught by identity below and never
 * escapes this module. An Error instance so it is a valid Promise rejection reason. */
const POLL_DEADLINE_REACHED = new Error("energy-rent-poll-deadline");

/**
 * The deadline is enforced even while the request is in flight — a hung status call would otherwise
 * keep the poll pending forever and the hard timeout would never fire. The timer is cleared once
 * the race settles so nothing stays scheduled.
 */
function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const expiry = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(POLL_DEADLINE_REACHED), ms);
  });
  return Promise.race([promise, expiry]).finally(() => clearTimeout(timer)) as Promise<T>;
}

/**
 * Poll an energy-rent order until the delegated energy is delivered on-chain. Resolves on
 * "delivered"; throws TronifyApiError on "failed"; throws EnergyDelegationTimeoutError once the
 * hard timeout passes — including while a status request is still in flight. `getStatus` is
 * injected so callers/tests can drive it without the network.
 *
 * The caller has already paid for the rental by the time we poll, so a transient status failure
 * must not abandon it: rejections are tolerated up to `maxConsecutiveErrors` in a row (reset by any
 * successful read) and only then surfaced. An explicit "failed" status is a verdict, not a blip,
 * and still throws immediately.
 */
export async function awaitEnergyDeliveryWith(
  getStatus: () => Promise<EnergyRentStatus>,
  opts?: {
    intervalMs?: number;
    timeoutMs?: number;
    paymentTxId?: string;
    maxConsecutiveErrors?: number;
  },
): Promise<void> {
  const intervalMs = opts?.intervalMs ?? ENERGY_RENT_POLL_INTERVAL_MS;
  const timeoutMs = opts?.timeoutMs ?? ENERGY_RENT_POLL_TIMEOUT_MS;
  const maxConsecutiveErrors =
    opts?.maxConsecutiveErrors ?? ENERGY_RENT_POLL_MAX_CONSECUTIVE_ERRORS;
  const deadline = Date.now() + timeoutMs;
  const timedOut = () =>
    new EnergyDelegationTimeoutError("Energy delivery timed out", {
      paymentTxId: opts?.paymentTxId,
    });
  const remaining = () => deadline - Date.now();

  let consecutiveErrors = 0;
  for (;;) {
    if (remaining() <= 0) throw timedOut();

    let status: EnergyRentStatus;
    try {
      status = await withDeadline(getStatus(), remaining());
    } catch (error) {
      if (error === POLL_DEADLINE_REACHED) throw timedOut();
      if (++consecutiveErrors >= maxConsecutiveErrors) throw error;
      await delay(Math.min(intervalMs, Math.max(remaining(), 0)));
      continue;
    }

    consecutiveErrors = 0;
    if (status === "delivered") return;
    if (status === "failed") throw new TronifyApiError("Energy rent order failed");
    await delay(Math.min(intervalMs, Math.max(remaining(), 0)));
  }
}

/**
 * On-chain energy available to `address` right now: `EnergyLimit − EnergyUsed` from
 * `/wallet/getaccountresource`, clamped at 0. On TRON (Stake 2.0) energy delegated *to* an account
 * raises that account's `EnergyLimit` — a delegatee uses the resource without staking itself — so a
 * receiver of a Tronify delegation sees its available energy rise here once the on-chain
 * `DelegateResourceContract` lands. Verified against TRON developer docs (resource-model /
 * getaccountresource); the provider order-status API is advisory only (ADR-058 C4).
 */
async function getOnChainEnergyAvailable(
  logger: Logger,
  config: TronCoinConfig,
  address: string,
): Promise<BigNumber> {
  const info = await getTronAccountNetwork(logger, config, address);
  return BigNumber.maximum(0, info.energyLimit.minus(info.energyUsed));
}

/**
 * Gate energy delivery on the receiver's on-chain resource state, not the provider API. Resolves once
 * `receiverAddress`'s available energy covers `energyNeeded` (the transfer's full requirement, from
 * `buildEnergyRentRequest`). The sponsored option is only ever offered to an energy-deficient sender,
 * so the threshold starts unmet and its crossing is positive proof the delegation landed and TX-C
 * will burn rented energy rather than TRX (LIVE-32780 AC2). The provider's `getOrderStatus` is
 * consulted only to fail fast on an explicit `failed`; it never confirms delivery — the status API is
 * advisory and its lifecycle mapping still carries an [assumption] (ADR-058 C4 / decision #2).
 */
export function awaitEnergyDelivery(
  logger: Logger,
  config: TronCoinConfig,
  ref: EnergyRentOrderRef,
  target: { receiverAddress: string; energyNeeded: bigint },
  opts?: { intervalMs?: number; timeoutMs?: number; paymentTxId?: string },
): Promise<void> {
  const needed = new BigNumber(target.energyNeeded.toString());
  return awaitEnergyDeliveryWith(async () => {
    // On-chain is the sole authority for "delivered": check it first and short-circuit so the
    // advisory provider call is skipped once the energy is present.
    const available = await getOnChainEnergyAvailable(logger, config, target.receiverAddress);
    if (available.gte(needed)) return "delivered";
    // Still not on-chain: consult the provider only to surface an explicit failure early. Every other
    // provider status — including its own "delivered"/"complete" — is treated as still pending, so
    // the on-chain read remains the only thing that releases TX-C. The provider is advisory, so its
    // own unavailability must not abort a delivery the on-chain read would confirm: a thrown status
    // call is swallowed to "pending" rather than counting toward awaitEnergyDeliveryWith's error
    // budget, leaving the on-chain read (or an explicit "failed") the only outcomes it drives.
    try {
      const status = await getEnergyRentStatus(logger, config, ref);
      return status === "failed" ? "failed" : "pending";
    } catch {
      return "pending";
    }
  }, opts);
}

/**
 * One-shot version of the gate above: does `receiverAddress` already hold enough on-chain energy to
 * cover `energyNeeded`? Same authority (getaccountresource) as the poll, for the reconciliation paths
 * that must confirm delivery without polling — so the provider's advisory "delivered" never releases
 * TX-C on its own (LIVE-32780 AC2 / ADR-058 C4).
 */
export async function isEnergyDeliveredOnChain(
  logger: Logger,
  config: TronCoinConfig,
  target: { receiverAddress: string; energyNeeded: bigint },
): Promise<boolean> {
  const available = await getOnChainEnergyAvailable(logger, config, target.receiverAddress);
  return available.gte(new BigNumber(target.energyNeeded.toString()));
}
