import type BigNumber from "bignumber.js";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { AleoOperation } from "../types/bridge";
import type { AleoPublicTransaction } from "../types/api";
import { fetchAccountTransactionsFromHeight, resolveBondArguments } from "../network/utils";
import { resolveStakingOperationType } from "../logic/utils";
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

  // bond_public is the only staking call whose validator and amount the indexer drops while the
  // chain still publishes them, so only those rows are worth a per-tx lookup.
  const transactions: AleoPublicTransaction[] = [];
  const bondTransactions: AleoPublicTransaction[] = [];

  for (const rawTx of result.transactions) {
    const stakingType = resolveStakingOperationType(rawTx);
    if (stakingType !== undefined && !config.enableStaking) continue;

    transactions.push(rawTx);
    if (stakingType === "BOND") bondTransactions.push(rawTx);
  }

  const bondArgumentsByTxId =
    bondTransactions.length > 0
      ? await resolveBondArguments({ config, transactions: bondTransactions })
      : new Map<string, { validator: string; amount: BigNumber }>();

  for (const rawTx of transactions) {
    const isTokenTx = calTokens.has(rawTx.program_id);
    const op = toBridgeOperation(
      ledgerAccountId,
      rawTx,
      address,
      bondArgumentsByTxId.get(rawTx.transaction_id),
    );
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
