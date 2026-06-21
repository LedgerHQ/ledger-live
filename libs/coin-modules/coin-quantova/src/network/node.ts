/**
 * Thin client over Quantova's `q_` JSON-RPC namespace.
 *
 * The `q_` namespace is JSON-RPC over HTTP and is the canonical way exchanges, wallets
 * and indexers reach a Quantova node (developer docs, ch. 16). Values are hex QUANTITY
 * unless noted. This client is transport-agnostic; pass any fetch-like `post`.
 */

export type JsonRpcPost = (body: unknown) => Promise<{ result?: unknown; error?: unknown }>;

function makePost(endpoint: string): JsonRpcPost {
  return async body => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json() as Promise<{ result?: unknown; error?: unknown }>;
  };
}

export class QuantovaNode {
  private post: JsonRpcPost;

  constructor(endpoint: string, post?: JsonRpcPost) {
    this.post = post ?? makePost(endpoint);
  }

  private async call<T>(method: string, params: unknown[] = []): Promise<T> {
    const out = await this.post({ jsonrpc: "2.0", id: 1, method, params });
    if (out.error) throw new Error(`${method}: ${JSON.stringify(out.error)}`);
    return out.result as T;
  }

  /** Latest block height (hex QUANTITY -> number). */
  async blockNumber(): Promise<number> {
    return parseInt(await this.call<string>("q_blockNumber"), 16);
  }

  /** QTOV balance in plancks for a "Q1..." address at a block (default: latest). */
  async getBalance(address: string, block = "latest"): Promise<bigint> {
    return BigInt(await this.call<string>("q_getBalance", [address, block]));
  }

  /** Account nonce - the number of transactions sent (use as the next tx nonce). */
  async getTransactionCount(address: string, block = "latest"): Promise<number> {
    return parseInt(await this.call<string>("q_getTransactionCount", [address, block]), 16);
  }

  /** Recent base fees / priority-fee percentiles / gas-used ratios. */
  async feeHistory(
    blockCount: number,
    newest = "latest",
    percentiles: number[] = [25, 50, 75],
  ): Promise<unknown> {
    return this.call("q_feeHistory", [blockCount, newest, percentiles]);
  }

  /** Submit an already-signed, SCALE-encoded extrinsic; returns the tx hash. */
  async sendRawTransaction(signedTxHex: string): Promise<string> {
    return this.call<string>("q_sendRawTransaction", [signedTxHex]);
  }

  /** Chain id, used in signing to prevent cross-chain replay. */
  async chainId(): Promise<string> {
    return this.call<string>("q_chainId");
  }
}
