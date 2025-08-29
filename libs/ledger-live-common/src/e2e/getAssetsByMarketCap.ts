import axios from "axios";

import { loadCurrenciesByProvider } from "../deposit/helper";
import {
  extractProviderCurrencies,
  filterProvidersByIds,
  buildProviderCoverageMap,
} from "../modularDrawer/utils/currencyUtils";
import { listAndFilterCurrencies } from "../platform/helpers";
import { setSupportedCurrencies } from "../currencies";

const dadaApiUrl = process.env.DADA_API_URL || "https://dada.api.ledger.com/v1/";

let cachedDadaAssets: string[] | null = null;
let inflightDadaAssets: Promise<string[]> | null = null;

// Initialize supported currencies using the exact same list as the desktop app
function initializeSupportedCurrencies() {
  // This is the same list from apps/ledger-live-desktop/src/live-common-set-supported-currencies.ts
  setSupportedCurrencies([
    "axelar",
    "stargaze",
    "secret_network",
    "umee",
    "desmos",
    "dydx",
    "onomy",
    "sei_network",
    "quicksilver",
    "persistence",
    "avalanche_c_chain",
    "bitcoin",
    "ethereum",
    "bsc",
    "polkadot",
    "solana",
    "solana_testnet",
    "solana_devnet",
    "ripple",
    "litecoin",
    "polygon",
    "bitcoin_cash",
    "stellar",
    "dogecoin",
    "cosmos",
    "crypto_org",
    "crypto_org_croeseid",
    "celo",
    "dash",
    "tron",
    "tezos",
    "elrond",
    "ethereum_classic",
    "zcash",
    "decred",
    "digibyte",
    "algorand",
    "qtum",
    "bitcoin_gold",
    "komodo",
    "zencash",
    "bitcoin_testnet",
    "ethereum_sepolia",
    "ethereum_holesky",
    "hedera",
    "cardano",
    "filecoin",
    "osmosis",
    "fantom",
    "cronos",
    "moonbeam",
    "songbird",
    "flare",
    "near",
    "aptos",
    "aptos_testnet",
    "icon",
    "icon_berlin_testnet",
    "optimism",
    "optimism_sepolia",
    "arbitrum",
    "arbitrum_sepolia",
    "rsk",
    "bittorrent",
    "energy_web",
    "astar",
    "metis",
    "boba",
    "moonriver",
    "velas_evm",
    "syscoin",
    "vechain",
    "internet_computer",
    "klaytn",
    "polygon_zk_evm",
    "polygon_zk_evm_testnet",
    "base",
    "base_sepolia",
    "stacks",
    "telos_evm",
    "sei_network_evm",
    "berachain",
    "hyperevm",
    "canton_network",
    "coreum",
    "injective",
    "casper",
    "neon_evm",
    "lukso",
    "linea",
    "linea_sepolia",
    "blast",
    "blast_sepolia",
    "scroll",
    "scroll_sepolia",
    "ton",
    "etherlink",
    "zksync",
    "zksync_sepolia",
    "mantra",
    "xion",
    "sui",
    "zenrock",
    "sonic",
    "sonic_blaze",
    "mina",
    "babylon",
  ]);
}

type TokenFilterOptions = {
  includeTokens?: boolean;
};

// Tokens that must always appear even if includeTokens === false (same allow-list as UI)
const ALWAYS_ALLOWED_TOKENS = new Set<string>([
  "ethereum/erc20/steth",
  "ethereum/erc20/usd_tether__erc20_",
  "ethereum/erc20/link_chainlink",
  "ethereum/erc20/wrapped_bitcoin",
  "hedera/hts/usd_coin_0.0.456858",
  "solana/spl/usde_dekqhypn7gmrj5cartqfawefqbzb33hyf6s5icwjeont",
]);

function filterOutUnwantedTokens<T extends { id: string; type: string }>(
  list: T[],
  includeTokens: boolean,
): T[] {
  if (includeTokens) return list;
  return list.filter(c => c.type !== "TokenCurrency" || ALWAYS_ALLOWED_TOKENS.has(c.id));
}

// Apply UI display name overrides consistently across both DADA and static modes
function applyNameOverrides(displayName: string): string {
  if (displayName === "Ripple") return "XRP";
  if (displayName === "Binance Smart Chain") return "BNB Chain";
  if (displayName === "USD Coin") return "USDC";
  return displayName;
}

async function fetchAssetsFromDadaApi(): Promise<string[]> {
  if (cachedDadaAssets) return cachedDadaAssets;
  if (inflightDadaAssets) return inflightDadaAssets;

  inflightDadaAssets = (async () => {
    const { data } = await axios.get(`${dadaApiUrl}assets`, {
      params: { pageSize: 100 },
      timeout: 10_000,
    });

    // Extract asset names using the same logic as the UI: metaCurrencyIds → first network id → cryptoOrTokenCurrencies[name]
    const assetNames: string[] = [];
    const seen = new Set<string>();
    if (data?.currenciesOrder?.metaCurrencyIds) {
      for (const currencyId of data.currenciesOrder.metaCurrencyIds) {
        const asset = data.cryptoAssets?.[currencyId];
        if (!asset || !asset.assetsIds || typeof asset.assetsIds !== "object") {
          continue;
        }
        const idValues = Object.values(asset.assetsIds);
        const firstNetworkId = idValues.length > 0 ? idValues[0] : undefined;
        if (typeof firstNetworkId !== "string") {
          continue;
        }
        const currency = data.cryptoOrTokenCurrencies?.[firstNetworkId];
        if (!currency) {
          continue;
        }
        let displayName = currency?.name;

        // Apply specific overrides to match UI expectations
        if (typeof displayName === "string") {
          displayName = applyNameOverrides(displayName);
        }

        if (typeof displayName === "string" && !seen.has(displayName)) {
          seen.add(displayName);
          assetNames.push(displayName);
        }
      }
    }

    cachedDadaAssets = assetNames;
    inflightDadaAssets = null;
    return assetNames;
  })();

  return inflightDadaAssets;
}

async function getStaticCurrencyNames(
  assetIds?: string[],
  { includeTokens = false }: TokenFilterOptions = {},
): Promise<string[]> {
  initializeSupportedCurrencies();

  const filteredCurrencies =
    assetIds && assetIds.length > 0
      ? listAndFilterCurrencies({ currencies: assetIds, includeTokens: true })
      : listAndFilterCurrencies({ includeTokens: true });

  try {
    const result = await loadCurrenciesByProvider(filteredCurrencies);

    const currenciesIdsArray = filteredCurrencies.map(c => c.id);
    const currencyIdsSet = new Set(currenciesIdsArray);

    const providerCoverageMap = buildProviderCoverageMap(result.currenciesByProvider);
    const filteredProviders = filterProvidersByIds(
      result.currenciesByProvider,
      currencyIdsSet,
      providerCoverageMap,
    );

    let extractedCurrencies = extractProviderCurrencies(filteredProviders);

    extractedCurrencies = filterOutUnwantedTokens(extractedCurrencies, includeTokens);

    return extractedCurrencies.map(currency => {
      return applyNameOverrides(currency.name);
    });
  } catch {
    return filteredCurrencies.map(currency => currency.name);
  }
}

// Check if modular drawer backend data feature flag is enabled
function isModularDrawerBackendDataEnabled(): boolean {
  try {
    return process.env.MODULAR_DRAWER_BACKEND_DATA_ENABLED === "true";
  } catch {
    return false;
  }
}

// Main function that mirrors the production logic
export async function getTopAssetsByMarketCap(
  count?: number,
  options: { assetIds?: string[]; includeTokens?: boolean } = {},
): Promise<string[]> {
  const { assetIds, includeTokens = false } = options;
  if (isModularDrawerBackendDataEnabled()) {
    // Use DADA API (remote data)
    const dadaAssets = await fetchAssetsFromDadaApi();
    return count ? dadaAssets.slice(0, count) : dadaAssets;
  } else {
    // Use static countervalues API (local data)
    const staticNames = await getStaticCurrencyNames(assetIds, { includeTokens });
    return count ? staticNames.slice(0, count) : staticNames;
  }
}
