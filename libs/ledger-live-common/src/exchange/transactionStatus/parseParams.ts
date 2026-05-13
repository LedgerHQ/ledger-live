import type { SwapStatus } from "../swap/types";
import type {
  SwapTransactionStatusParseResult,
  SwapTransactionStatusParamsError,
  SwapTransactionStatusRawParams,
} from "./types";

const VALID_SWAP_STATUSES: ReadonlySet<SwapStatus["status"]> = new Set([
  "pending",
  "onhold",
  "expired",
  "finished",
  "refunded",
  "unknown",
]);

function error(
  code: SwapTransactionStatusParamsError["code"],
  message: string,
  value?: string,
): SwapTransactionStatusParseResult {
  return { ok: false, error: { code, message, value } };
}

export function sanitizeRedirectUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return undefined;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "ledgerlive:") {
    return undefined;
  }
  return trimmed;
}

export function isValidSwapStatus(status: string): status is SwapStatus["status"] {
  return VALID_SWAP_STATUSES.has(status as SwapStatus["status"]);
}

export function parseSwapTransactionStatusParams(
  raw: SwapTransactionStatusRawParams,
): SwapTransactionStatusParseResult {
  const kind = raw.kind ?? "swap";
  if (kind !== "swap") {
    return error("unsupported_kind", "Only swap transaction status is supported", kind);
  }

  const swapId = raw.swapId?.trim();
  if (!swapId) {
    return error("missing_swap_id", "Missing swapId", raw.swapId);
  }

  return {
    ok: true,
    params: {
      kind,
      swapId,
      provider: optionalTrim(raw.provider),
      redirectUrl: sanitizeRedirectUrl(raw.redirectUrl),
    },
  };
}

function optionalTrim(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
