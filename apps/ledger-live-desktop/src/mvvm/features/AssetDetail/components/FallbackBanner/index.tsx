import React from "react";
import { Banner } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { useTradeAvailability } from "@ledgerhq/asset-detail";

type FallbackBannerProps = Readonly<{
  ledgerIds: readonly string[];
  showSkeleton: boolean;
}>;

export function FallbackBanner({ ledgerIds, showSkeleton }: FallbackBannerProps) {
  const { t } = useTranslation();
  const { availableOnBuy, availableOnSwap, isCurrencySupported, isResolved } =
    useTradeAvailability(ledgerIds);

  if (showSkeleton || !isResolved || !isCurrencySupported) return null;
  if (availableOnBuy || availableOnSwap) return null;

  return (
    <Banner
      appearance="info"
      title={t("assetDetails.fallbackBanner.title")}
      data-testid="asset-detail-fallback-banner"
    />
  );
}
