import {
  ASSETS_PAGE_CATEGORY_CRYPTOS,
  ASSETS_PAGE_CATEGORY_QUERY,
  ASSETS_PAGE_CATEGORY_STABLECOINS,
  type AssetsPageCategory,
} from "../constants";

export function buildAssetsPagePath(category: AssetsPageCategory): string {
  const params = new URLSearchParams();
  params.set(ASSETS_PAGE_CATEGORY_QUERY, category);
  return `/assets?${params.toString()}`;
}

export function parseAssetsPageCategory(searchParams: URLSearchParams): AssetsPageCategory {
  const raw = searchParams.get(ASSETS_PAGE_CATEGORY_QUERY);
  if (raw === ASSETS_PAGE_CATEGORY_CRYPTOS) return ASSETS_PAGE_CATEGORY_CRYPTOS;
  return ASSETS_PAGE_CATEGORY_STABLECOINS;
}
