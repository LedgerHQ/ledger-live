import type { TraceBlockItem, TraceBlockOtherAction, TraceBlockResult } from "./types";

/**
 * Geth `debug_traceBlockByNumber` with `callTracer` returns one entry per transaction (same order as
 * the block). Each element must be `{ txHash, result }` (or `{ transactionHash, result }`) where `result`
 * is the call tree root object. Entries that wrap a tx hash but have a missing, null, undefined, or
 * non-object `result` are treated as errors to avoid silently dropping transaction traces.
 *
 * @see https://geth.ethereum.org/docs/developers/evm-tracing/built-in-tracers#call-tracer
 */
export type GethCallFrame = {
  type?: string;
  from?: string;
  to?: string;
  value?: string;
  gas?: string;
  gasUsed?: string;
  input?: string;
  output?: string;
  error?: string;
  revertReason?: string;
  calls?: GethCallFrame[];
};

export function gethCallTracerToTraceBlockItems(
  blockNumber: number,
  /** `debug_traceBlockByNumber` JSON-RPC `result` — one element per tx in block order */
  debugTraceResults: readonly unknown[],
): TraceBlockItem[] {
  return debugTraceResults
    .flatMap((entry, txPos) => {
      const parsed = parseDebugTraceBlockEntry(entry, txPos);
      if (parsed === null) return [];
      return flattenCallFrame(parsed.root, [], blockNumber, parsed.txHash, txPos);
    })
    .filter(item => item !== null);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function stringValue(value: unknown, orDefault: string): string {
  if (isString(value)) return value;
  return orDefault;
}

function extractTxHash(o: Record<string, unknown>): string | null {
  if (isString(o.txHash)) return o.txHash;
  if (isString(o.transactionHash)) return o.transactionHash;
  return null;
}

/**
 * @returns `null` to skip a top-level null/undefined entry, non-object entry, empty object, or
 *   unrecognized shape without a tx hash wrapper (not a bare call frame).
 * @throws When `{ txHash | transactionHash, result }` is present but `result` is missing, null,
 *   undefined, or not a plain object — avoids silently dropping a transaction trace.
 */
function parseDebugTraceBlockEntry(
  entry: unknown,
  index: number,
): { txHash: string; root: Record<string, unknown> } | null {
  if (entry === null || entry === undefined) return null;
  if (typeof entry !== "object" || entry === null) return null;
  const o = entry as Record<string, unknown>;
  const txHash = extractTxHash(o);

  if (txHash !== null) {
    if (!("result" in o)) {
      throw new Error(
        `debug_traceBlockByNumber entry at index ${index} (tx ${txHash}) is missing required "result"; expected { txHash, result }`,
      );
    }
    const inner = o.result;
    if (inner === null || inner === undefined) {
      throw new Error(
        `debug_traceBlockByNumber entry at index ${index} (tx ${txHash}) has null or undefined "result"`,
      );
    }
    if (typeof inner !== "object") {
      throw new TypeError(
        `debug_traceBlockByNumber entry at index ${index} (tx ${txHash}) has invalid "result" (expected object)`,
      );
    }

    return { txHash, root: inner as Record<string, unknown> };
  }

  if ("type" in o || "from" in o || "calls" in o) {
    throw new Error(
      `debug_traceBlockByNumber entry at index ${index} is missing txHash; expected { txHash, result }`,
    );
  }

  if (Object.keys(o).length === 0) return null;

  return null;
}

function flattenCallFrame(
  node: Record<string, unknown>,
  traceAddress: number[],
  blockNumber: number,
  transactionHash: string,
  transactionPosition: number,
): TraceBlockItem[] {
  const calls = Array.isArray(node.calls) ? node.calls : [];
  const subtraces = calls.length;
  const self = buildTraceBlockItemFromCallFrame(
    node,
    traceAddress,
    subtraces,
    blockNumber,
    transactionHash,
    transactionPosition,
  );
  const items: TraceBlockItem[] = [self];

  for (let i = 0; i < calls.length; i++) {
    const child = calls[i];
    if (child && typeof child === "object" && child !== null) {
      items.push(
        ...flattenCallFrame(
          child,
          [...traceAddress, i],
          blockNumber,
          transactionHash,
          transactionPosition,
        ),
      );
    }
  }

  return items;
}

function gethFrameTypeToItemType(gethType: string): string {
  const u = gethType.toUpperCase();
  if (u === "CALL" || u === "CALLCODE" || u === "DELEGATECALL" || u === "STATICCALL") return "call";
  if (u === "CREATE" || u === "CREATE2") return "create";
  if (u === "SELFDESTRUCT") return "suicide";
  return gethType.toLowerCase();
}

function gethFrameTypeToCallType(gethType: string): string {
  return gethType.toLowerCase();
}

/** Preserve hex wei (`0x…`); convert decimal string to hex (Erigon-style `action.value`). */
function weiValueString(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return "0x0";
  const v = value.trim();
  if (v.startsWith("0x") || v.startsWith("0X")) return v;
  try {
    return "0x" + BigInt(v).toString(16);
  } catch {
    return "0x0";
  }
}

const callTypes = ["CALL", "CALLCODE", "DELEGATECALL", "STATICCALL"];

function extractErrorMessage(node: Record<string, unknown>): string | undefined {
  if (isString(node.error)) return node.error;
  if (isString(node.revertReason)) return node.revertReason;
  return undefined;
}
function buildTraceBlockItemFromCallFrame(
  node: Record<string, unknown>,
  traceAddress: number[],
  subtraces: number,
  blockNumber: number,
  transactionHash: string,
  transactionPosition: number,
): TraceBlockItem {
  const gethType = isString(node.type) ? node.type : "UNKNOWN";
  const itemType = gethFrameTypeToItemType(gethType);
  const callType = gethFrameTypeToCallType(gethType);

  const errMsg = extractErrorMessage(node);
  let result: TraceBlockResult | null | undefined;
  let topError: string | undefined;

  if (errMsg) {
    result = null;
    topError = errMsg;
  } else {
    result = {
      gasUsed: stringValue(node.gasUsed, "0x0"),
      output: stringValue(node.output, "0x"),
    };
  }

  const from = stringValue(node.from, "");
  const to = stringValue(node.to, "");
  const value = weiValueString(node.value);

  const isCallLike = callTypes.includes(gethType.toUpperCase());

  let action: TraceBlockItem["action"];
  if (isCallLike) {
    action = {
      from,
      to,
      callType,
      value,
    };
  } else {
    const other: TraceBlockOtherAction = {
      type: itemType,
      from,
      to,
      value,
      callType,
    };
    action = other;
  }

  const item: TraceBlockItem = {
    action,
    result,
    blockNumber,
    transactionHash,
    transactionPosition,
    traceAddress: [...traceAddress],
    subtraces,
    type: itemType,
  };

  if (topError) {
    item.error = topError;
  }

  return item;
}
