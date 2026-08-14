import type { ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { fetchAllTransitionsFromHeight } from "../network/utils";
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
  calTokens: Map<string, TokenCurrency>;
}> {
  const operations: AleoOperation[] = [];
  const tokenOperations: AleoOperation[] = [];

  const transitions = await fetchAllTransitionsFromHeight({
    config,
    address,
    minBlockHeight: options.minHeight,
    // The stored block is already synced, and a block-only cursor resumes after all of it.
    ...(options.cursor && { cursor: { blockNumber: Number(options.cursor) } }),
    ...(options.order && { order: options.order }),
  });

  const calTokens = config.enableTokens
    ? await getCalTokens({
        currencyId,
        programNames: transitions.map(rawTx => rawTx.program_id),
      })
    : new Map<string, TokenCurrency>();

  for (const rawTx of transitions) {
    const isTokenTx = calTokens.has(rawTx.program_id);
    const operation = toBridgeOperation(ledgerAccountId, rawTx, address, isTokenTx);

    operations.push(operation);
    if (isTokenTx) tokenOperations.push(operation);
  }

  return { operations, tokenOperations, calTokens };
}
