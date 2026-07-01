import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation, ListOperationsOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { AleoOperation } from "../types/bridge";
import { fetchAccountTransactionsFromHeight } from "../network/utils";
import { apiClient } from "../network/api";
import { TRANSACTION_TYPE } from "../constants";
import {
  getCalTokens,
  toCoinFrameworkOperation,
  toBridgeOperation,
  extractStakingAmountFromTransactionDetails,
} from "./utils";
import type { AleoCoinConfig, AleoPublicTransaction } from "../types";

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

const STAKING_AMOUNT_FUNCTIONS: ReadonlySet<string> = new Set([
  TRANSACTION_TYPE.BOND_PUBLIC,
  TRANSACTION_TYPE.UNBOND_PUBLIC,
]);

/**
 * bond_public/unbond_public rows always report amount=0 from the indexer's transaction list;
 * this fetches the real amount from each transaction's on-chain execution data, in parallel,
 * batched to avoid a request storm on accounts with a lot of staking history.
 */
async function fetchStakingAmountOverrides(
  currency: CryptoCurrency,
  transactions: AleoPublicTransaction[],
): Promise<Map<string, BigNumber>> {
  const overrides = new Map<string, BigNumber>();
  const candidates = transactions.filter(
    tx => STAKING_AMOUNT_FUNCTIONS.has(tx.function_id) && tx.amount <= 0,
  );

  if (candidates.length === 0) {
    return overrides;
  }

  await promiseAllBatched(4, candidates, async tx => {
    try {
      const details = await apiClient.getTransactionById(currency, tx.transaction_id);
      const amount = extractStakingAmountFromTransactionDetails(details, tx.function_id);
      if (amount) {
        overrides.set(tx.transaction_id, amount);
      }
    } catch (e) {
      log("aleo/listOperations", `failed to enrich staking amount for ${tx.transaction_id}`, e);
    }
  });

  return overrides;
}

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

  const stakingAmountOverrides =
    mode === "bridge"
      ? await fetchStakingAmountOverrides(currency, result.transactions)
      : new Map<string, BigNumber>();

  for (const rawTx of result.transactions) {
    if (mode === "coin-framework") {
      operations.push(toCoinFrameworkOperation(rawTx, address));
    } else {
      const isTokenTx = calTokens.has(rawTx.program_id);
      const op = toBridgeOperation(params.ledgerAccountId, rawTx, address, isTokenTx);
      const stakingAmountOverride = stakingAmountOverrides.get(rawTx.transaction_id);
      if (stakingAmountOverride) {
        op.value = stakingAmountOverride;
      }
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
