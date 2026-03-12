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
 * @param error EVM node response
 */
export function isUnsupportedRpcMethodError(error: unknown): boolean {
  const unsupportedCodes = new Set(["-32601", "method_not_found"]);
  return collectRpcErrorCodes(error).some(code => unsupportedCodes.has(code));
}

function collectRpcErrorCodes(error: unknown): string[] {
  const result = new Set<string>();
  const visited = new WeakSet<object>();

  const visit = (value: unknown): void => {
    if (typeof value !== "object" || value === null || visited.has(value)) {
      return;
    }
    visited.add(value);

    for (const [key, field] of Object.entries(value)) {
      if (key === "code") {
        const normalizedCode = normalizeRpcErrorCode(field);
        if (normalizedCode) {
          result.add(normalizedCode);
        }
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
  return Array.from(result);
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
