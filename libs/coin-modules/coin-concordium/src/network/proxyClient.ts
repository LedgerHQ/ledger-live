import network from "@ledgerhq/live-network";
import type { LiveNetworkRequest } from "@ledgerhq/live-network/network";
import { retry } from "@ledgerhq/coin-module-framework/promises";
import type {
  AccountBalanceResponse,
  BlockInfoResponse,
  BlocksAtHeightResponse,
  BlockTransactionEventsResponse,
  ConcordiumCoinConfig,
  ConsensusInfoResponse,
  GetTransactionCostParams,
  PltTokenInfo,
  TransactionsResponse,
  PublicKeyAccountsResponse,
  SubmitCredentialData,
  SubmitTransferData,
  TransactionQueryParams,
} from "../types";
import {
  DEFAULT_GATEWAY_RETRIES,
  DEFAULT_GATEWAY_RETRY_DELAY_MS,
  DEFAULT_GATEWAY_TIMEOUT_MS,
} from "../constants";
import { tuning } from "../tuning";

interface ProxyClient {
  baseUrl: string;
  request<TResponse, TRequest = unknown>(config: LiveNetworkRequest<TRequest>): Promise<TResponse>;
}

function createProxyClient(config: ConcordiumCoinConfig): ProxyClient {
  const baseUrl = config.proxyUrl;
  const timeout = tuning(config.gateway?.timeoutMs, DEFAULT_GATEWAY_TIMEOUT_MS, 1);

  const request = async <TResponse, TRequest = unknown>(
    requestConfig: LiveNetworkRequest<TRequest>,
  ): Promise<TResponse> => {
    if (!requestConfig.url) {
      throw new Error("URL is required for proxy client requests");
    }
    const response = await network<TResponse, TRequest>({
      ...requestConfig,
      url: `${baseUrl}${requestConfig.url}`,
      timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...requestConfig.headers,
      },
    });
    return response.data;
  };

  return { baseUrl, request };
}

/**
 * Executes a function with a proxy client built from `config`, retrying on failure.
 *
 * @param config - The Concordium coin configuration
 * @param _currencyId - Unused: the client is built from `config` alone
 * @param execute - Function to execute with the client
 * @param options.retries - Number of retries (default: `config.gateway.retries`)
 * @param options.signal - Stops retrying and rejects with its reason once aborted
 * @returns Result of the execute function
 */
export async function withClient<T>(
  config: ConcordiumCoinConfig,
  _currencyId: string,
  execute: (client: ProxyClient) => Promise<T>,
  {
    retries = tuning(config.gateway?.retries, DEFAULT_GATEWAY_RETRIES),
    signal,
  }: { retries?: number; signal?: AbortSignal | undefined } = {},
): Promise<T> {
  const client = createProxyClient(config);

  return retry(() => execute(client), {
    maxRetry: retries,
    interval: tuning(config.gateway?.retryDelayMs, DEFAULT_GATEWAY_RETRY_DELAY_MS),
    intervalMultiplicator: 1,
    signal,
  });
}

/**
 * Get consensus info from the Concordium network.
 * GET /v0/consensusInfo
 */
export function getConsensusInfo(
  config: ConcordiumCoinConfig,
  currencyId: string,
): Promise<ConsensusInfoResponse> {
  return withClient(config, currencyId, async client =>
    client.request<ConsensusInfoResponse>({
      method: "GET",
      url: "/v0/consensusInfo",
    }),
  );
}

/**
 * Get block info by block hash.
 * GET /v0/blockInfo/{blockHash}
 */
export function getBlockInfoByHash(
  config: ConcordiumCoinConfig,
  currencyId: string,
  blockHash: string,
): Promise<BlockInfoResponse> {
  return withClient(config, currencyId, async client =>
    client.request<BlockInfoResponse>({
      method: "GET",
      url: `/v0/blockInfo/${blockHash}`,
    }),
  );
}

/**
 * Get block hash(es) at a specific height.
 * GET /v0/blocksAtHeight/{blockHeight}
 */
export function getBlocksAtHeight(
  config: ConcordiumCoinConfig,
  currencyId: string,
  height: number,
): Promise<BlocksAtHeightResponse> {
  return withClient(config, currencyId, async client =>
    client.request<BlocksAtHeightResponse>({
      method: "GET",
      url: `/v0/blocksAtHeight/${height}`,
    }),
  );
}

/**
 * Get all transaction summaries (with structured, tagged events) for a block.
 * GET /v0/blockTransactionEvents/{blockHash}
 * Returns an empty array for blocks with no transactions.
 */
export function getBlockTransactionEvents(
  config: ConcordiumCoinConfig,
  currencyId: string,
  blockHash: string,
): Promise<BlockTransactionEventsResponse> {
  return withClient(config, currencyId, async client =>
    client.request<BlockTransactionEventsResponse>({
      method: "GET",
      url: `/v0/blockTransactionEvents/${blockHash}`,
    }),
  );
}

/**
 * Retrieves all accounts associated with a given public key from the Concordium network.
 * GET /v0/keyAccounts/{publicKey}
 */
export function getAccountsByPublicKey(
  config: ConcordiumCoinConfig,
  currencyId: string,
  publicKey: string,
  signal?: AbortSignal,
): Promise<PublicKeyAccountsResponse> {
  return withClient(
    config,
    currencyId,
    async client =>
      client.request<PublicKeyAccountsResponse>({
        method: "GET",
        url: `/v0/keyAccounts/${publicKey}`,
      }),
    { signal },
  );
}

/**
 * Get account balance (v2) - includes CCD and PLT balances with cooldowns
 * GET /v2/accBalance/{address}
 */
export async function getAccountBalance(
  config: ConcordiumCoinConfig,
  currencyId: string,
  accountAddress: string,
): Promise<AccountBalanceResponse> {
  return withClient(config, currencyId, async client =>
    client.request<AccountBalanceResponse>({
      method: "GET",
      url: `/v2/accBalance/${accountAddress}`,
    }),
  );
}

/**
 * List every protocol-level token on the chain.
 * GET /v0/plt/tokens
 *
 * Returns full token info, not just identifiers: the proxy resolves each id
 * before responding.
 */
export async function getPltTokens(
  config: ConcordiumCoinConfig,
  currencyId: string,
): Promise<PltTokenInfo[]> {
  return withClient(config, currencyId, async client =>
    client.request<PltTokenInfo[]>({
      method: "GET",
      url: "/v0/plt/tokens",
    }),
  );
}

/**
 * Get the global info for one protocol-level token.
 * GET /v0/plt/tokenInfo/{tokenId}
 */
export async function getPltTokenInfo(
  config: ConcordiumCoinConfig,
  currencyId: string,
  tokenId: string,
): Promise<PltTokenInfo> {
  return withClient(config, currencyId, async client =>
    client.request<PltTokenInfo>({
      method: "GET",
      url: `/v0/plt/tokenInfo/${encodeURIComponent(tokenId)}`,
    }),
  );
}

/**
 * Get account nonce (next sequence number)
 * GET /v0/accNonce/{address}
 */
export async function getAccountNonce(
  config: ConcordiumCoinConfig,
  currencyId: string,
  accountAddress: string,
): Promise<{ nonce: number }> {
  return withClient(config, currencyId, async client =>
    client.request<{ nonce: number }>({
      method: "GET",
      url: `/v0/accNonce/${accountAddress}`,
    }),
  );
}

/**
 * Get account transactions (v3) - includes CCD and PLT transactions
 * GET /v3/accTransactions/{address}
 */
export async function getTransactions(
  config: ConcordiumCoinConfig,
  currencyId: string,
  accountAddress: string,
  params?: TransactionQueryParams,
): Promise<TransactionsResponse> {
  return withClient(config, currencyId, async client =>
    client.request<TransactionsResponse>({
      method: "GET",
      url: `/v3/accTransactions/${accountAddress}`,
      params,
    }),
  );
}

/**
 * Flattens the cost parameters into the query string the proxy parses.
 *
 * `tokenOperationTypeCount` is serialized rather than spread: a bracket or
 * repeated-key encoding is a parse error, not an equivalent form.
 */
function toCostQueryParams(params: GetTransactionCostParams): Record<string, string | number> {
  if (params.type === "tokenUpdate") {
    return {
      type: params.type,
      numSignatures: params.numSignatures,
      tokenId: params.tokenId,
      listOperationsSize: params.listOperationsSize,
      tokenOperationTypeCount: JSON.stringify(params.tokenOperationTypeCount),
    };
  }

  return {
    type: params.type,
    numSignatures: params.numSignatures,
    ...(params.memoSize ? { memoSize: params.memoSize } : {}),
  };
}

/**
 * Calculate transaction cost
 * GET /v0/transactionCost
 *
 * The energy returned is a ceiling the caller is expected to buffer, not the
 * amount the chain will bill.
 */
export async function getTransactionCost(
  config: ConcordiumCoinConfig,
  currencyId: string,
  params: GetTransactionCostParams,
): Promise<{ cost: string; energy: number }> {
  return withClient(config, currencyId, async client =>
    client.request<{ cost: string; energy: number }>({
      method: "GET",
      url: "/v0/transactionCost",
      params: toCostQueryParams(params),
    }),
  );
}

/**
 * Submit a signed transfer transaction to the network
 * PUT /v0/submitTransfer
 *
 * @param config - The Concordium coin configuration
 * @param currencyId - The Concordium currency ID
 * @param data - The transfer payload (hex-encoded transaction body and signatures)
 * @returns Submission ID
 */
export async function submitTransfer(
  config: ConcordiumCoinConfig,
  currencyId: string,
  data: SubmitTransferData,
): Promise<{ submissionId: string }> {
  return withClient(config, currencyId, async client => {
    const request: LiveNetworkRequest<SubmitTransferData> = {
      method: "PUT",
      url: "/v0/submitTransfer",
      data,
    };
    return client.request<{ submissionId: string }, SubmitTransferData>(request);
  });
}

/**
 * Submit a credential deployment transaction to the network
 * PUT /v0/submitCredential
 *
 * @param config - The Concordium coin configuration
 * @param currencyId - The Concordium currency ID
 * @param data - The credential deployment data in proxy format
 * @returns Submission ID
 */
export async function submitCredential(
  config: ConcordiumCoinConfig,
  currencyId: string,
  data: SubmitCredentialData,
): Promise<{ submissionId: string }> {
  return withClient(config, currencyId, async client => {
    const request: LiveNetworkRequest<SubmitCredentialData> = {
      method: "PUT",
      url: "/v0/submitCredential",
      data: data,
    };

    return client.request<{ submissionId: string }, SubmitCredentialData>(request);
  });
}
