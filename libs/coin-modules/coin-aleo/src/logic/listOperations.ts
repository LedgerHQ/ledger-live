import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation, ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { AleoOperation } from "../types/bridge";
import { fetchAccountTransactionsFromHeight } from "../network/utils";
import { resolveTokenCurrenciesByProgram } from "../bridge/tokens";
import { toCoinFrameworkOperation, toBridgeOperation } from "./utils";

interface Params {
  currency: CryptoCurrency;
  address: string;
  options: ListOperationsOptions;
}

interface BridgeParams extends Params {
  mode: "bridge";
  ledgerAccountId: string;
}

interface CoinFrameworkParams extends Params {
  mode: "coin-framework";
}

type Result<T> = {
  readonly operations: T[];
  readonly tokenOperations: T[];
  readonly nextCursor: string | null;
};

export async function listOperations(params: BridgeParams): Promise<Result<AleoOperation>>;
export async function listOperations(params: CoinFrameworkParams): Promise<Result<Operation>>;
export async function listOperations(
  params: BridgeParams | CoinFrameworkParams,
): Promise<Result<AleoOperation | Operation>> {
  const { mode, currency, address, options } = params;
  const operations: Array<AleoOperation | Operation> = [];
  const tokenOperations: Array<AleoOperation | Operation> = [];
  const fetchAllPages = mode === "bridge";

  const result = await fetchAccountTransactionsFromHeight({
    currency,
    address,
    fetchAllPages,
    minBlockHeight: options.minHeight,
    ...(options.cursor && { cursor: options.cursor }),
    ...(options.limit && { limit: options.limit }),
    ...(options.order && { order: options.order }),
  });

  let tokensByProgram: Map<string, TokenCurrency> = new Map();

  if (mode === "bridge") {
    tokensByProgram = await resolveTokenCurrenciesByProgram({
      programNames: result.transactions.map(rawTx => rawTx.program_id),
      currencyId: currency.id,
    });
  }

  for (const rawTx of result.transactions) {
    if (mode === "coin-framework") {
      operations.push(toCoinFrameworkOperation(rawTx, address));
    } else {
      const isToken = tokensByProgram.has(rawTx.program_id);
      const op = toBridgeOperation(params.ledgerAccountId, rawTx, address, isToken);
      operations.push(op);
      if (isToken) {
        tokenOperations.push(op);
      }
    }
  }

  return {
    operations,
    tokenOperations,
    nextCursor: result.nextCursor,
  };
}
