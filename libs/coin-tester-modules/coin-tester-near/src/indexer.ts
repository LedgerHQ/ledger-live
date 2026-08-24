import { http, HttpResponse } from "msw";
import { setupServer, type SetupServer } from "msw/node";
import type { NearTransaction } from "@ledgerhq/coin-near/network/sdk.types";
import { INDEXER_URL, POOL_ID } from "./fixtures";

// Stubs the indexer (history, staking deposits, validators) from the sandbox's own RPC state,
// since no local node exposes one. Response envelopes match each endpoint's own parser.

type RpcCall = <T>(method: string, params: unknown) => Promise<T>;

type NearRpcAction = Record<string, unknown> & {
  Transfer?: { deposit: string };
  FunctionCall?: { method_name: string; deposit: string };
};

type NearRpcTxStatus = {
  transaction: { signer_id: string; receiver_id: string; hash: string; actions: NearRpcAction[] };
  transaction_outcome: { block_hash: string; outcome: { tokens_burnt: string } };
  receipts_outcome: { outcome: { tokens_burnt: string } }[];
  status: Record<string, unknown>;
};

type NearRpcBlock = {
  header: { hash: string; height: number; timestamp_nanosec: string };
};

/** Hashes the scenario has broadcast, oldest first. Fed by the scenario's `mockIndexer` hook. */
const broadcast: { hash: string; accountId: string }[] = [];
const resolved = new Map<string, NearTransaction>();

export function recordTransaction(hash: string, accountId: string): void {
  if (!broadcast.some(entry => entry.hash === hash)) {
    broadcast.push({ hash, accountId });
  }
}

export function resetIndexer(): void {
  broadcast.length = 0;
  resolved.clear();
}

function describeActions(actions: NearRpcAction[]): NearTransaction["actions"] {
  return actions.map(action => {
    if (action.Transfer) {
      return { action: "TRANSFER", method: null };
    }
    if (action.FunctionCall) {
      return { action: "FUNCTION_CALL", method: action.FunctionCall.method_name };
    }
    return { action: Object.keys(action)[0]?.toUpperCase() ?? "UNKNOWN", method: null };
  });
}

function totalDeposit(actions: NearRpcAction[]): string {
  const sum = actions.reduce((acc, action) => {
    if (action.Transfer) {
      return acc + BigInt(action.Transfer.deposit);
    }
    if (action.FunctionCall) {
      return acc + BigInt(action.FunctionCall.deposit);
    }
    return acc;
  }, 0n);

  return sum.toString();
}

/** Fee is what the whole transaction burnt, receipts included, matching the real indexer. */
function totalFee(status: NearRpcTxStatus): string {
  const receipts = status.receipts_outcome.reduce(
    (acc, receipt) => acc + BigInt(receipt.outcome.tokens_burnt),
    0n,
  );

  return (receipts + BigInt(status.transaction_outcome.outcome.tokens_burnt)).toString();
}

async function resolveTransaction(
  rpc: RpcCall,
  hash: string,
  accountId: string,
): Promise<NearTransaction> {
  const cached = resolved.get(hash);
  if (cached) {
    return cached;
  }

  const status = await rpc<NearRpcTxStatus>("tx", [hash, accountId]);
  const block = await rpc<NearRpcBlock>("block", {
    block_id: status.transaction_outcome.block_hash,
  });

  const transaction: NearTransaction = {
    signer_account_id: status.transaction.signer_id,
    receiver_account_id: status.transaction.receiver_id,
    transaction_hash: hash,
    block_timestamp: block.header.timestamp_nanosec,
    outcomes_agg: { transaction_fee: totalFee(status) },
    outcomes: { status: "SuccessValue" in status.status || "SuccessReceiptId" in status.status },
    block: {
      block_hash: block.header.hash,
      block_height: String(block.header.height),
      block_timestamp: block.header.timestamp_nanosec,
    },
    actions_agg: { deposit: totalDeposit(status.transaction.actions) },
    actions: describeActions(status.transaction.actions),
  };

  resolved.set(hash, transaction);
  return transaction;
}

async function historyFor(rpc: RpcCall, address: string, limit: number) {
  const transactions: NearTransaction[] = [];

  // Newest first, matching the indexer's own ordering.
  for (const entry of [...broadcast].reverse()) {
    const transaction = await resolveTransaction(rpc, entry.hash, entry.accountId);
    const involved =
      transaction.signer_account_id === address || transaction.receiver_account_id === address;

    if (involved) {
      transactions.push(transaction);
    }
    if (transactions.length >= limit) {
      break;
    }
  }

  return transactions;
}

export function startIndexer(rpc: RpcCall): SetupServer {
  const server = setupServer(
    http.get(`${INDEXER_URL}/v3/accounts/:address/txns`, async ({ params, request }) => {
      const limit = Number(new URL(request.url).searchParams.get("limit") ?? 25);
      const data = await historyFor(rpc, String(params.address), limit);
      return HttpResponse.json({ data });
    }),

    // Read as `response.data.gas_price`, so the payload is `{ data: { gas_price } }`.
    http.get(`${INDEXER_URL}/v3/stats`, async () => {
      const { gas_price: gasPrice } = await rpc<{ gas_price: string }>("gas_price", [null]);
      return HttpResponse.json({ data: { gas_price: gasPrice } });
    }),

    http.get(`${INDEXER_URL}/v3/kitwallet/staking-deposits/:address`, async ({ params }) => {
      const deposit = await rpc<{ result: number[] }>("query", {
        request_type: "call_function",
        finality: "final",
        account_id: POOL_ID,
        method_name: "get_account_total_balance",
        args_base64: Buffer.from(JSON.stringify({ account_id: params.address })).toString("base64"),
      }).catch(() => undefined);

      if (!deposit) {
        return HttpResponse.json([]);
      }

      const total = JSON.parse(Buffer.from(deposit.result).toString()) as string;
      // `getStakingPositions` maps over the body itself, so this one is not wrapped in `data`.
      return HttpResponse.json(
        BigInt(total) > 0n ? [{ deposit: total, validator_id: POOL_ID }] : [],
      );
    }),

    // The deployed pool never joins the protocol's validator set — it holds far less than the seat
    // price — so it is reported here rather than read from the chain.
    http.get(`${INDEXER_URL}/v3/validators`, async () => {
      const staked = await rpc<{ result: number[] }>("query", {
        request_type: "call_function",
        finality: "final",
        account_id: POOL_ID,
        method_name: "get_total_staked_balance",
        args_base64: Buffer.from("{}").toString("base64"),
      }).catch(() => undefined);

      const currentEpochStake = staked
        ? (JSON.parse(Buffer.from(staked.result).toString()) as string)
        : "0";

      return HttpResponse.json({
        data: [
          {
            account_id: POOL_ID,
            current_epoch_stake: currentEpochStake,
            fee_numerator: 10,
            fee_denominator: 100,
          },
        ],
      });
    }),
  );

  server.listen({
    onUnhandledRequest: request => {
      const hostname = new URL(request.url).hostname;
      // Allow requests to the local sandbox node to pass through to the real node.
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled request: ${request.method} ${request.url}`);
    },
  });

  return server;
}
