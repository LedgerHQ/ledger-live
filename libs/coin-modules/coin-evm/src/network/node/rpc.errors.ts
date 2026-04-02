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

/** Walks nested RPC / ethers error shapes once; collects `code` and `message` fields (incl. JSON in `responseBody`). */
function collectRpcErrorFields(error: unknown): { codes: string[]; messages: string[] } {
  const codes = new Set<string>();
  const messages: string[] = [];
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
      } else {
        visit(field);
      }
    }
  };

  visit(error);
  return { codes: Array.from(codes), messages };
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
