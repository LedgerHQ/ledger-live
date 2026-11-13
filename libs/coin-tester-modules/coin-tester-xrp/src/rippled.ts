// The RPC of the coin-sandbox instance, known once it is up
let rpcUrl: string | undefined;

export function setXrpRpc(url: string): void {
  rpcUrl = url;
}

type RpcResponse<T> = { result: T & { status?: string; error?: string; error_message?: string } };

async function rpcCall<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  if (rpcUrl === undefined) throw new Error("the XRP RPC is not set: is the sandbox up?");
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params: [params] }),
  });
  if (!res.ok) throw new Error(`rippled ${method} → HTTP ${res.status}`);
  const body = (await res.json()) as RpcResponse<T>;
  if (body.result.status === "error") {
    throw new Error(`rippled ${method} → ${body.result.error_message ?? body.result.error}`);
  }
  return body.result;
}

export async function closeLedger(): Promise<number> {
  const res = await rpcCall<{ ledger_current_index: number }>("ledger_accept");
  return res.ledger_current_index;
}

/**
 * Validates a pending submission in one shot: `ledger_accept` blocks until
 * the open ledger is closed and every queued tx is validated, after which
 * a single `tx` lookup is enough to read the result.
 */
export async function waitForOperationInclusion(hash: string): Promise<void> {
  await closeLedger();
  const res = await rpcCall<{ validated?: boolean; meta?: { TransactionResult: string } }>("tx", {
    transaction: hash,
    binary: false,
  });
  if (!res.validated) {
    throw new Error(`tx ${hash} was not validated after ledger_accept`);
  }
  if (res.meta && res.meta.TransactionResult !== "tesSUCCESS") {
    throw new Error(`tx ${hash} failed on-chain: ${res.meta.TransactionResult}`);
  }
}
