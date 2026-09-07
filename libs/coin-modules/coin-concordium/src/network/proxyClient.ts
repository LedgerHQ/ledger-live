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

interface ProxyClient {
  baseUrl: string;
  request<TResponse, TRequest = unknown>(config: LiveNetworkRequest<TRequest>): Promise<TResponse>;
}

const PROXY_TIMEOUT = 30000;
const DEFAULT_RETRIES = 2;
const RETRY_DELAY = 1000;

function createProxyClient(config: ConcordiumCoinConfig): ProxyClient {
  const baseUrl = config.proxyUrl;

  const request = async <TResponse, TRequest = unknown>(
    config: LiveNetworkRequest<TRequest>,
  ): Promise<TResponse> => {
    if (!config.url) {
      throw new Error("URL is required for proxy client requests");
    }
    const response = await network<TResponse, TRequest>({
      ...config,
      url: `${baseUrl}${config.url}`,
      timeout: PROXY_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...config.headers,
      },
    });
    return response.data;
  };

  return { baseUrl, request };
}

const CLIENTS_BY_CURRENCY = new Map<string, ProxyClient>();

function getClient(config: ConcordiumCoinConfig, currencyId: string): ProxyClient {
  const existing = CLIENTS_BY_CURRENCY.get(currencyId);
  if (existing) return existing;

  const client = createProxyClient(config);
  CLIENTS_BY_CURRENCY.set(currencyId, client);
  return client;
}

/**
 * Executes a function with a proxy client, handling retries and error handling
 *
 * @param config - The Concordium coin configuration
 * @param currencyId - The Concordium currency ID
 * @param execute - Function to execute with the client
 * @param retries - Number of retries (default: 2)
 * @returns Result of the execute function
 */
export async function withClient<T>(
  config: ConcordiumCoinConfig,
  currencyId: string,
  execute: (client: ProxyClient) => Promise<T>,
  retries = DEFAULT_RETRIES,
): Promise<T> {
  const client = getClient(config, currencyId);

  return retry(() => execute(client), {
    maxRetry: retries,
    interval: RETRY_DELAY,
    intervalMultiplicator: 1,
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
): Promise<PublicKeyAccountsResponse> {
  return withClient(config, currencyId, async client =>
    client.request<PublicKeyAccountsResponse>({
      method: "GET",
      url: `/v0/keyAccounts/${publicKey}`,
    }),
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
 * Calculate transaction cost
 * GET /v0/transactionCost
 *
 * Always uses "simpleTransfer" type as it's the only supported type for regular transfers.
 * Memo overhead is calculated via the optional memoSize parameter.
 */
export async function getTransactionCost(
  config: ConcordiumCoinConfig,
  currencyId: string,
  { numSignatures, memoSize }: GetTransactionCostParams,
): Promise<{ cost: string; energy: number }> {
  return withClient(config, currencyId, async client =>
    client.request<{ cost: string; energy: number }>({
      method: "GET",
      url: "/v0/transactionCost",
      params: {
        type: "simpleTransfer",
        numSignatures,
        ...(memoSize ? { memoSize } : {}),
      },
    }),
  );
}

/**
 * Submit a signed transfer transaction to the network
 * PUT /v0/submitTransfer/
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
      url: "/v0/submitTransfer/",
      data,
    };
    return client.request<{ submissionId: string }, SubmitTransferData>(request);
  });
}

/**
 * Submit a credential deployment transaction to the network
 * PUT /v0/submitCredential/
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
      url: "/v0/submitCredential/",
      data: data,
    };

    return client.request<{ submissionId: string }, SubmitCredentialData>(request);
  });
}
