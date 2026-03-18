/**
 * Checks if the given EVM RPC error response has a specific RPC error code.
 *
 * @param error EVM node response
 * @param code RPC error code to check for (e.g. "INSUFFICIENT_FUNDS" or "UNSUPPORTED_OPERATION")
 */
export function hasErrorCode(error: unknown, code: string): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return Reflect.get(error, "code") === code;
}

/**
 * Checks if the given EVM RPC error response indicates that the called RPC method is unsupported by the node.
 *
 * - -32601 / method_not_found: method not implemented
 * - -32605: method not available on current plan (e.g. QuickNode "debug and trace methods are not supported")
 * - -32053: API key / plan cannot access the method (e.g. trace_block)
 *
 * @param error EVM node response
 */
export function isUnsupportedRpcMethodError(error: unknown): boolean {
  const unsupportedCodes = new Set(["-32601", "method_not_found", "-32605", "-32053"]);
  return collectRpcErrorFields(error).codes.some(code => unsupportedCodes.has(code));
}

/**
 * call this function when RPC returns a generic code, like -32000 which can be used for different errors
 */
export function isUnsupportedRpcMethodErrorMsg(error: unknown): boolean {
  const marker = "required historical state unavailable";
  return collectRpcErrorFields(error).messages.some(m => m.toLowerCase().includes(marker));
}

/**
 * Verify that an error is a rate limit sent by a rpc node
 *
 * Error format is not the same for all providers so this function may not handle other kind of rate limit
 *
 * @param error error received in a try catch
 * @returns true if the error is in a known rate limit format, false otherwise
 */
export function isRateLimitRpcMethodError(error: unknown): boolean {
  const unsupportedCodes = new Set(["-32012", "-32029"]);
  return collectRpcErrorFields(error).codes.some(code => unsupportedCodes.has(code));
}

/**
 * Returns true when ethers has already exhausted its internal HTTP retries for a 429 rate-limit.
 *
 * Ethers typically surfaces this as a `responseStatus` string containing "exceeded maximum retry limit".
 *
 * @param error error received in a try catch
 * @returns true if the error is come from EthersJs, false otherwise
 */
export function hasEthersRetriedOnRateLimit(error: unknown): boolean {
  return collectRpcErrorFields(error).responseStatuses.some(status =>
    status.toLowerCase().includes("exceeded maximum retry limit"),
  );
}

function extractRpcErrorCode(key: string, field: unknown): string | null {
  if (key === "code") {
    return normalizeRpcErrorCode(field);
  }
  return null;
}

function extractRpcErrorMessage(key: string, field: unknown): string | null {
  if (key === "message" && typeof field === "string") {
    return field;
  }
  return null;
}

/** Walks nested RPC / ethers error shapes once; collects `code`, `message` and `responseStatus` fields (incl. JSON in `responseBody`). */
function collectRpcErrorFields(error: unknown): {
  codes: string[];
  messages: string[];
  responseStatuses: string[];
} {
  const codes = new Set<string>();
  const messages: string[] = [];
  const responseStatuses: string[] = [];
  const visited = new WeakSet<object>();

  const visit = (value: unknown): void => {
    if (typeof value !== "object" || value === null || visited.has(value)) {
      return;
    }
    visited.add(value);

    for (const [key, field] of Object.entries(value)) {
      const code = extractRpcErrorCode(key, field);
      if (code) {
        codes.add(code);
      }

      const message = extractRpcErrorMessage(key, field);
      if (message) {
        messages.push(message);
      }

      // Some providers wrap RPC error payloads in a stringified response body.
      if (key === "responseBody" && typeof field === "string") {
        try {
          visit(JSON.parse(field));
        } catch {
          // ignore malformed response body
        }
      } else if (key === "responseStatus" && typeof field === "string") {
        responseStatuses.push(field);
      } else {
        visit(field);
      }
    }
  };

  visit(error);
  return { codes: Array.from(codes), messages, responseStatuses };
}

function normalizeRpcErrorCode(code: unknown): string | null {
  if (typeof code === "number") {
    return String(code);
  }
  if (typeof code === "string") {
    return code.toLowerCase();
  }
  return null;
}
