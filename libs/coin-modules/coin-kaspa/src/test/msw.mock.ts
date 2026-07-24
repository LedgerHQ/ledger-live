import { setupServer } from "msw/node";
import type {
  ApiResponseBlockInfo,
  ApiResponseBlockTransaction,
  ApiResponseBlockTxOutput,
} from "../types";

// Test host that `msw-setup.ts` points `API_KASPA_ENDPOINT` at, so MSW handlers intercept the exact
// URL the network layer builds. Shared, empty MSW server; each suite registers handlers via `server.use`.
export const TEST_KASPA_ENDPOINT = "https://kaspa-test.ledger.com";
export const server = setupServer();

export const CHAIN_HASH = "a".repeat(64);

export function makeApiBlock(opts: {
  hash: string;
  isChainBlock: boolean;
  timestamp?: string;
  transactions?: ApiResponseBlockTransaction[];
}): ApiResponseBlockInfo {
  return {
    header: {
      version: 2,
      hashMerkleRoot: "",
      acceptedIdMerkleRoot: "",
      utxoCommitment: "",
      timestamp: opts.timestamp ?? "1783691947227",
      bits: 0,
      nonce: "0",
      daaScore: "0",
      blueWork: "",
      parents: [],
      blueScore: "480818084",
      pruningPoint: "",
    },
    transactions: opts.transactions ?? [],
    verboseData: {
      hash: opts.hash,
      difficulty: 0,
      selectedParentHash: "",
      transactionIds: [],
      blueScore: "480818084",
      childrenHashes: null,
      mergeSetBluesHashes: [],
      mergeSetRedsHashes: [],
      isChainBlock: opts.isChainBlock,
    },
  };
}

export function makeApiOutput(
  address: string | null,
  amount: number | null,
): ApiResponseBlockTxOutput {
  return {
    amount,
    scriptPublicKey: null,
    verboseData:
      address === null ? null : { scriptPublicKeyType: "pubkey", scriptPublicKeyAddress: address },
  };
}

export function makeApiTx(opts: {
  id: string;
  outputs: ApiResponseBlockTxOutput[];
  computeMass?: number;
}): ApiResponseBlockTransaction {
  return {
    inputs: null,
    outputs: opts.outputs,
    subnetworkId: null,
    mass: 0,
    version: 0,
    verboseData: {
      transactionId: opts.id,
      hash: null,
      computeMass: opts.computeMass ?? 0,
      blockHash: null,
      blockTime: null,
    },
  };
}

// --- Fixtures for the craft / estimateFees path (POST /addresses/utxos + GET /info/fee-estimate) ---

// Real, validation-passing Kaspa addresses (reused from the craftTransaction unit test).
export const SENDER = "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee";
export const RECIPIENT = "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65";

// Raw `/addresses/utxos` wire shape (amount as a JSON number; the network layer wraps it in a
// BigNumber). A single large UTXO keeps KIP-9 storage mass under the per-tx limit.
export function makeApiUtxo(amount: number, index: number) {
  return {
    address: SENDER,
    outpoint: { transactionId: index.toString(16).padStart(64, "0"), index },
    utxoEntry: {
      amount,
      scriptPublicKey: { version: 0, scriptPublicKey: "20" + "0".repeat(64) + "ac" },
      blockDaaScore: (1000 + index).toString(),
      isCoinbase: false,
    },
  };
}

export const FEE_ESTIMATE = {
  priorityBucket: { feerate: 3, estimatedSeconds: 1 },
  normalBuckets: [{ feerate: 1, estimatedSeconds: 10 }],
  lowBuckets: [{ feerate: 1, estimatedSeconds: 60 }],
};
