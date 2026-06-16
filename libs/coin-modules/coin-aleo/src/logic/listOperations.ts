import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation, ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { AleoOperation } from "../types/bridge";
import { fetchAccountTransactionsFromHeight } from "../network/utils";
import { getCalTokens, toCoinFrameworkOperation, toBridgeOperation } from "./utils";
import type { AleoCoinConfig } from "../types";

interface Params {
  currency: CryptoCurrency;
  address: string;
  options: ListOperationsOptions;
  config: AleoCoinConfig;
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
  readonly calTokens: Map<string, TokenCurrency>;
};

export async function listOperations(params: BridgeParams): Promise<Result<AleoOperation>>;
export async function listOperations(params: CoinFrameworkParams): Promise<Result<Operation>>;
export async function listOperations(
  params: BridgeParams | CoinFrameworkParams,
): Promise<Result<AleoOperation | Operation>> {
  const { mode, currency, address, options, config } = params;
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

  let calTokens: Map<string, TokenCurrency> = new Map();

  if (config.enableTokens && mode === "bridge") {
    calTokens = await getCalTokens({
      currencyId: currency.id,
      programNames: result.transactions.map(rawTx => rawTx.program_id),
    });
  }

  for (const rawTx of result.transactions) {
    if (mode === "coin-framework") {
      operations.push(toCoinFrameworkOperation(rawTx, address));
    } else {
      const isTokenTx = calTokens.has(rawTx.program_id);
      const op = toBridgeOperation(params.ledgerAccountId, rawTx, address, isTokenTx);
      operations.push(op);
      if (isTokenTx) {
        tokenOperations.push(op);
      }
    }
  }

  return {
    operations,
    tokenOperations,
    nextCursor: result.nextCursor,
    calTokens,
  };
}
