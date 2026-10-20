import { ALEO_LOCAL_NODE, ALEO_NETWORK_TYPE } from "./constants";

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

/** Assumes flat arguments (addresses, integer literals); nested structs are not parsed. */
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

/** Defaults to credits.aleo's layout; other programs may place the sender elsewhere (see msw/programs.ts `senderArgIndex`). */
export function parseFutureSender(transition: DevnodeTransition, senderArgIndex = 0): string {
  const sender = parseFutureArguments(transition)[senderArgIndex];
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

const sealedBlocks: DevnodeBlock[] = [];

/** Call on a fresh stack: blocks cached from a previous devnode would shadow the new chain. */
export function resetBlockCache(): void {
  sealedBlocks.length = 0;
}

/** A devnode never reorgs, so each sealed block is fetched once and served from memory after. */
export async function getBlocksFrom(height: number): Promise<DevnodeBlock[]> {
  const latest = await getLatestHeight();
  for (let current = sealedBlocks.length; current <= latest; current++) {
    sealedBlocks[current] = await getBlock(current);
  }
  return sealedBlocks.slice(height, latest + 1);
}

export async function getProgramSource(programId: string): Promise<string> {
  return (await (await get(`program/${programId}`)).json()) as string;
}

/** Mirrors @provablehq/sdk NetworkClient.getProgramImports without a live NetworkClient. */
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

export async function getMapping(
  programId: string,
  mapping: string,
  key: string,
): Promise<string | null> {
  return (await (await get(`program/${programId}/mapping/${mapping}/${key}`)).json()) as
    | string
    | null;
}

export async function getPublicBalance(address: string): Promise<bigint> {
  const value = await getMapping("credits.aleo", "account", address);
  return value === null ? 0n : BigInt(value.replace(/u64$/, ""));
}

/** A devnode only seals blocks on broadcast or on this call, so height-waiting scenarios must drive it. */
export async function advanceBlocks(count = 1): Promise<number> {
  for (let i = 0; i < count; i++) {
    const response = await fetch(`${BASE}/block/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (!response.ok) {
      throw new Error(`aleo coin-tester: could not advance the devnode: HTTP ${response.status}`);
    }
  }
  return getLatestHeight();
}

export async function waitForPublicBalance(address: string, atLeast: bigint): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt++) {
    await advanceBlocks(1);
    if ((await getPublicBalance(address)) >= atLeast) return;
  }
  throw new Error(`aleo coin-tester: the public balance of ${address} never reached ${atLeast}`);
}

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
