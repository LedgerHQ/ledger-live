import type { AccountId } from "@domain/entity-account";
import type { AccountBalance } from "@domain/entity-account-balance";
import type { AccountOperation } from "@domain/entity-account-operations";

export type AccountRef = {
  accountId: AccountId;
  currencyId: string;
  address: string;
  derivationMode: string;
};

export const refKeyOf = (ref: AccountRef): string =>
  [ref.accountId, ref.currencyId, ref.address, ref.derivationMode].join("|");

export type AccountOperationsQuery = { cursor?: string; limit?: number };

export type AccountOperationsPage = {
  operations: AccountOperation[];
  nextCursor?: string;
  complete: boolean;
  total?: number;
};

/** The single boundary with the implementations: each source implements only what it supports. */
export type AccountDataSource = {
  readonly id: string;
  supports(ref: AccountRef): boolean;
  getBalances?(ref: AccountRef, signal?: AbortSignal): Promise<AccountBalance[]>;
  getOperations?(
    ref: AccountRef,
    query: AccountOperationsQuery,
    signal?: AbortSignal,
  ): Promise<AccountOperationsPage>;
};

export type AccountDataMethod = Exclude<keyof AccountDataSource, "id" | "supports">;
