import { randomUUID } from "node:crypto";
import { track } from "./segment";

const QUOTE = "Swap - Quote";
const EXECUTE = "Swap - Execute";
const STATUS = "Swap - Status";

export function swapFlowId(): string {
  return randomUUID();
}

export async function trackSwapQuoteRequested(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  deviceRequired?: boolean;
}): Promise<void> {
  await track("swapquote_requested", {
    page: QUOTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    deviceRequired: p.deviceRequired ?? false,
  });
}

export async function trackSwapQuoteReturned(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  providersCount: number;
}): Promise<void> {
  await track("swapquote_returned", {
    page: QUOTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    providersCount: p.providersCount,
  });
}

export async function trackSwapSimulated(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  provider: string;
}): Promise<void> {
  await track("swap_simulated", {
    page: EXECUTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    provider: p.provider,
  });
}

export async function trackSwapFailed(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  errorCode: string;
}): Promise<void> {
  await track("swap_failed", {
    page: EXECUTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    errorCode: p.errorCode,
  });
}

export async function trackSwapStarted(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  provider: string;
  feeStrategy: string;
}): Promise<void> {
  await track("swap_started", {
    page: EXECUTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    provider: p.provider,
    feeStrategy: p.feeStrategy,
  });
}

export async function trackSwapCompleted(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  provider: string;
  fromAmount: string;
  toAmount?: string;
}): Promise<void> {
  await track("swap_completed", {
    page: EXECUTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    provider: p.provider,
    fromAmount: p.fromAmount,
    toAmount: p.toAmount,
  });
}

export async function trackSwapRejected(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  device?: string;
}): Promise<void> {
  await track("swap_rejected", {
    page: EXECUTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    device: p.device,
  });
}

export async function trackSwapStatusPolled(p: {
  flowId: string;
  swapId: string;
  provider: string;
}): Promise<void> {
  await track("swapstatus_polled", {
    page: STATUS,
    flowId: p.flowId,
    swapId: p.swapId,
    provider: p.provider,
  });
}
