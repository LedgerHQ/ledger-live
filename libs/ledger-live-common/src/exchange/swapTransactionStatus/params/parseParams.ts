import type { SwapStatus } from "../../swap/types";
import type {
  SwapTransactionStatusParseResult,
  SwapTransactionStatusParamsError,
  SwapTransactionStatusRawParams,
} from "../types";
import { isTransactionStatusValue } from "../status/statusValues";

const ALLOWED_REDIRECT_PROTOCOLS = new Set(["https:", "ledgerlive:", "ledgerwallet:"]);

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

  if (!ALLOWED_REDIRECT_PROTOCOLS.has(parsed.protocol)) {
    return undefined;
  }
  return trimmed;
}

export function isValidSwapStatus(status: string): status is SwapStatus["status"] {
  return isTransactionStatusValue(status);
}

export function parseSwapTransactionStatusParams(
  raw: SwapTransactionStatusRawParams,
): SwapTransactionStatusParseResult {
  const swapId = raw.swapId?.trim();
  if (!swapId) {
    return error("missing_swap_id", "Missing swapId", raw.swapId);
  }

  return {
    ok: true,
    params: {
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
