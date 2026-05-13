import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { DistributionItem } from "@ledgerhq/types-live";

/**
 * Token currency for tests that need a stable `TokenCurrency` with a custom `id` (e.g. slashed ids)
 * when no real asset exists in the catalog.
 */
export function makeIntegrationTokenCurrency(
  id: string,
  ticker: string,
  name: string,
): TokenCurrency {
  const parentCurrency = getCryptoCurrencyById("ethereum");
  return {
    type: "TokenCurrency",
    id,
    contractAddress: `0x${id.replace(/\//g, "")}`,
    parentCurrency,
    tokenType: "erc20",
    name,
    ticker,
    units: [{ name, code: ticker, magnitude: 18 }],
  };
}

export function buildDistributionItem(
  overrides: Partial<DistributionItem> = {},
): DistributionItem {
  return {
    currency: getCryptoCurrencyById("bitcoin"),
    amount: 0,
    distribution: 0,
    accounts: [],
    ...overrides,
  };
}

export function setupDistributionRouteMocks(
  useParamsMock: jest.Mock,
  useDistributionMock: jest.Mock,
  routeAssetId: string,
  distribution: {
    bySlug?: Record<string, DistributionItem>;
    list: DistributionItem[];
    isLoading?: boolean;
  },
): void {
  useParamsMock.mockReturnValue({ "*": routeAssetId });
  useDistributionMock.mockReturnValue({
    bySlug: distribution.bySlug ?? {},
    list: distribution.list,
    isLoading: distribution.isLoading ?? false,
  });
}
