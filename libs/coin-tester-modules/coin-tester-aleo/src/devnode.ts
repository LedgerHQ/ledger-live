import { ALEO_LOCAL_NODE, ALEO_NETWORK_TYPE } from "./fixtures";

const BASE = `${ALEO_LOCAL_NODE}/${ALEO_NETWORK_TYPE}`;

export type DevnodeTransitionValue = {
  type: "public" | "private" | "future" | "record" | "constant" | "external_record";
  id: string;
  value?: string;
  tag?: string;
};

export type DevnodeTransition = {
  id: string;
  program: string;
  function: string;
  inputs: DevnodeTransitionValue[];
  outputs: DevnodeTransitionValue[];
  tpk: string;
  tcm: string;
  scm: string;
};

export type DevnodeTransaction = {
  type: string;
  id: string;
  execution?: {
    transitions: DevnodeTransition[];
    global_state_root: string;
    proof?: string;
  };
  fee?: {
    transition: DevnodeTransition;
    global_state_root?: string;
    proof?: string;
  };
};

export type DevnodeConfirmedTransaction = {
  status: string;
  type: string;
  index?: number;
  transaction: DevnodeTransaction;
};

export type DevnodeBlock = {
  block_hash: string;
  previous_hash: string;
  header: {
    metadata: {
      height: number;
      timestamp: number;
    };
  };
  transactions: DevnodeConfirmedTransaction[];
};

/**
 * Reads every top-level argument out of a transition's `future` output, in
 * order. Every finalize-scope transition binds its arguments there, and a
 * future is the only place that survives past broadcast into the block JSON.
 * Assumes flat, simple arguments (addresses, integer literals) — true for
 * every transition this coin-tester indexes.
 */
export function parseFutureArguments(transition: DevnodeTransition): string[] {
  const future = transition.outputs.find(output => output.type === "future");
  const match = future?.value ? /arguments:\s*\[([^\]]*)\]/.exec(future.value) : null;
  if (!match) {
    throw new Error(`aleo coin-tester: could not read the future arguments of ${transition.id}`);
  }
  return match[1]
    .split(",")
    .map(argument => argument.trim())
    .filter(Boolean);
}

/** The sender is at future argument 0 for every transition this coin-tester reads directly (credits.aleo). Token programs put it elsewhere — see msw/programs.ts's `senderArgIndex`. */
export function parseFutureSender(transition: DevnodeTransition): string {
  const [sender] = parseFutureArguments(transition);
  if (!sender?.startsWith("aleo1")) {
    throw new Error(
      `aleo coin-tester: could not read the sender address from the future of ${transition.id}`,
    );
  }
  return sender;
}

async function get(path: string): Promise<Response> {
  const response = await fetch(`${BASE}/${path}`);
  if (!response.ok) {
    throw new Error(`aleo coin-tester: GET ${path} failed with HTTP ${response.status}`);
  }
  return response;
}

export async function getLatestHeight(): Promise<number> {
  return Number(await (await get("block/height/latest")).text());
}

export async function getBlock(height: number): Promise<DevnodeBlock> {
  return (await (await get(`block/${height}`)).json()) as DevnodeBlock;
}

export async function getProgramSource(programId: string): Promise<string> {
  // The route answers with a JSON string, not a bare body.
  return (await (await get(`program/${programId}`)).json()) as string;
}

/**
 * Reads every `import <id>;` line off `source`, fetches each one's deployed
 * source, and recurses into its own imports. Mirrors what
 * NetworkClient.getProgramImports does in @provablehq/sdk, without needing a
 * live NetworkClient instance — this package builds transactions with the
 * raw wasm class instead (see msw/prove.ts).
 *
 * Prevents infinite recursion on circular import graphs by tracking visited
 * programs across all recursive calls.
 */
export async function resolveProgramImports(
  source: string,
  visited: Set<string> = new Set(),
): Promise<Record<string, string>> {
  const importIds = [...source.matchAll(/^import\s+([\w.]+);/gm)].map(match => match[1]);
  const imports: Record<string, string> = {};

  for (const id of importIds) {
    if (visited.has(id)) continue;
    visited.add(id);
    const importedSource = await getProgramSource(id);
    imports[id] = importedSource;
    const nested = await resolveProgramImports(importedSource, visited);
    for (const [nestedId, nestedSource] of Object.entries(nested)) {
      imports[nestedId] = nestedSource;
    }
  }

  return imports;
}

export async function getTransaction(id: string): Promise<DevnodeTransaction> {
  return (await (await get(`transaction/${id}`)).json()) as DevnodeTransaction;
}

/** `null` when the key is absent; the hit is a quoted snarkVM literal. */
export async function getMapping(
  programId: string,
  mapping: string,
  key: string,
): Promise<string | null> {
  return (await (await get(`program/${programId}/mapping/${mapping}/${key}`)).json()) as
    | string
    | null;
}

/**
 * The broadcast route wants a complete transaction JSON — it rejects a body
 * without an `id` field — so callers pass `transaction.toString()` straight
 * through.
 */
export async function broadcastTransaction(transactionJson: string): Promise<void> {
  const response = await fetch(`${BASE}/transaction/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: transactionJson,
  });
  if (!response.ok) {
    throw new Error(
      `aleo coin-tester: devnode rejected the transaction: HTTP ${response.status} ${await response.text()}`,
    );
  }
}
