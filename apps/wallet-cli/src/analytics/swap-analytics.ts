import { randomUUID } from "node:crypto";
import { track } from "./segment";

const QUOTE = "Swap - Quote";
const EXECUTE = "Swap - Execute";
const STATUS = "Swap - Status";

export function swapFlowId(): string {
  return randomUUID();
}

export function trackSwapQuoteRequested(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  deviceRequired?: boolean;
}): void {
  track("swapquote_requested", {
    page: QUOTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    deviceRequired: p.deviceRequired ?? false,
  });
}

export function trackSwapQuoteReturned(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  providersCount: number;
}): void {
  track("swapquote_returned", {
    page: QUOTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    providersCount: p.providersCount,
  });
}

export function trackSwapSimulated(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  provider: string;
}): void {
  track("swap_simulated", {
    page: EXECUTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    provider: p.provider,
  });
}

export function trackSwapFailed(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  errorCode: string;
}): void {
  track("swap_failed", {
    page: EXECUTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    errorCode: p.errorCode,
  });
}

export function trackSwapStarted(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  provider: string;
  feeStrategy: string;
}): void {
  track("swap_started", {
    page: EXECUTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    provider: p.provider,
    feeStrategy: p.feeStrategy,
  });
}

export function trackSwapCompleted(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  provider: string;
  fromAmount: string;
  toAmount?: string;
}): void {
  track("swap_completed", {
    page: EXECUTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    provider: p.provider,
    fromAmount: p.fromAmount,
    toAmount: p.toAmount,
  });
}

export function trackSwapRejected(p: {
  flowId: string;
  fromCurrency: string;
  toCurrency: string;
  device?: string;
}): void {
  track("swap_rejected", {
    page: EXECUTE,
    flowId: p.flowId,
    fromCurrency: p.fromCurrency,
    toCurrency: p.toCurrency,
    device: p.device,
  });
}

export function trackSwapStatusPolled(p: {
  flowId: string;
  swapId: string;
  provider: string;
}): void {
  track("swapstatus_polled", {
    page: STATUS,
    flowId: p.flowId,
    swapId: p.swapId,
    provider: p.provider,
  });
}
