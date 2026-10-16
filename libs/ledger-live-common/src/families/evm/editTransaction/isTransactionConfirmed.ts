import { getNodeApi } from "@ledgerhq/coin-evm/network";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { ChainReadUnsupportedError } from "@ledgerhq/ledger-wallet-framework/errors";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { chainReadsFor } from "../../../bridge/generic-coin-framework/chainReads";
import { isPortfolioEnabledFor } from "../../../bridge/generic-coin-framework/portfolio/config";

/**
 * Whether the network knows the transaction in a block, through the portfolio layer. A portfolio
 * that cannot look transactions up answers from the synced account instead, as bitcoin does: the
 * account holds the transaction with a block height.
 */
async function isConfirmedThroughPortfolio(account: Account, hash: string): Promise<boolean> {
  const chain = await chainReadsFor(account.currency);
  try {
    const info = await chain.getTransactionInfo(hash);
    return Boolean(info?.block);
  } catch (error) {
    if (!(error instanceof ChainReadUnsupportedError)) throw error;
    return account.operations.some(
      op => op.hash === hash && typeof op.blockHeight === "number" && op.blockHeight > 0,
    );
  }
}

/**
 * Check if a transaction has been confirmed on the network
 * A confirmed transaction has been included in a block and
 * therefore have a blockHeight.
 * If the transaction is not confirmed, the blockHeight is null or undefined.
 *
 * Ledger explorer may return HTTP 404 for a hash that is not indexed yet (e.g. right after
 * broadcast). Treat that as "not confirmed" so wait-for-confirmation polling can continue.
 */
export const isTransactionConfirmed = async ({
  account,
  hash,
}: {
  account: AccountLike;
  hash: string;
}): Promise<boolean> => {
  if (account.type !== "Account") {
    return false;
  }
  if (isPortfolioEnabledFor(account.currency.id)) {
    return isConfirmedThroughPortfolio(account, hash);
  }
  const evmCtx = buildContext<EvmConfigInfo>(account.currency.id);
  const config = await evmCtx.config();
  const nodeApi = getNodeApi(config, evmCtx.logger);

  try {
    const { blockHeight = null } = await nodeApi.getTransaction(hash);
    return blockHeight !== null;
  } catch (e: unknown) {
    const err = e as { name?: string; status?: number } | null | undefined;
    if (err?.name === "LedgerAPI4xx" && err?.status === 404) {
      return false;
    }
    throw e;
  }
};
