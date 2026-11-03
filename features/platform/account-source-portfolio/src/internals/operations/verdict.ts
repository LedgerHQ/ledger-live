import type { UpdatesPage } from "@domain/api-account-portfolio";
import type { AccountOperationsPage } from "@domain/entity-account-operation";
import type { AddressAccountDescriptor } from "@domain/entity-account-descriptor";
import { toAccountOperations, type MapOptions } from "./map";

export type Verdict =
  | { status: "served"; page: AccountOperationsPage; detail?: string }
  | { status: "failed"; detail: string };

export function verdictOf(
  descriptor: AddressAccountDescriptor,
  page: UpdatesPage,
  options?: MapOptions,
): Verdict {
  const { rows, unmapped, unreadable } = toAccountOperations(descriptor, page.items, options);
  if (unreadable > 0) return { status: "failed", detail: `${unreadable} unreadable updates` };
  const detail = unmapped > 0 ? `${unmapped} token changes without a CAL id left out` : undefined;
  const nextCursor = page.nextToken ?? undefined;
  return {
    status: "served",
    page: nextCursor === undefined ? { operations: rows } : { operations: rows, nextCursor },
    detail,
  };
}
