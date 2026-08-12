import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import type { InfoGetTransactionResult } from "casper-js-sdk";
import { getCasperNodeRpcClient } from "@ledgerhq/coin-casper/network/api";
import type {
  IndexerResponseRoot,
  ITxnHistoryData,
  RpcError,
  TransferArgs,
} from "@ledgerhq/coin-casper/types";

// `args` is `Partial` because the real feed also serves staking and contract
// deploys; `isNativeTransfer` rejects entries missing `amount` or `target`.
type NativeTransferEntry = ITxnHistoryData & { args: TransferArgs };

const entriesByPublicKey = new Map<string, ITxnHistoryData[]>();

// A fresh broadcast answers with this RPC code until the node has
// deduplicated it — not an error, just "not included yet".
const TRANSACTION_NOT_KNOWN_YET = -32014;
const POLL_ATTEMPTS = 40;
const POLL_INTERVAL_MS = 3 * 1000;

async function readTransaction(hash: string): Promise<InfoGetTransactionResult> {
  const client = getCasperNodeRpcClient();

  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    try {
      const result = await client.getTransactionByTransactionHash(hash);
      if (result.executionInfo) return result;
    } catch (error) {
      if ((error as RpcError).statusCode !== TRANSACTION_NOT_KNOWN_YET) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Transaction ${hash} not included after ${POLL_ATTEMPTS} attempts`);
}

// Indexed under both public keys like the real indexer, so the recipient's sync
// produces an IN operation.
export async function indexTransfer(hash: string): Promise<void> {
  const result = await readTransaction(hash);
  const entry = txHistoryEntry(result);
  append(entry.caller_public_key, entry);
  if (entry.args.target.parsed !== entry.caller_public_key) {
    append(entry.args.target.parsed, entry);
  }
}

function append(publicKey: string, entry: ITxnHistoryData): void {
  entriesByPublicKey.set(publicKey, [...(entriesByPublicKey.get(publicKey) ?? []), entry]);
}

interface RawTransactionV1JSON {
  transaction: {
    Version1: {
      payload: {
        fields: {
          args: {
            Named: [string, { parsed: unknown }][];
          };
        };
      };
    };
  };
}

// Parsed argument values live in `rawJSON`; the typed `Args` object only
// exposes each argument as an undecoded `CLValue`.
function namedArg(rawJSON: unknown, name: string): { parsed: unknown } {
  const found = optionalNamedArg(rawJSON, name);
  if (!found) throw new Error(`Transaction is missing the "${name}" argument`);
  return found;
}

// A native transfer with no transfer id carries no `id` argument at all.
function optionalNamedArg(rawJSON: unknown, name: string): { parsed: unknown } | undefined {
  const named = (rawJSON as RawTransactionV1JSON).transaction.Version1.payload.fields.args.Named;
  return named.find(([argName]) => argName === name)?.[1];
}

function txHistoryEntry(result: InfoGetTransactionResult): NativeTransferEntry {
  const { transaction, executionInfo, rawJSON } = result;
  const hash = transaction.hash.toHex();

  const callerPublicKey = transaction.initiatorAddr.publicKey;
  if (!callerPublicKey) throw new Error(`Transaction ${hash} has no initiator public key`);

  // readTransaction only returns once executionInfo is present.
  const executionResult = executionInfo!.executionResult;

  const amount = namedArg(rawJSON, "amount");
  const target = namedArg(rawJSON, "target");
  const id = optionalNamedArg(rawJSON, "id");

  return {
    deploy_hash: hash,
    block_hash: executionInfo!.blockHash.toHex(),
    // listOperations filters on this against `minHeight`; a wrong value here
    // would silently drop operations from the page.
    block_height: executionInfo!.blockHeight,
    caller_public_key: callerPublicKey.toHex(),
    cost: executionResult.cost.toString(),
    error_message: executionResult.errorMessage,
    timestamp: transaction.timestamp.toJSON(),
    args: {
      ...(id !== undefined && {
        id: { parsed: id.parsed as number | null | undefined, cl_type: { Option: "U64" } },
      }),
      amount: { parsed: String(amount.parsed), cl_type: "U512" },
      target: { parsed: String(target.parsed), cl_type: "PublicKey" },
    },
  };
}

const ALLOWED_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

export function startIndexer(): () => void {
  entriesByPublicKey.clear();

  const server = setupServer(
    http.get("*/accounts/:publicKey/ledgerlive-deploys", ({ params }) => {
      const data = entriesByPublicKey.get(params.publicKey as string) ?? [];
      const body: IndexerResponseRoot<ITxnHistoryData> = {
        data,
        page_count: 1,
        item_count: data.length,
      };
      return HttpResponse.json(body);
    }),
  );

  server.listen({
    onUnhandledRequest: request => {
      const { hostname } = new URL(request.url);
      if (ALLOWED_HOSTNAMES.has(hostname)) return;
      throw new Error(`Unhandled request: ${request.method} ${request.url}`);
    },
  });

  return () => server.close();
}
