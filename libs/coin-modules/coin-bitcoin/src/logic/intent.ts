import { BigNumber } from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import type { MemoNotSupported } from "@ledgerhq/coin-module-framework/api/types";
import { explorer as makeExplorer, type Explorer } from "../network/explorer";
import { cryptoFor } from "./currency";
import { getFeeRates, resolveFeePerByte, type FeeRates } from "./fees";
import { getReplacementContext, type ReplacementContext } from "./replacement";
import { computeShape, type ShapeInput, type TxShape } from "./shape";
import { REPLACE_CANCEL, type BitcoinContext, type BitcoinTxData } from "./types";

export type BitcoinIntent = TransactionIntent<MemoNotSupported, BitcoinTxData>;

/** The explorer of the currency's coin config, read at each call so a remote change applies. */
export async function explorerFor(context: BitcoinContext, currencyId: string): Promise<Explorer> {
  const config = await context.config(currencyId);
  return makeExplorer({
    endpoint: config.explorer.url,
    explorerId: config.explorerId ?? currencyId,
    batchSize: config.explorer.batchSize,
    feeRatesCacheTtlMs: config.fees?.feeRatesCacheTtlMs,
  });
}

export const intentData = (intent: BitcoinIntent): BitcoinTxData =>
  intent.data && intent.data.type === "bitcoin" ? intent.data : { type: "bitcoin" };

export const isCancel = (intent: BitcoinIntent): boolean => intent.type === REPLACE_CANCEL;

/** The recipient as bytes, or `undefined` while it is not a valid address of the currency. */
export function recipientScript(currencyId: string, recipient: string): Buffer | undefined {
  if (!recipient) return undefined;
  try {
    return cryptoFor(currencyId).toOutputScript(recipient);
  } catch {
    return undefined;
  }
}

export const opReturnBuffer = (data: BitcoinTxData): Buffer | undefined =>
  data.opReturnData ? Buffer.from(data.opReturnData, "hex") : undefined;

type FeeInputs = { feePerByte?: unknown; feesStrategy?: unknown };

/** Reads the fee-rate inputs of a call: the intent's own custom rate first, then the option bag. */
export function feeInputs(intent: BitcoinIntent, parameters?: Record<string, unknown>): FeeInputs {
  const data = intentData(intent);
  return {
    feePerByte: data.feePerByte ?? parameters?.feePerByte,
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- still sent by the generic bridge
    feesStrategy: parameters?.feesStrategy ?? intent.feesStrategy,
  };
}

export type ResolvedIntent = {
  data: BitcoinTxData;
  rates: FeeRates;
  feePerByte: BigNumber;
  replacement: ReplacementContext | undefined;
};

export async function resolveIntent(
  explorer: Explorer,
  currencyId: string,
  intent: BitcoinIntent,
  fees: FeeInputs,
): Promise<ResolvedIntent> {
  const data = intentData(intent);
  const [rates, replacement] = await Promise.all([
    getFeeRates(currencyId, explorer),
    data.replacement
      ? getReplacementContext(explorer, cryptoFor(currencyId), data.replacement)
      : Promise.resolve(undefined),
  ]);
  return { data, rates, feePerByte: resolveFeePerByte(rates, fees), replacement };
}

/** The intent inputs with their values, taken from the replaced transaction when not given. */
export function shapeInputs(data: BitcoinTxData, replacement?: ReplacementContext): ShapeInput[] {
  return (data.inputs ?? []).map(input => {
    const known = replacement?.original.inputs.find(
      i => i.txid === input.txid && i.vout === input.vout,
    );
    const value = input.value ?? known?.value.toString();
    if (value === undefined) {
      throw new Error(`Missing value of input ${input.txid}:${input.vout}`);
    }
    return {
      txid: input.txid,
      vout: input.vout,
      value: BigInt(value),
      address: input.address,
      path: input.path,
      blockHeight: input.blockHeight ?? null,
    };
  });
}

export function shapeOf(
  currencyId: string,
  intent: BitcoinIntent,
  resolved: ResolvedIntent,
): TxShape {
  const { data, feePerByte, rates, replacement } = resolved;
  return computeShape({
    crypto: cryptoFor(currencyId),
    derivationMode: data.derivationMode ?? "Legacy",
    inputs: shapeInputs(data, replacement),
    recipient: intent.recipient,
    amount: intent.amount,
    useAllAmount: !!intent.useAllAmount,
    opReturnData: opReturnBuffer(data),
    change: data.change,
    feePerByte,
    relayFeePerByte: rates.relay.gt(0) ? rates.relay : undefined,
    replacement,
  });
}
