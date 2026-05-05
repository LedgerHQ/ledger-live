import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation, ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { AleoOperation } from "../types/bridge";
import { fetchAccountTransactionsFromHeight } from "../network/utils";
import { toAlpacaOperation, toBridgeOperation } from "./utils";

interface Params {
  currency: CryptoCurrency;
  address: string;
  options: ListOperationsOptions;
}

interface BridgeParams extends Params {
  mode: "bridge";
  ledgerAccountId: string;
}

interface AlpacaParams extends Params {
  mode: "alpaca";
}

type Result<T> = {
  readonly operations: T[];
  readonly nextCursor: string | null;
};

export async function listOperations(params: BridgeParams): Promise<Result<AleoOperation>>;
export async function listOperations(params: AlpacaParams): Promise<Result<Operation>>;
export async function listOperations(
  params: BridgeParams | AlpacaParams,
): Promise<Result<AleoOperation | Operation>> {
  const { mode, currency, address, options } = params;
  const operations: Array<AleoOperation | Operation> = [];
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

  for (const rawTx of result.transactions) {
    // Skip transitions that have no direct account involvement (e.g. outer call in a batching contract).
    // Other transition, sharing the same transaction_id, will carry the real amount and addresses.
    // Testnet transaction showing this issue: at1lqugdt847uwnfem2xhzwq6ewrnd6ysjv2gumvglytskutxj3kcpsmc3rrf
    if (rawTx.sender_address === "" && rawTx.recipient_address === "") continue;

    if (mode === "alpaca") {
      operations.push(toAlpacaOperation(rawTx, address));
    } else {
      operations.push(toBridgeOperation(params.ledgerAccountId, rawTx, address));
    }
  }

  return {
    operations,
    nextCursor: result.nextCursor,
  };
}
