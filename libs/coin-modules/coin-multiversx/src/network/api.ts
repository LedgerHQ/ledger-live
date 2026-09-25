import network from "@ledgerhq/live-network";
import { METACHAIN_SHARD, MAX_PAGINATION_SIZE, MAX_PAGINATION_RESULT_WINDOW } from "../constants";
import type {
  ESDTToken,
  MultiversXApiTransaction,
  MultiversXDelegation,
  MultiversXProvider,
  MultiversXTransactionAction,
  MultiversXTransactionMode,
  MultiversXTransferOptions,
  NetworkInfo,
} from "../types";
import { MultiversXAccount } from "./dtos/multiversx-account";

interface NetworkInfoResponse {
  data: {
    config: {
      erd_chain_id: string;
      erd_denomination: number;
      erd_min_gas_limit: number;
      erd_min_gas_price: number;
      erd_gas_per_data_byte: number;
      erd_gas_price_modifier: string;
    };
  };
}

interface SubmitTransactionResponse {
  data: {
    txHash: string;
  };
}

interface BlockRoundResponse {
  round: number;
}

const decodeTransactionMode = (action?: MultiversXTransactionAction): string => {
  if (!action) return "send";
  if (!action.category) return "send";
  if (action.category !== "stake") return "send";
  return action.name;
};

/**
 * Fetches every transaction matching `buildUrl`'s filter, working around the
 * MultiversX API's hard cap on `from + size` (Elasticsearch's
 * `index.max_result_window`, see MAX_PAGINATION_RESULT_WINDOW).
 *
 * Once a single `from`-based window is exhausted (from reaches the cap) we
 * can't page further with `from` alone, so we shift the window by adding a
 * `before` cursor set to the oldest transaction timestamp seen so far and
 * restart `from` at 0. `before` is exclusive (strictly-older-than), so the
 * next window picks up right where the previous one left off. Results are
 * deduped by tx hash as a safety net, since several transactions can share
 * the same timestamp across a window boundary.
 *
 * Stops once a page comes back shorter than requested (no more data for the
 * current filter) or once `totalCount` deduped transactions have been
 * collected.
 */
async function fetchAllTransactions(
  totalCount: number,
  buildUrl: (from: number, size: number, before?: number) => string,
): Promise<MultiversXApiTransaction[]> {
  const allTransactions: MultiversXApiTransaction[] = [];
  const seenHashes = new Set<string>();
  // `before` stays fixed for the whole 10k window so `from` keeps indexing
  // into the same filtered set; it only moves once the window is shifted.
  let before: number | undefined;

  while (allTransactions.length < totalCount) {
    let from = 0;
    let reachedEnd = false;
    let oldestInWindow: number | undefined;

    while (from < MAX_PAGINATION_RESULT_WINDOW) {
      const size = Math.min(MAX_PAGINATION_SIZE, MAX_PAGINATION_RESULT_WINDOW - from);
      const { data: page } = await network<MultiversXApiTransaction[]>({
        method: "GET",
        url: buildUrl(from, size, before),
      });
      const transactions = page ?? [];

      for (const transaction of transactions) {
        const hash = transaction.txHash;
        if (hash && seenHashes.has(hash)) continue;
        if (hash) seenHashes.add(hash);
        allTransactions.push(transaction);
      }

      const oldest = transactions[transactions.length - 1]?.timestamp;
      if (oldest !== undefined) oldestInWindow = oldest;

      from += size;

      if (transactions.length < size) {
        reachedEnd = true;
        break;
      }
    }

    // The whole filtered set fit in this window (last page was short): done.
    if (reachedEnd) break;

    // The window filled up (from hit the cap) with more data left: shift the
    // window by excluding everything at-or-newer-than the oldest tx we just
    // saw, and restart `from` at 0. If we didn't see any timestamp to shift
    // on, bail out rather than looping forever.
    if (oldestInWindow === undefined) break;
    before = oldestInWindow;
  }

  return allTransactions;
}

export class MultiversXNetworkApi {
  private readonly API_URL: string;
  private readonly DELEGATION_API_URL: string;

  constructor(API_URL: string, DELEGATION_API_URL: string) {
    this.API_URL = API_URL;
    this.DELEGATION_API_URL = DELEGATION_API_URL;
  }

  async getAccountDetails(
    addr: string,
  ): Promise<{ balance: string; nonce: number; isGuarded: boolean }> {
    const {
      data: { balance, nonce, isGuarded },
    } = await network<MultiversXAccount>({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}?withGuardianInfo=true`,
    });
    return { balance: balance.toString(), nonce, isGuarded };
  }

  async getProviders(): Promise<MultiversXProvider[]> {
    const { data: providers } = await network<MultiversXProvider[]>({
      method: "GET",
      url: `${this.DELEGATION_API_URL}/providers`,
    });
    return providers;
  }

  async getNetworkConfig(): Promise<NetworkInfo> {
    const {
      data: {
        data: {
          config: {
            erd_chain_id: chainId,
            erd_denomination: denomination,
            erd_min_gas_limit: gasLimit,
            erd_min_gas_price: gasPrice,
            erd_gas_per_data_byte: gasPerByte,
            erd_gas_price_modifier: gasPriceModifier,
          },
        },
      },
    } = await network<NetworkInfoResponse>({
      method: "GET",
      url: `${this.API_URL}/network/config`,
    });
    return { chainID: chainId, denomination, gasLimit, gasPrice, gasPerByte, gasPriceModifier };
  }

  async submit(signedTxJson: string): Promise<string> {
    const transaction = JSON.parse(signedTxJson);
    const {
      data: {
        data: { txHash: hash },
      },
    } = await network<SubmitTransactionResponse>({
      method: "POST",
      url: `${this.API_URL}/transaction/send`,
      data: transaction,
    });
    if (!hash) {
      throw new Error("broadcast failed: txHash missing in response");
    }
    return hash;
  }

  async getHistory(addr: string, startAt: number): Promise<MultiversXApiTransaction[]> {
    const after = Math.max(1, startAt);
    const { data: transactionsCount } = await network<number>({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/transactions/count?after=${after}`,
    });

    const allTransactions = await fetchAllTransactions(
      transactionsCount,
      (from, size, before) =>
        `${this.API_URL}/accounts/${addr}/transactions?after=${after}&from=${from}&size=${size}` +
        (before !== undefined ? `&before=${before}` : "") +
        `&withOperations=true&withScResults=true`,
    );
    for (const transaction of allTransactions) {
      transaction.mode = decodeTransactionMode(transaction.action) as MultiversXTransactionMode;
    }
    return allTransactions;
  }

  async getAccountDelegations(addr: string): Promise<MultiversXDelegation[]> {
    const { data: delegations } = await network<MultiversXDelegation[]>({
      method: "GET",
      url: `${this.DELEGATION_API_URL}/accounts/${addr}/delegations`,
    });
    return delegations ?? [];
  }

  async getESDTTransactionsForAddress(
    addr: string,
    token: string,
    startAt: number,
  ): Promise<MultiversXApiTransaction[]> {
    const after = Math.max(1, startAt);
    const { data: tokenTransactionsCount } = await network<number>({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/transactions/count?token=${token}&after=${after}`,
    });

    const allTokenTransactions = await fetchAllTransactions(
      tokenTransactionsCount,
      (from, size, before) =>
        `${this.API_URL}/accounts/${addr}/transactions?token=${token}&from=${from}&after=${after}&size=${size}` +
        (before !== undefined ? `&before=${before}` : ""),
    );

    for (const esdtTransaction of allTokenTransactions) {
      (esdtTransaction as { transfer?: string }).transfer =
        "esdt" as unknown as MultiversXTransferOptions;
    }

    return allTokenTransactions;
  }

  async getESDTTokensForAddress(addr: string): Promise<ESDTToken[]> {
    const { data: tokensCount } = await network<number>({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/tokens/count`,
    });

    const allTokens: ESDTToken[] = [];
    let from = 0;
    while (from < tokensCount) {
      const { data: tokens } = await network<ESDTToken[]>({
        method: "GET",
        url: `${this.API_URL}/accounts/${addr}/tokens?from=${from}&size=${MAX_PAGINATION_SIZE}`,
      });
      allTokens.push(...(tokens ?? []));
      from = from + MAX_PAGINATION_SIZE;
    }
    return allTokens;
  }

  async getESDTTokensCountForAddress(addr: string): Promise<number> {
    const { data: tokensCount } = await network<number>({
      method: "GET",
      url: `${this.API_URL}/accounts/${addr}/tokens/count`,
    });
    return tokensCount;
  }

  async getBlockchainBlockHeight(): Promise<number> {
    const {
      data: [{ round: blockHeight }],
    } = await network<BlockRoundResponse[]>({
      method: "GET",
      url: `${this.API_URL}/blocks?shard=${METACHAIN_SHARD}&fields=round`,
    });
    return blockHeight;
  }

  async getAccountNonce(addr: string): Promise<number> {
    const { nonce } = await this.getAccountDetails(addr);
    return nonce;
  }
}

export function createNetworkApi(
  apiEndpoint: string,
  delegationApiEndpoint: string,
): MultiversXNetworkApi {
  return new MultiversXNetworkApi(apiEndpoint, delegationApiEndpoint);
}
