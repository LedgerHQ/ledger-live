import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TEZOS_RPC } from "./flextesa";
import { ALICE_BAKER_ADDRESS, TZKT_MOCK_URL } from "./fixtures";

interface NodeBlockHeader {
  level: number;
  hash: string;
  timestamp: string;
}

interface NodeOpResult {
  status: string;
  paid_storage_size_diff?: string;
  allocated_destination_contract?: boolean;
}

interface NodeOpContent {
  kind: "transaction" | "reveal" | "delegation";
  source: string;
  fee: string;
  counter: string;
  gas_limit?: string;
  storage_limit?: string;
  amount?: string;
  destination?: string;
  public_key?: string;
  /** Present for `delegate` ops; absent for `undelegate`. */
  delegate?: string;
  metadata?: {
    operation_result?: NodeOpResult;
  };
}

interface NodeOpGroup {
  hash: string;
  contents: NodeOpContent[];
}

interface TrackedOp {
  id: number;
  hash: string;
  block: string;
  level: number;
  timestamp: string;
  type: "transaction" | "reveal";
  amount: number;
  sender: string;
  target?: string;
  bakerFee: number;
  storageFee: number;
  allocationFee: number;
  status: "applied" | "failed";
  counter: number;
  gasLimit: number;
  storageLimit: number;
}

interface TrackedDelegation {
  id: number;
  hash: string;
  block: string;
  level: number;
  timestamp: string;
  sender: string;
  /** Undefined when undelegating. */
  newDelegate?: string;
  prevDelegate?: string;
  bakerFee: number;
  status: "applied" | "failed";
  counter: number;
  gasLimit: number;
  storageLimit: number;
}

let trackedOps: TrackedOp[] = [];
let trackedDelegations: TrackedDelegation[] = [];
let lastIndexedLevel = 0;
let opIdCounter = 1;

let currentDelegates: Record<string, string | undefined> = {};

export function resetIndexer(): void {
  trackedOps = [];
  trackedDelegations = [];
  lastIndexedLevel = 0;
  opIdCounter = 1;
  currentDelegates = {};
}

async function nodeGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${TEZOS_RPC}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Scans blocks from `fromLevel` to the current head and records all operations
 * that involve `watchedAddress`. Safe to call repeatedly; already-indexed
 * levels are skipped.
 */
export async function indexBlocks(watchedAddress: string, fromLevel: number): Promise<void> {
  const head = await nodeGet<NodeBlockHeader>("/chains/main/blocks/head/header");
  if (!head) return;

  const startLevel = Math.max(lastIndexedLevel + 1, fromLevel);

  for (let level = startLevel; level <= head.level; level++) {
    await indexBlock(level, watchedAddress);
    lastIndexedLevel = level;
  }
}

async function indexBlock(level: number, watchedAddress: string): Promise<void> {
  const [ops, header] = await Promise.all([
    nodeGet<NodeOpGroup[]>(`/chains/main/blocks/${level}/operations/3`),
    nodeGet<NodeBlockHeader>(`/chains/main/blocks/${level}/header`),
  ]);

  if (!ops || !header) return;

  const blockHash = header.hash;
  const blockTimestamp = header.timestamp;

  for (const opGroup of ops) {
    for (const content of opGroup.contents ?? []) {
      const isRelevant =
        content.source === watchedAddress || content.destination === watchedAddress;

      const result = content.metadata?.operation_result;
      const isApplied = result?.status === "applied";
      const paidStorageDiff = parseInt(result?.paid_storage_size_diff ?? "0", 10);
      const allocatedContract = result?.allocated_destination_contract ?? false;

      if (!isRelevant) {
        continue;
      }
      switch (content.kind) {
        case "transaction":
          trackedOps.push({
            id: opIdCounter++,
            hash: opGroup.hash,
            block: blockHash,
            level,
            timestamp: blockTimestamp,
            type: "transaction",
            amount: parseInt(content.amount ?? "0", 10),
            sender: content.source,
            target: content.destination,
            bakerFee: parseInt(content.fee ?? "0", 10),
            storageFee: paidStorageDiff * 250,
            allocationFee: allocatedContract ? 257_000 : 0,
            status: isApplied ? "applied" : "failed",
            counter: parseInt(content.counter ?? "0", 10),
            gasLimit: parseInt(content.gas_limit ?? "0", 10),
            storageLimit: parseInt(content.storage_limit ?? "0", 10),
          });
          break;
        case "reveal":
          trackedOps.push({
            id: opIdCounter++,
            hash: opGroup.hash,
            block: blockHash,
            level,
            timestamp: blockTimestamp,
            type: "reveal",
            amount: 0,
            sender: content.source,
            bakerFee: parseInt(content.fee ?? "0", 10),
            storageFee: 0,
            allocationFee: 0,
            status: isApplied ? "applied" : "failed",
            counter: parseInt(content.counter ?? "0", 10),
            gasLimit: parseInt(content.gas_limit ?? "0", 10),
            storageLimit: parseInt(content.storage_limit ?? "0", 10),
          });
          break;
        case "delegation":
          if (content.source === watchedAddress) {
            const prevDelegate = currentDelegates[watchedAddress];
            const newDelegate = content.delegate || undefined;
            trackedDelegations.push({
              id: opIdCounter++,
              hash: opGroup.hash,
              block: blockHash,
              level,
              timestamp: blockTimestamp,
              sender: content.source,
              newDelegate,
              prevDelegate,
              bakerFee: parseInt(content.fee ?? "0", 10),
              status: isApplied ? "applied" : "failed",
              counter: parseInt(content.counter ?? "0", 10),
              gasLimit: parseInt(content.gas_limit ?? "0", 10),
              storageLimit: parseInt(content.storage_limit ?? "0", 10),
            });
            if (isApplied) {
              currentDelegates[watchedAddress] = newDelegate;
            }
          }
          break;
        default:
          break;
      }
    }
  }
}

function buildTzktOp(op: TrackedOp): Record<string, unknown> {
  if (op.type === "reveal") {
    return {
      id: op.id,
      hash: op.hash,
      block: op.block,
      level: op.level,
      timestamp: op.timestamp,
      type: "reveal",
      sender: { address: op.sender },
      bakerFee: op.bakerFee,
      status: op.status,
      counter: op.counter,
      gasLimit: op.gasLimit,
      storageLimit: op.storageLimit,
    };
  }

  return {
    id: op.id,
    hash: op.hash,
    block: op.block,
    level: op.level,
    timestamp: op.timestamp,
    type: "transaction",
    amount: op.amount,
    sender: { address: op.sender },
    target: op.target ? { address: op.target } : null,
    initiator: null,
    bakerFee: op.bakerFee,
    storageFee: op.storageFee,
    allocationFee: op.allocationFee,
    status: op.status,
    counter: op.counter,
    gasLimit: op.gasLimit,
    storageLimit: op.storageLimit,
  };
}

function buildTzktDelegation(op: TrackedDelegation): Record<string, unknown> {
  return {
    id: op.id,
    hash: op.hash,
    block: op.block,
    level: op.level,
    timestamp: op.timestamp,
    type: "delegation",
    sender: { address: op.sender },
    newDelegate: op.newDelegate ? { address: op.newDelegate } : null,
    prevDelegate: op.prevDelegate ? { address: op.prevDelegate } : null,
    bakerFee: op.bakerFee,
    status: op.status,
    counter: op.counter,
    gasLimit: op.gasLimit,
    storageLimit: op.storageLimit,
    amount: 0,
  };
}

/**
 * Starts the MSW server that intercepts TzKT API calls and proxies them to the
 * local Flextesa Tezos node.  Returns a cleanup function.
 */
export function initMswHandlers(): () => void {
  const server = setupServer(
    http.get(`${TZKT_MOCK_URL}/v1/accounts/:address`, async ({ params }) => {
      const address = params.address as string;

      const [balanceRaw, counterRaw, managerKey] = await Promise.all([
        nodeGet<string>(`/chains/main/blocks/head/context/contracts/${address}/balance`),
        nodeGet<string>(`/chains/main/blocks/head/context/contracts/${address}/counter`),
        nodeGet<string | null>(`/chains/main/blocks/head/context/contracts/${address}/manager_key`),
      ]);

      const balance = balanceRaw ? parseInt(balanceRaw, 10) : 0;
      const counter = counterRaw ? parseInt(counterRaw, 10) : 0;
      // TzKT returns null JSON for unrevealed accounts; the node returns "null" string
      const revealed = !!managerKey && managerKey !== "null";

      if (balance === 0 && !revealed) {
        return HttpResponse.json({ type: "empty", address, counter });
      }

      const delegate = currentDelegates[address];

      return HttpResponse.json({
        type: "user",
        address,
        publicKey: revealed ? managerKey : "",
        revealed,
        balance,
        counter,
        delegate: delegate ? { alias: "", address: delegate, active: true } : undefined,
        delegationLevel: 0,
        delegationTime: new Date().toISOString(),
        numTransactions: trackedOps.filter(op => op.sender === address || op.target === address)
          .length,
        firstActivityTime: new Date().toISOString(),
      });
    }),

    http.get(`${TZKT_MOCK_URL}/v1/accounts/:address/operations`, ({ params, request }) => {
      const address = params.address as string;
      const url = new URL(request.url);
      const levelGe = parseInt(url.searchParams.get("level.ge") ?? "0", 10);

      const txAndRevealOps = trackedOps
        .filter(op => (op.sender === address || op.target === address) && op.level >= levelGe)
        .map(buildTzktOp);

      const delegationOps = trackedDelegations
        .filter(op => op.sender === address && op.level >= levelGe)
        .map(buildTzktDelegation);

      const allOps = [...txAndRevealOps, ...delegationOps].sort((a, b) => {
        return (b.id as number) - (a.id as number);
      });

      return HttpResponse.json(allOps);
    }),

    http.get(`${TZKT_MOCK_URL}/v1/blocks/count`, async () => {
      const head = await nodeGet<NodeBlockHeader>("/chains/main/blocks/head/header");
      return HttpResponse.json(head?.level ?? 0);
    }),

    http.get(`${TZKT_MOCK_URL}/v1/blocks`, async ({ request }) => {
      const url = new URL(request.url);
      const levelIn = url.searchParams.get("level.in");
      const limit = parseInt(url.searchParams.get("limit") ?? "1", 10);

      if (levelIn) {
        const levels = levelIn.split(",").map(Number).slice(0, limit);
        const results: [number, string][] = [];
        for (const level of levels) {
          const hdr = await nodeGet<NodeBlockHeader>(`/chains/main/blocks/${level}/header`);
          if (hdr) results.push([hdr.level, hdr.hash]);
        }
        return HttpResponse.json(results);
      }

      const head = await nodeGet<NodeBlockHeader>("/chains/main/blocks/head/header");
      if (!head) return HttpResponse.json([]);

      return HttpResponse.json([
        {
          level: head.level,
          hash: head.hash,
          timestamp: head.timestamp,
          cycle: 0,
          proto: 1,
          payloadRound: 0,
          blockRound: 0,
          validations: 0,
          deposit: 0,
          rewardDelegated: 0,
          rewardStakedOwn: 0,
          rewardStakedEdge: 0,
          rewardStakedShared: 0,
          bonusDelegated: 0,
          bonusStakedOwn: 0,
          bonusStakedEdge: 0,
          bonusStakedShared: 0,
          fees: 0,
          nonceRevealed: false,
          proposer: { address: ALICE_BAKER_ADDRESS },
          producer: { address: ALICE_BAKER_ADDRESS },
          software: { date: new Date().toISOString() },
          lbToggle: false,
          lbToggleEma: 0,
          aiToggleEma: 0,
          rewardLiquid: 0,
          bonusLiquid: 0,
          reward: 0,
          bonus: 0,
          priority: 0,
          baker: { address: ALICE_BAKER_ADDRESS },
          lbEscapeVote: false,
          lbEscapeEma: 0,
        },
      ]);
    }),

    http.get(`${TZKT_MOCK_URL}/v1/operations/delegations`, ({ request }) => {
      const url = new URL(request.url);
      const level = parseInt(url.searchParams.get("level") ?? "0", 10);

      const ops = trackedDelegations.filter(op => op.level === level).map(buildTzktDelegation);

      return HttpResponse.json(ops);
    }),

    http.get(`${TZKT_MOCK_URL}/v1/tokens/transfers`, () => HttpResponse.json([])),
    http.get(`${TZKT_MOCK_URL}/v1/tokens/balances`, () => HttpResponse.json([])),
    http.get(`${TZKT_MOCK_URL}/v1/staking/unstake_requests`, () => HttpResponse.json([])),
    http.get("https://tezos-bakers.api.live.ledger.com/*", () => HttpResponse.json([])),
  );

  server.listen({
    onUnhandledRequest: req => {
      const hostname = new URL(req.url).hostname;
      // Allow requests to the local Tezos node to pass through
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled MSW request: ${req.method} ${req.url}`);
    },
  });

  return () => server.close();
}
