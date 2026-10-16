import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import {
  openNetworkPortfolio,
  type NetworkPortfolio,
  type PortfolioPurpose,
} from "./portfolio/network";

/**
 * The portfolio layer of a portfolio-enabled currency, for a network-level call: wired on Ledger
 * Wallet's coin module of the currency, the account module and catalog lookups of its family.
 * Resolving them is wiring; every call then goes through the portfolio.
 */
export async function openCurrencyPortfolio(
  currency: CryptoCurrency,
  purpose: PortfolioPurpose,
): Promise<NetworkPortfolio> {
  const [coinModuleApi, bridgeApi] = await Promise.all([
    getCoinModuleApi(currency.id, "local"),
    getBridgeApi(currency, currency.family),
  ]);
  return openNetworkPortfolio(
    currency,
    {
      binding: bridgeApi.accountModule,
      coinModuleApi,
      context: buildContext(currency.id),
      bridgeApi,
    },
    purpose,
  );
}
