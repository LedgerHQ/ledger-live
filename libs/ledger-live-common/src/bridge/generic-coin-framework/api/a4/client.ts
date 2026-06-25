import network from "@ledgerhq/live-network";

/**
 * Map a Ledger Live currency id to the A4 network segment used in the URL path.
 *
 * For most chains the id matches the A4 network name (e.g. "ethereum"). EVM L2s and other
 * chains whose A4 name differs from the LL id must be added here.
 */
const A4_NETWORK_BY_CURRENCY_ID: Record<string, string> = {
  // TODO: fill in chains where the A4 network name differs from the LL currency id.
};

export function toA4Network(network: string): string {
  return A4_NETWORK_BY_CURRENCY_ID[network] ?? network;
}

export type A4SyncStatus = "Uninitialized" | "Waiting" | "Synchronized";

export type A4Account = {
  accountId: string;
  syncStatus: A4SyncStatus;
  version: string;
};

/** Tag set on the account at creation so A4 knows the registering client. */
export type A4Tag = { key: string; value: string };
const LEDGER_WALLET_TAG: A4Tag = { key: "source", value: "Ledger Wallet" };

export type A4BalanceValue = { type: string; value: string };
export type A4Balances = { assets: Record<string, A4BalanceValue> };

export type A4Block = { hash: string; height: number; time: string };
export type A4Operation = {
  txId: string;
  block: A4Block;
  asset: string;
  amount: string;
  type: string;
  fees?: string;
  feesPayer?: string;
  senders?: string[];
  recipients?: string[];
  failed?: boolean;
  internal?: boolean;
  /** Catch-all for additional A4 fields not modelled above. */
  [key: string]: unknown;
};
export type A4OperationsPage = {
  items: A4Operation[];
  next: { cursor?: string } | null;
};

/** Error thrown by the A4 client, exposing the HTTP status for failover decisions. */
export class A4HttpError extends Error {
  constructor(
    readonly status: number | undefined,
    message: string,
  ) {
    super(message);
    this.name = "A4HttpError";
  }
}

const VERSION_HEADER = "a4-account-version";

type A4Result<T> = { data: T; version?: string };

function readVersion(headers: unknown): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;
  const value = (headers as Record<string, unknown>)[VERSION_HEADER];
  return typeof value === "string" ? value : undefined;
}

function toHttpError(error: unknown): A4HttpError {
  const e = error as {
    status?: number;
    response?: { status?: number };
    message?: string;
  };
  const status = e?.status ?? e?.response?.status;
  return new A4HttpError(status, e?.message ?? "A4 request failed");
}

/**
 * Low-level A4 HTTP client bound to a single network. Stateless with respect to account
 * version: callers pass the last-known version (sent as `A4-If-Account-Version`) and receive
 * the server's version back so they can persist it.
 */
export class A4Client {
  private readonly baseURL: string;

  constructor(network: string, endpoint: string) {
    this.baseURL = `${endpoint}/${toA4Network(network)}`;
  }

  private headers(ifVersion?: string): Record<string, string> {
    return ifVersion ? { "A4-If-Account-Version": ifVersion } : {};
  }

  async getAccount(
    accountId: string,
    ifVersion?: string,
  ): Promise<A4Result<A4Account>> {
    try {
      const { data, headers } = await network<A4Account>({
        method: "GET",
        url: `${this.baseURL}/v2/account/${accountId}`,
        headers: this.headers(ifVersion),
      });
      return { data, version: readVersion(headers) };
    } catch (error) {
      throw toHttpError(error);
    }
  }

  async createAccount(accountId: string): Promise<A4Result<A4Account>> {
    try {
      const { data, headers } = await network<A4Account, { tags: A4Tag[] }>({
        method: "PUT",
        url: `${this.baseURL}/v2/account/${accountId}`,
        data: { tags: [LEDGER_WALLET_TAG] },
      });
      return { data, version: readVersion(headers) };
    } catch (error) {
      throw toHttpError(error);
    }
  }

  async addAddresses(
    accountId: string,
    addresses: string[],
    ifVersion?: string,
  ): Promise<A4Result<{ version: string }>> {
    try {
      const { data, headers } = await network<{ version: string }, string[]>({
        method: "PUT",
        url: `${this.baseURL}/v2/account/${accountId}/addresses`,
        headers: this.headers(ifVersion),
        data: addresses,
      });
      return { data, version: readVersion(headers) ?? data?.version };
    } catch (error) {
      throw toHttpError(error);
    }
  }

  async getBalances(
    accountId: string,
    ifVersion?: string,
  ): Promise<A4Result<A4Balances>> {
    try {
      const { data, headers } = await network<A4Balances>({
        method: "GET",
        url: `${this.baseURL}/v2/account/${accountId}/state/balance`,
        headers: this.headers(ifVersion),
        params: { atBlock: "latest" },
      });
      return { data, version: readVersion(headers) };
    } catch (error) {
      throw toHttpError(error);
    }
  }

  async listOperations(
    accountId: string,
    options: { minHeight?: number; cursor?: string; size?: number },
    ifVersion?: string,
  ): Promise<A4Result<A4OperationsPage>> {
    const { minHeight = 0, cursor, size = 200 } = options;
    try {
      const { data, headers } = await network<A4OperationsPage>({
        method: "GET",
        url: `${this.baseURL}/v2/account/${accountId}/state/operations`,
        headers: this.headers(ifVersion),
        params: {
          blocks: `[${minHeight},latest]`,
          size,
          ...(cursor ? { cursor } : {}),
        },
      });
      return { data, version: readVersion(headers) };
    } catch (error) {
      throw toHttpError(error);
    }
  }
}
