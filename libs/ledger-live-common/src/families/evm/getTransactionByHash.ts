import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { getNodeApi, type NodeApi } from "@ledgerhq/coin-evm/network";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import type { Account, Operation } from "@ledgerhq/types-live";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import { chainReadsFor } from "../../bridge/generic-coin-framework/chainReads";
import { isPortfolioEnabledFor } from "../../bridge/generic-coin-framework/portfolio/config";

/** A transaction as the portfolio layer, or the synced account, tells it. */
export type EvmPortfolioTransaction = {
  hash: string;
  blockHeight: number | undefined;
  blockHash: string | undefined;
  /** The native amount it transfers, in wei, decimal. */
  value: string;
};

/**
 * What the swap live app's `custom.getTransactionByHash` answers: the node's transaction on the
 * legacy path; through the portfolio layer, its hash, block and value (no nonce, gas used nor gas
 * price: the portfolio's transaction carries none); `{}` while it is not found.
 */
export type EvmTransactionByHash =
  | Awaited<ReturnType<NodeApi["getTransaction"]>>
  | EvmPortfolioTransaction
  | Record<string, never>;

/** The native amount of a transaction the account holds: a sent operation's value carries its fee. */
const nativeValueOf = (op: Operation): string =>
  (op.type === "OUT" || op.type === "FEES" ? op.value.minus(op.fee) : op.value).toFixed();

/**
 * The transaction as the synced account holds it, once in a block: what a portfolio that looks no
 * transaction up (G1) answers, as `isTransactionConfirmed` does.
 */
function syncedTransaction(account: Account, hash: string): EvmTransactionByHash {
  const op = account.operations.find(({ hash: held }) => held === hash);
  if (typeof op?.blockHeight !== "number") return {};
  return {
    hash,
    blockHeight: op.blockHeight,
    blockHash: op.blockHash ?? undefined,
    value: nativeValueOf(op),
  };
}

async function throughPortfolio(account: Account, hash: string): Promise<EvmTransactionByHash> {
  const chain = await chainReadsFor(account.currency);
  try {
    const info = await chain.getTransactionInfo(hash);
    if (!info) return {};
    return {
      hash: info.hash,
      blockHeight: info.block?.height,
      blockHash: info.block?.hash,
      value: (info.value ?? 0n).toString(),
    };
  } catch (error) {
    if (error instanceof ChainReadUnsupportedError) return syncedTransaction(account, hash);
    // As the node's failure: not found yet, the live app polls again.
    return {};
  }
}

/**
 * A transaction of an EVM account, for the swap live app (`custom.getTransactionByHash`): through
 * the portfolio layer when the coin config of the currency enables it, from the node otherwise.
 * A failed lookup answers `{}`: the node just did not find the transaction yet.
 */
export async function getEvmTransactionByHash(
  mainAccount: Account,
  hash: string,
): Promise<EvmTransactionByHash> {
  const { currency } = mainAccount;
  if (isPortfolioEnabledFor(currency.id)) return throughPortfolio(mainAccount, hash);
  const evmCtx = buildContext<EvmConfigInfo>(currency.id);
  const config = await evmCtx.config();
  const nodeApi = getNodeApi(config, evmCtx.logger);
  try {
    return await nodeApi.getTransaction(hash);
  } catch {
    return {};
  }
}
