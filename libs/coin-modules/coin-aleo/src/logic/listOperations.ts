import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { apiClient } from "../network/api";
import type { AleoOperation } from "../types/bridge";
import { parseOperation } from "./utils";

export async function listOperations({
  currency,
  address,
  ledgerAccountId,
  pagination,
  direction = "next",
  fetchAllPages,
}: {
  currency: CryptoCurrency;
  address: string;
  ledgerAccountId: string;
  pagination: Pagination;
  direction: "prev" | "next" | undefined;
  fetchAllPages: boolean;
}): Promise<{ publicOperations: AleoOperation[] }> {
  const publicOperations: AleoOperation[] = [];
  const result = await apiClient.getAccountPublicTransactions({
    currency,
    address,
    minHeight: pagination.minHeight,
    order: pagination.order,
    direction,
    limit: pagination.limit,
    fetchAllPages,
  });

  // currently we only support native aleo coin operations & ignore rest
  const nativePublicTransactions = result.transactions.filter(
    tx => tx.program_id === "credits.aleo",
  );

  for (const rawTx of nativePublicTransactions) {
    const parsedOperation = await parseOperation({
      currency,
      rawTx,
      address,
      ledgerAccountId,
    });

    publicOperations.push(parsedOperation);
  }

  return {
    publicOperations,
  };
}
