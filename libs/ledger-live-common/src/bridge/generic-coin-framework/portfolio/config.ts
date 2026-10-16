import { LiveConfig, type ConfigSchema } from "@ledgerhq/live-config/LiveConfig";
import {
  isPortfolioEnabled,
  portfolioModesFromCoinConfig,
  type Network,
  type PortfolioMode,
} from "@ledgerhq/portfolio-module-framework";
import { getCurrencyConfiguration } from "../../../config";

/** Where the portfolio-service answers, and the portfolio of this wallet there. */
export type PortfolioServiceConfig = { url: string; portfolioId: string };

export const DEFAULT_PORTFOLIO_ID = "ledger-wallet";

/** The portfolio-service of the `remote` and `hybrid` modes, unless the config names another. */
export const DEFAULT_PORTFOLIO_SERVICE_URL = "https://portfolio-service.api.ledger-test.com";

/**
 * An empty url turns the service off: chains in `remote` or `hybrid` mode fail with UNAVAILABLE
 * wherever they need it.
 */
export const portfolioServiceConfig: ConfigSchema = {
  config_portfolio_service: {
    type: "object",
    default: {
      url: DEFAULT_PORTFOLIO_SERVICE_URL,
      portfolioId: DEFAULT_PORTFOLIO_ID,
    } satisfies PortfolioServiceConfig,
  },
};

export function readPortfolioServiceConfig(): PortfolioServiceConfig {
  const value = LiveConfig.getValueByKey("config_portfolio_service") as
    | Partial<PortfolioServiceConfig>
    | undefined;
  return {
    url: typeof value?.url === "string" ? value.url : DEFAULT_PORTFOLIO_SERVICE_URL,
    portfolioId:
      typeof value?.portfolioId === "string" && value.portfolioId
        ? value.portfolioId
        : DEFAULT_PORTFOLIO_ID,
  };
}

/** Ledger Wallet currency ids the portfolio-service names otherwise. */
const SERVICE_NETWORKS: Record<string, Network> = { ripple: "xrp" };

export const networkOf = (currencyId: string): Network =>
  SERVICE_NETWORKS[currencyId] ?? currencyId;

export const currencyIdOf = (network: Network): string =>
  Object.keys(SERVICE_NETWORKS).find(currencyId => SERVICE_NETWORKS[currencyId] === network) ??
  network;

/**
 * Whether the coin config of a currency (`config_currency_<id>`) serves its accounts through the
 * portfolio layer (`portfolio.enabled`); otherwise, and when it has no config, the legacy bridge.
 */
export function isPortfolioEnabledFor(currencyId: string): boolean {
  try {
    return isPortfolioEnabled(getCurrencyConfiguration(currencyId));
  } catch {
    return false;
  }
}

/** The `portfolio.mode` of a network's coin config; `local` when unset. */
export const portfolioModeOf = portfolioModesFromCoinConfig(network =>
  getCurrencyConfiguration(currencyIdOf(network)),
);

/** The mode of a currency whose coin config enables the portfolio layer; undefined otherwise. */
export async function portfolioModeFor(currencyId: string): Promise<PortfolioMode | undefined> {
  return isPortfolioEnabledFor(currencyId) ? portfolioModeOf(networkOf(currencyId)) : undefined;
}
