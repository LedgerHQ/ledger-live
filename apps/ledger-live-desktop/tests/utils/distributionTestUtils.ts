import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { DistributionItem } from "@ledgerhq/types-live";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";

/**
 * Token currency for tests that need a stable `TokenCurrency` with a custom `id` (e.g. slashed ids)
 * when no real asset exists in the catalog.
 */
export function makeIntegrationTokenCurrency(
  id: string,
  ticker: string,
  name: string,
): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: TokenCurrencyIdSchema.parse(id),
    contractAddress: `0x${id.replace(/\//g, "")}`,
    parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
    tokenType: "erc20",
    name,
    ticker,
    units: [{ name, code: ticker, magnitude: 18 }],
  };
}

export function buildDistributionItem(overrides: Partial<DistributionItem> = {}): DistributionItem {
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
