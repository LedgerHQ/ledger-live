import network from "@ledgerhq/live-network";
import type { LiveNetworkResponse } from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { HederaAddAccountError } from "../errors";
import type {
  HederaMirrorAccountTokensResponse,
  HederaMirrorTransactionsResponse,
  HederaMirrorAccount,
  HederaMirrorAccountsResponse,
  HederaMirrorToken,
  HederaMirrorTransaction,
} from "../types";

const getMirrorApiUrl = (): string => getEnv("API_HEDERA_MIRROR");

const fetch = <Result>(path: string) => {
  return network<Result>({
    method: "GET",
    url: `${getMirrorApiUrl()}${path}`,
  });
};

async function getAccountsForPublicKey(publicKey: string): Promise<HederaMirrorAccount[]> {
  let r;
  try {
    r = await fetch<HederaMirrorAccountsResponse>(
      `/api/v1/accounts?account.publicKey=${publicKey}&balance=true&limit=100`,
    );
  } catch (e: unknown) {
    if (e instanceof LedgerAPI4xx) return [];
    throw e;
  }

  const accounts = r.data.accounts;

  return accounts;
}

async function getAccount(address: string): Promise<HederaMirrorAccount> {
  try {
    const res = await fetch<HederaMirrorAccount>(`/api/v1/accounts/${address}`);
    const account = res.data;

    return account;
  } catch (error) {
    if (error instanceof LedgerAPI4xx && "status" in error && error.status === 404) {
      throw new HederaAddAccountError();
    }

    throw error;
  }
}

async function getAccountTransactions({
  address,
  since,
  limit = 100,
  order = "desc",
}: {
  address: string;
  since: string | null;
  limit?: number | undefined;
  order?: "asc" | "desc" | undefined;
}): Promise<HederaMirrorTransaction[]> {
  const transactions: HederaMirrorTransaction[] = [];
  const params = new URLSearchParams({
    "account.id": address,
    limit: limit.toString(),
    order,
  });

  if (since) {
    params.append("timestamp", `gt:${since}`);
  }

  let nextUrl: string | null = `/api/v1/transactions?${params.toString()}`;

  // WARNING: don't break the loop when `transactions` array is empty but `links.next` is present
  // the mirror node API enforces a 60-day max time range per query, even if `timestamp` param is set
  // see: https://hedera.com/blog/changes-to-the-hedera-operated-mirror-node
  while (nextUrl) {
    const res: LiveNetworkResponse<HederaMirrorTransactionsResponse> = await fetch(nextUrl);
    const newTransactions = res.data.transactions;
    transactions.push(...newTransactions);
    nextUrl = res.data.links.next;
  }

  return transactions;
}

async function getAccountTokens(address: string): Promise<HederaMirrorToken[]> {
  const tokens: HederaMirrorToken[] = [];
  const params = new URLSearchParams({
    limit: "100",
  });

  let nextUrl: string | null = `/api/v1/accounts/${address}/tokens?${params.toString()}`;

  while (nextUrl) {
    const res: LiveNetworkResponse<HederaMirrorAccountTokensResponse> = await fetch(nextUrl);
    const newTokens = res.data.tokens;
    tokens.push(...newTokens);
    nextUrl = res.data.links.next;
  }

  return tokens;
}

export const hederaMirrorNode = {
  getAccountsForPublicKey,
  getAccount,
  getAccountTokens,
  getAccountTransactions,
};
