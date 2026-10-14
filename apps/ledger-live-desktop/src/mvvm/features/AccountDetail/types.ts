import type { Account, AccountLike } from "@ledgerhq/types-live";

export type RouteAccount = Readonly<{
  account?: AccountLike;
  parentAccount?: Account;
  mainAccount?: Account;
}>;

type AccountDetailRedirecting = Readonly<{ mode: "redirecting" }>;

export type AccountDetailReady = Readonly<{
  mode: "ready";
  account: Account;
}>;

export type AccountDetailViewModel = AccountDetailRedirecting | AccountDetailReady;
