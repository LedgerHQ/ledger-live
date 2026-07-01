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

/**
 * claim_unbond_public always reports amount=0 from the indexer (it carries no amount argument
 * on-chain at all), so the claimed amount is reconstructed by walking backward through the
 * account's transaction history (paged, most recent first) starting at the claim's block,
 * summing unbond_public amounts until either a prior claim_unbond_public is hit (excluded from
 * the sum) or history is exhausted. Returns null when no unbond_public precedes this claim.
 */
export async function sumUnbondedSinceLastClaim(
  currency: CryptoCurrency,
  address: string,
  claimTx: AleoPublicTransaction,
): Promise<BigNumber | null> {
  let sum = new BigNumber(0);
  let foundAny = false;
  let cursor: string | undefined = claimTx.block_number.toString();
  let hasMorePages = true;

  while (hasMorePages) {
    const page = await apiClient.getAccountPublicTransactions({
      currency,
      address,
      order: "desc",
      limit: 50,
      ...(cursor && { cursor }),
    });

    for (const tx of page.transactions) {
      if (tx.transaction_id === claimTx.transaction_id) continue;

      if (tx.function_id === TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC) {
        return foundAny ? sum : null;
      }

      if (tx.function_id === TRANSACTION_TYPE.UNBOND_PUBLIC) {
        try {
          const details = await apiClient.getTransactionById(currency, tx.transaction_id);
          const amount = extractStakingAmountFromTransactionDetails(details, tx.function_id);
          if (amount) {
            sum = sum.plus(amount);
            foundAny = true;
          }
        } catch (e) {
          log(
            "aleo/listOperations",
            `failed to enrich unbond amount for claim reconstruction ${tx.transaction_id}`,
            e,
          );
        }
      }
    }

    const nextCursor = page.next_cursor?.block_number.toString();
    hasMorePages = Boolean(nextCursor);
    cursor = nextCursor;
  }

  return foundAny ? sum : null;
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

  const claimTransactions = result.transactions.filter(
    tx => tx.function_id === TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC,
  );
  const claimAmounts =
    mode === "bridge" && claimTransactions.length > 0
      ? new Map(
          await Promise.all(
            claimTransactions.map(
              async tx =>
                [tx.transaction_id, await sumUnbondedSinceLastClaim(currency, address, tx)] as const,
            ),
          ),
        )
      : new Map<string, BigNumber | null>();

  for (const rawTx of result.transactions) {
    if (mode === "coin-framework") {
      operations.push(toCoinFrameworkOperation(rawTx, address));
    } else {
      const isTokenTx = calTokens.has(rawTx.program_id);
      const op = toBridgeOperation(params.ledgerAccountId, rawTx, address, isTokenTx) as AleoOperation;
      const stakingAmountOverride = stakingAmountOverrides.get(rawTx.transaction_id);
      if (stakingAmountOverride) {
        if (rawTx.function_id === TRANSACTION_TYPE.BOND_PUBLIC) {
          op.extra.estimatedBondedAmount = stakingAmountOverride;
        } else if (rawTx.function_id === TRANSACTION_TYPE.UNBOND_PUBLIC) {
          op.extra.estimatedUnbondedAmount = stakingAmountOverride;
        }
      }
      const claimAmount = claimAmounts.get(rawTx.transaction_id);
      if (claimAmount) {
        op.extra.estimatedWithdrawUnbondedAmount = claimAmount;
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
