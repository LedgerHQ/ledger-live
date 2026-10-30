import type { UpdatesPage } from "@domain/api-account-portfolio";
import type { AccountOperationsPage } from "@domain/entity-account-operation";
import type { AddressAccountDescriptor } from "@domain/entity-account-descriptor";
import type { Unserved } from "../serviceAccount";
import { toAccountOperations } from "./map";

export type Verdict = { status: "served"; page: AccountOperationsPage; detail?: string } | Unserved;

export function verdictOf(descriptor: AddressAccountDescriptor, page: UpdatesPage): Verdict {
  const { rows, unmapped, unreadable } = toAccountOperations(descriptor, page.items);
  if (unreadable > 0) return { status: "failed", detail: `${unreadable} unreadable updates` };
  const detail = unmapped > 0 ? `${unmapped} token changes without a CAL id left out` : undefined;
  const nextCursor = page.nextToken ?? undefined;
  return {
    status: "served",
    page: nextCursor === undefined ? { operations: rows } : { operations: rows, nextCursor },
    detail,
  };
}
