import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCategorizedAssetsFromPortfolio } from "LLD/hooks/useCategorizedAssets";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { AssetsViewProps, AssetTableItem } from "../types";
import { useSelector } from "LLD/hooks/redux";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import { useAccountStatus } from "LLD/hooks/useAccountStatus";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { EMPTY_STATE_CRYPTOS, EMPTY_STATE_STABLECOINS, MAX_ITEM_DISPLAYED } from "../constants";

// @FIXME workaround for main tokens & also until we have asset aggregation
export function resolveMarketId(id: string): string {
  if (!id.includes(":")) return id;
  const lastSegment = id.split(":").pop();
  return lastSegment?.replaceAll("_", "-") ?? id;
}

const toPlaceholderItem = (
  currency: CryptoOrTokenCurrency,
  marketId: string,
  price?: number,
): AssetTableItem => ({
  currency,
  balance: 0,
  value: 0,
  distribution: 0,
  accounts: [],
  isPlaceholder: true,
  placeholderPrice: price,
  marketId,
});

export function padItems(
  realItems: AssetTableItem[],
  defaults: AssetTableItem[],
  targetCount: number,
): AssetTableItem[] {
  if (realItems.length >= targetCount) return realItems;
  const ownedIds = new Set(realItems.map(item => item.currency.id));
  return [
    ...realItems,
    ...defaults.filter(d => !ownedIds.has(d.currency.id)).slice(0, targetCount - realItems.length),
  ];
}

export function useAssetsViewModel(): AssetsViewProps {
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { hasAccount } = useAccountStatus();
  const isEmptyState = !hasOnboardedDevice || !hasAccount;

  const { categorizedAssets, isLoadingStablecoinTickers, stablecoinTickers } =
    useCategorizedAssetsFromPortfolio();

  const needsPadding =
    isEmptyState ||
    categorizedAssets.cryptos.length < EMPTY_STATE_CRYPTOS ||
    categorizedAssets.stablecoins.length < EMPTY_STATE_STABLECOINS;

  const { data: assetsData, isLoading: isLoadingAssetsData } = useAssetsData({
    product: "lld",
    version: __APP_VERSION__,
    skip: !needsPadding,
  });

  const navigate = useNavigate();
  const { t } = useTranslation();

  const onNavigate = useCallback(() => {
    navigate("/assets");
  }, [navigate]);

  const onItemClick = useCallback(
    (item: AssetTableItem) => {
      setTrackingSource("asset allocation");
      navigate(
        item.isPlaceholder
          ? `/market/${encodeURIComponent(resolveMarketId(item.marketId ?? item.currency.id))}`
          : `/asset/${item.currency.id}`,
      );
    },
    [navigate],
  );

  const resolvedDefaults = useMemo(() => {
    if (!assetsData) return { cryptos: [], stablecoins: [] };

    const cryptos: AssetTableItem[] = [];
    const stablecoins: AssetTableItem[] = [];

    for (const id of assetsData.currenciesOrder.metaCurrencyIds) {
      const currency = selectCurrencyForMetaId(id, assetsData);
      if (!currency) continue;

      const ticker = assetsData.cryptoAssets[id]?.ticker?.toUpperCase() ?? "";
      const { price, id: marketId } = assetsData.markets?.[currency.id] ?? {};
      const item = toPlaceholderItem(currency, marketId ?? id, price);

      if (stablecoinTickers.has(ticker)) {
        stablecoins.push(item);
      } else {
        cryptos.push(item);
      }
    }

    return { cryptos, stablecoins };
  }, [assetsData, stablecoinTickers]);

  const sections = useMemo(() => {
    const toRealItems = (items: typeof categorizedAssets.cryptos): AssetTableItem[] =>
      isEmptyState
        ? []
        : items.slice(0, MAX_ITEM_DISPLAYED).map(item => ({ ...item, isPlaceholder: false }));

    const realCryptos = toRealItems(categorizedAssets.cryptos);
    const realStablecoins = toRealItems(categorizedAssets.stablecoins);

    const paddedCryptos = padItems(realCryptos, resolvedDefaults.cryptos, EMPTY_STATE_CRYPTOS);
    const paddedStablecoins = padItems(
      realStablecoins,
      resolvedDefaults.stablecoins,
      EMPTY_STATE_STABLECOINS,
    );

    return [
      {
        sectionId: "cryptos",
        title: t("assets.cryptos"),
        items: paddedCryptos,
        totalCount: isEmptyState ? paddedCryptos.length : categorizedAssets.cryptos.length,
        onNavigate,
        onItemClick,
      },
      {
        sectionId: "stablecoins",
        title: t("assets.stablecoins"),
        items: paddedStablecoins,
        totalCount: isEmptyState ? paddedStablecoins.length : categorizedAssets.stablecoins.length,
        onNavigate,
        onItemClick,
      },
    ];
  }, [isEmptyState, categorizedAssets, resolvedDefaults, onNavigate, onItemClick, t]);

  return {
    isLoading: needsPadding
      ? isLoadingAssetsData || isLoadingStablecoinTickers
      : isLoadingStablecoinTickers,
    sections,
  };
}
