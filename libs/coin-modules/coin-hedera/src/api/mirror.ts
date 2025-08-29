import network from "@ledgerhq/live-network/network";
import { getEnv } from "@ledgerhq/live-env";
import type { HederaMirrorAccount, HederaMirrorToken, HederaMirrorTransaction } from "./types";
import { HederaAddAccountError } from "../errors";
import { LedgerAPI4xx } from "@ledgerhq/errors";

const getMirrorApiUrl = (): string => getEnv("API_HEDERA_MIRROR");

const fetch = (path: string) => {
  return network({
    method: "GET",
    url: `${getMirrorApiUrl()}${path}`,
  });
};

export async function getAccountsForPublicKey(publicKey: string): Promise<HederaMirrorAccount[]> {
  let r;
  try {
    r = await fetch(`/api/v1/accounts?account.publicKey=${publicKey}&balance=true&limit=100`);
  } catch (e: any) {
    if (e.name === "LedgerAPI4xx") return [];
    throw e;
  }

  const accounts = r.data.accounts as HederaMirrorAccount[];

  return accounts;
}

export async function getAccount(address: string): Promise<HederaMirrorAccount> {
  try {
    const res = await fetch(`/api/v1/accounts/${address}`);
    const account = res.data as HederaMirrorAccount;

    return account;
  } catch (error) {
    if (error instanceof LedgerAPI4xx && "status" in error && error.status === 404) {
      throw new HederaAddAccountError();
    }

    throw error;
  }
}

export async function getAccountTransactions(
  address: string,
  since: string | null,
): Promise<HederaMirrorTransaction[]> {
  const transactions: HederaMirrorTransaction[] = [];
  const params = new URLSearchParams({
    "account.id": address,
    order: "desc",
    limit: "100",
  });

  if (since) {
    params.append("timestamp", `gt:${since}`);
  }

  let nextUrl = `/api/v1/transactions?${params.toString()}`;

  // WARNING: don't break the loop when `transactions` array is empty but `links.next` is present
  // the mirror node API enforces a 60-day max time range per query, even if `timestamp` param is set
  // see: https://hedera.com/blog/changes-to-the-hedera-operated-mirror-node
  while (nextUrl) {
    const res = await fetch(nextUrl);
    const newTransactions = res.data.transactions as HederaMirrorTransaction[];
    transactions.push(...newTransactions);
    nextUrl = res.data.links.next;
  }

  return transactions;
}

export async function getAccountTokens(address: string): Promise<HederaMirrorToken[]> {
  const tokens: HederaMirrorToken[] = [];
  const params = new URLSearchParams({
    limit: "100",
  });

  let nextUrl = `/api/v1/accounts/${address}/tokens?${params.toString()}`;

  while (nextUrl) {
    const res = await fetch(nextUrl);
    const newTokens = res.data.tokens as HederaMirrorToken[];
    tokens.push(...newTokens);
    nextUrl = res.data.links.next;
  }

  return tokens;
}
