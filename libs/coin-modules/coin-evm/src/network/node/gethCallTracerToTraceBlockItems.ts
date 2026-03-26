import type { TraceBlockItem, TraceBlockOtherAction, TraceBlockResult } from "./types";

/**
 * Geth `debug_traceBlockByNumber` with `callTracer` returns one entry per transaction (same order as
 * the block). Each element must be `{ txHash, result }` (or `{ transactionHash, result }`) where `result`
 * is the call tree root or `null`.
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
  const out: TraceBlockItem[] = [];

  for (let txPos = 0; txPos < debugTraceResults.length; txPos++) {
    const entry = debugTraceResults[txPos];
    const parsed = parseDebugTraceBlockEntry(entry, txPos);
    if (parsed === null) continue;

    out.push(...flattenCallFrame(parsed.root, [], blockNumber, parsed.txHash, txPos));
  }

  return out;
}

/**
 * @returns `null` to skip (null entry, null result, or empty object)
 */
function parseDebugTraceBlockEntry(
  entry: unknown,
  index: number,
): { txHash: string; root: Record<string, unknown> } | null {
  if (entry === null || entry === undefined) return null;
  if (typeof entry !== "object") return null;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const o = entry as Record<string, unknown>;

  const txHash =
    typeof o.txHash === "string"
      ? o.txHash
      : typeof o.transactionHash === "string"
        ? o.transactionHash
        : null;

  if (txHash !== null && "result" in o) {
    const inner = o.result;
    if (inner === null || inner === undefined) return null;
    if (typeof inner !== "object") {
      throw new Error(
        `debug_traceBlockByNumber entry at index ${index} has invalid result (expected object)`,
      );
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return { txHash, root: inner as Record<string, unknown> };
  }

  if (txHash === null && ("type" in o || "from" in o || "calls" in o)) {
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
    if (child && typeof child === "object") {
      items.push(
        ...flattenCallFrame(
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          child as Record<string, unknown>,
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

function buildTraceBlockItemFromCallFrame(
  node: Record<string, unknown>,
  traceAddress: number[],
  subtraces: number,
  blockNumber: number,
  transactionHash: string,
  transactionPosition: number,
): TraceBlockItem {
  const gethType = typeof node.type === "string" ? node.type : "UNKNOWN";
  const itemType = gethFrameTypeToItemType(gethType);
  const callType = gethFrameTypeToCallType(gethType);

  const errMsg =
    typeof node.error === "string" && node.error
      ? node.error
      : typeof node.revertReason === "string" && node.revertReason
        ? node.revertReason
        : undefined;

  let result: TraceBlockResult | null | undefined;
  let topError: string | undefined;

  if (errMsg) {
    result = null;
    topError = errMsg;
  } else {
    result = {
      gasUsed: typeof node.gasUsed === "string" ? node.gasUsed : "0x0",
      output: typeof node.output === "string" ? node.output : "0x",
    };
  }

  const from = typeof node.from === "string" ? node.from : "";
  const to = typeof node.to === "string" ? node.to : "";
  const value = weiValueString(node.value);

  const upper = gethType.toUpperCase();
  const isCallLike =
    upper === "CALL" || upper === "CALLCODE" || upper === "DELEGATECALL" || upper === "STATICCALL";

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
