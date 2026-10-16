import type { AccountBridge, BroadcastConfig } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { chainReadsFor } from "./chainReads";
import { openCurrencyPortfolio } from "./networkPortfolio";
import { isPortfolioEnabledFor } from "./portfolio/config";
import { GenericTransaction } from "./types";

/**
 * Broadcasts through the side writing for the currency's chain, with the broadcast config: the
 * local side hands it to the coin module, the portfolio-service drops it.
 */
async function portfolioBroadcast(
  currency: CryptoCurrency,
  signedTransaction: string,
  broadcastConfig: BroadcastConfig | undefined,
): Promise<string> {
  const { portfolio, network } = await openCurrencyPortfolio(currency, "write");
  const { transactionId } = await portfolio.broadcastTransaction(network, {
    signedTransaction,
    ...(broadcastConfig ? { broadcastConfig } : {}),
  });
  return transactionId;
}

export const genericBroadcast: (
  network: string,
  kind: string,
) => AccountBridge<GenericTransaction>["broadcast"] =
  (network, kind) =>
  async ({ signedOperation: { signature, operation }, account, broadcastConfig }) => {
    const { currency } = account;
    const bridgeApi = await getBridgeApi(currency, network);
    if (bridgeApi.validateTransaction) {
      const validation = await bridgeApi.validateTransaction(
        signature,
        await chainReadsFor(currency),
      );
      if (validation.error !== undefined) {
        throw validation.error;
      }
    }
    if (isPortfolioEnabledFor(currency.id)) {
      return patchOperationWithHash(
        operation,
        await portfolioBroadcast(currency, signature, broadcastConfig),
      );
    }
    const coinModuleApi = await getCoinModuleApi(currency.id, kind);
    const hash = await coinModuleApi.broadcast(buildContext(currency.id), signature, {
      broadcastConfig,
    });
    return patchOperationWithHash(operation, hash);
  };
