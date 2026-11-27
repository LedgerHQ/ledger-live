import type {
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import {
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
  NotEnoughBalanceInParentAccount,
  NotEnoughSpendableBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { pinConfig, type CantonCoinConfig, type CantonContext } from "../config";
import {
  CANTON_UNSET_RECIPIENT,
  TO_MANY_UTXOS_CRITICAL_COUNT,
  TO_MANY_UTXOS_WARNING_COUNT,
} from "../constants";
import {
  getBalance,
  getNativeInstrument,
  getPartyByIdCached,
  isTopologyChangeRequiredCached,
} from "../network/gateway";
import {
  CantonInvalidConfigError,
  TooManyUtxosCritical,
  TooManyUtxosWarning,
  TopologyChangeError,
} from "../types/errors";
import type { InstrumentBalance } from "../types/gateway";
import type { CantonMemo } from "../types/transaction";
import { assetInstrument, type Instrument, instrumentOf, isInstrument } from "./asset";
import { estimateFees, estimateSendMax } from "./estimateFees";
import { isRecipientValid, minReserveOf } from "./utils";

type CantonIntent = TransactionIntent<CantonMemo>;

type Spend = {
  amount: bigint;
  fees: bigint;
  totalSpent: bigint;
  isToken: boolean;
  isSendMax: boolean;
};

type Holding = { total: bigint; spendable: bigint };

const NOTHING_HELD: Holding = { total: 0n, spendable: 0n };

const holdingOf = (components: Balance[]): Holding =>
  components.reduce(
    (held, { value, locked }) => ({
      total: held.total + value,
      spendable: held.spendable + value - (locked ?? 0n),
    }),
    NOTHING_HELD,
  );

// Without an admin, a token held under several admins is ambiguous, so nothing counts as held.
function tokenHolding(balances: Balance[], target: Instrument, nativeInstrumentId: string) {
  const components = balances.flatMap(balance => {
    const instrument =
      balance.asset.type !== "native" && assetInstrument(balance.asset, nativeInstrumentId);
    return instrument && isInstrument(target, instrument.instrumentId, instrument.instrumentAdmin)
      ? [{ balance, admin: instrument.instrumentAdmin }]
      : [];
  });
  const admins = new Set(components.map(({ admin }) => admin));
  return admins.size === 1 ? holdingOf(components.map(({ balance }) => balance)) : NOTHING_HELD;
}

const formatReserve = (config: CantonCoinConfig, reserve: bigint): string =>
  formatCurrencyUnit(config.unit, new BigNumber(reserve.toString()), {
    disableRounding: true,
    useGrouping: false,
    showCode: true,
  });

function recipientError(recipient: string, currencyName: string): Error | undefined {
  if (!recipient) return new RecipientRequired("");
  if (!isRecipientValid(recipient)) return new InvalidAddress("", { currencyName });
  return undefined;
}

// The parent pays a token's fee; a prepared native amount, 0 included, is kept, as it is the one crafted.
async function sendMaxOf(
  context: CantonContext,
  intent: CantonIntent,
  sent: Holding,
  customFees: FeeEstimation | undefined,
  isToken: boolean,
): Promise<{ amount: bigint; fees: bigint }> {
  if (isToken) return { amount: sent.spendable, fees: customFees?.value ?? 0n };
  const isPrepared = intent.amount > 0n || customFees?.parameters?.amount !== undefined;
  if (isPrepared) {
    return { amount: intent.amount, fees: await estimateFees(context, intent.amount) };
  }
  const max = await estimateSendMax(context, sent.spendable);
  return { amount: max.amount, fees: max.fee };
}

async function amountError(
  context: CantonContext,
  recipient: string,
  { amount, fees, totalSpent, isToken, isSendMax }: Spend,
  native: Holding,
  available: bigint,
): Promise<Error | undefined> {
  if (isToken && fees > native.spendable) return new NotEnoughBalanceInParentAccount();
  if (amount <= 0n) return isSendMax ? new NotEnoughBalance() : new AmountRequired();
  if (totalSpent > available) return new NotEnoughBalance();
  if (isToken) return undefined;

  const config = await context.config();
  const reserve = await minReserveOf(context);
  if (totalSpent > native.total - reserve) {
    return new NotEnoughSpendableBalance("", { minimumAmount: formatReserve(config, reserve) });
  }
  if (recipient && amount < reserve) {
    return new NotEnoughBalanceBecauseDestinationNotCreated("", {
      minimalAmount: formatReserve(config, reserve),
    });
  }
  return undefined;
}

// A network failure degrades to the fallback; an invalid config must surface.
const bestEffort =
  <T>(fallback: T) =>
  (error: unknown): T => {
    if (error instanceof CantonInvalidConfigError) throw error;
    return fallback;
  };

const countsUtxos = ({ recipient, sender }: CantonIntent): boolean =>
  !!recipient &&
  isRecipientValid(recipient) &&
  recipient !== sender &&
  !recipient.includes(CANTON_UNSET_RECIPIENT);

// The counts sync stores on the account don't reach validateIntent, so the gateway is read instead; a failed read gives no warning.
async function utxoWarning(
  context: CantonContext,
  intent: CantonIntent,
  target: Instrument,
): Promise<Error | undefined> {
  if (!countsUtxos(intent)) return undefined;
  const [rows, counted] = await Promise.all([
    getBalance(context, intent.sender).catch(bestEffort<InstrumentBalance[]>([])),
    intent.asset.type === "native"
      ? getNativeInstrument(context).catch(bestEffort(undefined))
      : target,
  ]);
  if (!counted) return undefined;
  const count = rows
    // The gateway picks transfer inputs from unlocked holdings only.
    .filter(row => !row.locked && isInstrument(counted, row.instrument_id, row.admin_id))
    .reduce((sum, row) => sum + row.utxo_count, 0);
  if (count > TO_MANY_UTXOS_CRITICAL_COUNT) return new TooManyUtxosCritical();
  if (count > TO_MANY_UTXOS_WARNING_COUNT) {
    return new TooManyUtxosWarning("families.canton.tooManyUtxos.warning");
  }
  return undefined;
}

// The public key the bridge stores on the account doesn't reach validateIntent, so a party lookup supplies it.
// Best effort, as in the bridge: a failed lookup skips the check, unless the gateway no longer knows the party.
async function topologyError(context: CantonContext, party: string): Promise<Error | undefined> {
  let publicKey: string | undefined;
  try {
    ({ public_key: publicKey } = await getPartyByIdCached(context, party));
  } catch (error) {
    if (error instanceof CantonInvalidConfigError) throw error;
    return error instanceof TopologyChangeError ? error : undefined;
  }
  if (!publicKey) return undefined;
  const required = await isTopologyChangeRequiredCached(context, publicKey).catch(
    bestEffort(false),
  );
  return required
    ? new TopologyChangeError("Topology change detected. Re-onboarding required.")
    : undefined;
}

export async function validateIntent(
  context: CantonContext,
  intent: CantonIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const config = await context.config();
  const pinned = pinConfig(context, config);
  const target = instrumentOf(intent.asset, config.nativeInstrumentId);
  const isToken = intent.asset.type !== "native";
  const isSendMax = !!intent.useAllAmount;
  const native = holdingOf(balances.filter(({ asset }) => asset.type === "native"));
  const sent = isToken ? tokenHolding(balances, target, config.nativeInstrumentId) : native;
  const { amount, fees } = isSendMax
    ? await sendMaxOf(pinned, intent, sent, customFees, isToken)
    : { amount: intent.amount, fees: customFees?.value ?? 0n };
  const spend: Spend = {
    amount,
    fees,
    totalSpent: isToken ? amount : amount + fees,
    isToken,
    isSendMax,
  };

  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!isToken && amount > 0n && fees * 10n > amount) warnings.feeTooHigh = new FeeTooHigh();
  // 0n is a real estimate (the config forces `fee: 0`), so only an absent fee is not loaded; the generic adapter always passes one.
  if (!customFees) errors.fee = new FeeNotLoaded();

  const recipient = recipientError(intent.recipient, config.name);
  if (recipient) errors.recipient = recipient;
  const amountProblem = await amountError(pinned, intent.recipient, spend, native, sent.spendable);
  if (amountProblem) errors.amount = amountProblem;

  const [tooManyUtxos, topologyChange] = await Promise.all([
    utxoWarning(pinned, intent, target),
    topologyError(pinned, intent.sender),
  ]);
  if (tooManyUtxos) warnings.tooManyUtxos = tooManyUtxos;
  if (topologyChange) errors.topologyChange = topologyChange;

  return { errors, warnings, estimatedFees: fees, amount, totalSpent: spend.totalSpent };
}
