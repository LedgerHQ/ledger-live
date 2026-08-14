import type { ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { listPublicOperations } from "../logic/listPublicOperations";
import { getCalTokens, toBridgeOperation } from "../logic/utils";
import type { AleoCoinConfig } from "../types";
import type { AleoOperation } from "../types/bridge";

export async function listOperations({
  config,
  currencyId,
  address,
  options,
  ledgerAccountId,
}: {
  config: AleoCoinConfig;
  currencyId: string;
  address: string;
  options: ListOperationsOptions;
  ledgerAccountId: string;
}): Promise<{
  operations: AleoOperation[];
  tokenOperations: AleoOperation[];
  nextCursor: string | null;
  calTokens: Map<string, TokenCurrency>;
}> {
  const operations: AleoOperation[] = [];
  const tokenOperations: AleoOperation[] = [];

  const result = await listPublicOperations({
    config,
    address,
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
    const operation = toBridgeOperation(ledgerAccountId, rawTx, address, isTokenTx);

    operations.push(operation);
    if (isTokenTx) tokenOperations.push(operation);
  }

  return { operations, tokenOperations, nextCursor: result.nextCursor, calTokens };
}
