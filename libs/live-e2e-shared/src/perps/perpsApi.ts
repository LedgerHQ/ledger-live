/** Staging live app proxy; it adds the partner keys. */
export const DEFAULT_PERPS_API_URL = "https://perps.live.ledger-test.com/proxy/perps/v1";

export type PerpsPosition = {
  providerId: string;
  marketId: string;
  side: string;
  size: string;
};

export type PerpsOrder = {
  providerId: string;
  marketId: string;
  cancelArgs: Record<string, unknown>;
};

export type PerpsActionType = "close" | "cancelOrder" | "open";

export type PerpsActionRequest = {
  providerId: string;
  address: string;
  action: PerpsActionType;
  args: Record<string, unknown>;
};

export type PerpsTransaction = {
  id: string;
  signingFormat?: string;
  signablePayload?: Record<string, unknown>;
  rawPayload?: Record<string, unknown>;
};

export type PerpsAction = {
  id: string;
  status: string;
  signedMetadata?: unknown;
  transactions: PerpsTransaction[];
};

export type PerpsPolling = { intervalMs: number; attempts: number };

const JSON_HEADERS = { "Content-Type": "application/json" };
const REQUEST_TIMEOUT_MS = 30_000;
const DEFAULT_POLLING: PerpsPolling = { intervalMs: 2_000, attempts: 45 };
const FINAL_FAILURES = new Set(["FAILED", "CANCELED", "STALE"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const getString = (value: Record<string, unknown>, key: string): string => {
  const field = value[key];
  if (typeof field !== "string") throw new Error(`Perps API: "${key}" is not a string`);
  return field;
};

function findCancelArgs(order: Record<string, unknown>): Record<string, unknown> {
  const pending = Array.isArray(order.pendingActions) ? order.pendingActions : [];
  const cancel = pending.find(item => isRecord(item) && item.type === "cancelOrder");
  if (!isRecord(cancel) || !isRecord(cancel.args)) {
    throw new Error(`Perps API: order on ${String(order.marketId)} cannot be cancelled`);
  }
  return cancel.args;
}

const inScope =
  (marketIds?: readonly string[]) =>
  (item: Record<string, unknown>): boolean =>
    marketIds === undefined || marketIds.includes(String(item.marketId));

export class PerpsApi {
  constructor(
    private readonly baseUrl = DEFAULT_PERPS_API_URL,
    private readonly polling = DEFAULT_POLLING,
  ) {}

  private async request(pathname: string, init?: RequestInit): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${pathname}`, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Perps API ${pathname} failed: ${response.status} ${detail}`.trim());
    }
    return response.json();
  }

  private post(pathname: string, body: unknown): Promise<unknown> {
    return this.request(pathname, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
  }

  /** Provider ids, listed the same way as the live app. */
  async getProviderIds(): Promise<string[]> {
    const providers = await this.request("/providers");
    if (!Array.isArray(providers)) throw new Error("Perps API /providers: expected an array");
    return providers.filter(isRecord).map(provider => getString(provider, "id"));
  }

  async getMarketSymbol(marketId: string): Promise<string> {
    const market = await this.request(`/markets/${encodeURIComponent(marketId)}`);
    if (!isRecord(market) || !isRecord(market.baseAsset)) {
      throw new Error(`Perps API: market ${marketId} has no base asset`);
    }
    return getString(market.baseAsset, "symbol");
  }

  // Filters by market first, so unrelated items are never validated.
  private async list(
    pathname: "/positions" | "/orders",
    address: string,
    marketIds?: readonly string[],
  ): Promise<{ providerId: string; item: Record<string, unknown> }[]> {
    const perProvider = await Promise.all(
      (await this.getProviderIds()).map(async providerId => {
        const items = await this.post(pathname, { address, providerId });
        if (!Array.isArray(items)) throw new Error(`Perps API ${pathname}: expected an array`);
        return items
          .filter(isRecord)
          .filter(inScope(marketIds))
          .map(item => ({ providerId, item }));
      }),
    );
    return perProvider.flat();
  }

  /** Open positions, on `marketIds` only when given. */
  async getPositions(address: string, marketIds?: readonly string[]): Promise<PerpsPosition[]> {
    return (await this.list("/positions", address, marketIds)).map(({ providerId, item }) => ({
      providerId,
      marketId: getString(item, "marketId"),
      side: getString(item, "side"),
      size: getString(item, "size"),
    }));
  }

  /** Open orders, on `marketIds` only when given. */
  async getOrders(address: string, marketIds?: readonly string[]): Promise<PerpsOrder[]> {
    return (await this.list("/orders", address, marketIds)).map(({ providerId, item }) => ({
      providerId,
      marketId: getString(item, "marketId"),
      cancelArgs: findCancelArgs(item),
    }));
  }

  async createAction(body: PerpsActionRequest): Promise<PerpsAction> {
    const action = await this.post("/actions", body);
    if (!isRecord(action) || !Array.isArray(action.transactions)) {
      throw new Error("Perps API /actions: unexpected response");
    }
    return {
      id: getString(action, "id"),
      status: getString(action, "status"),
      signedMetadata: action.signedMetadata,
      transactions: action.transactions.filter(isRecord).map(tx => ({
        id: getString(tx, "id"),
        signingFormat: typeof tx.signingFormat === "string" ? tx.signingFormat : undefined,
        signablePayload: isRecord(tx.signablePayload) ? tx.signablePayload : undefined,
        rawPayload: isRecord(tx.rawPayload) ? tx.rawPayload : undefined,
      })),
    };
  }

  async submitTransaction(transactionId: string, signedPayload: string): Promise<void> {
    await this.post(`/transactions/${encodeURIComponent(transactionId)}/submit`, {
      signedPayload,
    });
  }

  async waitForAction(actionId: string): Promise<void> {
    for (let attempt = 0; attempt < this.polling.attempts; attempt++) {
      const action = await this.request(`/actions/${encodeURIComponent(actionId)}`);
      const status = isRecord(action) ? action.status : undefined;
      if (status === "SUCCESS") return;
      if (typeof status === "string" && FINAL_FAILURES.has(status)) {
        throw new Error(`Perps action ${actionId} ended as ${status}`);
      }
      await new Promise(resolve => setTimeout(resolve, this.polling.intervalMs));
    }
    throw new Error(`Perps action ${actionId} did not succeed in time`);
  }
}
