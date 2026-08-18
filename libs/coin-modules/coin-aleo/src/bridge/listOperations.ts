import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { AleoOperation } from "../types/bridge";
import { fetchAccountTransactionsFromHeight } from "../network/utils";
import { getCalTokens, toBridgeOperation } from "./utils";
import type { AleoCoinConfig } from "../types";

export async function listOperations({
  currencyId,
  address,
  ledgerAccountId,
  options,
  config,
}: {
  currencyId: string;
  address: string;
  ledgerAccountId: string;
  options: ListOperationsOptions;
  config: AleoCoinConfig;
}): Promise<{
  readonly operations: AleoOperation[];
  readonly tokenOperations: AleoOperation[];
  readonly nextCursor: string | null;
  readonly calTokens: Map<string, TokenCurrency>;
}> {
  const operations: AleoOperation[] = [];
  const tokenOperations: AleoOperation[] = [];

  const result = await fetchAccountTransactionsFromHeight({
    config,
    address,
    fetchAllPages: true,
    minBlockHeight: options.minHeight,
    ...(options.cursor && { cursor: options.cursor }),
    ...(options.limit && { limit: options.limit }),
    ...(options.order && { order: options.order }),
  });

  const calTokens = config.enableTokens
    ? await getCalTokens({
        currencyId,
        programNames: result.transactions.map(rawTx => rawTx.program_id),
      })
    : new Map<string, TokenCurrency>();

  for (const rawTx of result.transactions) {
    const isTokenTx = calTokens.has(rawTx.program_id);
    const op = toBridgeOperation(ledgerAccountId, rawTx, address, isTokenTx);
    operations.push(op);
    if (isTokenTx) {
      tokenOperations.push(op);
    }
  }

  return {
    operations,
    tokenOperations,
    nextCursor: result.nextCursor,
    calTokens,
  };
}
