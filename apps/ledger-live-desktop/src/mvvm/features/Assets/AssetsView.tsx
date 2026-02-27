import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { CategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import { AssetSection } from "./components/AssetsSection";
import { TFunction } from "i18next";

export type AssetsViewProps = {
  readonly isLoading: boolean;
  readonly data?: CategorizedAssets;
  readonly onNavigate: () => void;
  readonly t: TFunction;
};

export const AssetsView = ({ isLoading, data, onNavigate, t }: AssetsViewProps) => {
  if (isLoading || !data) return <Skeleton component="table" />;

  return (
    <div className="flex flex-col gap-32">
      {data.cryptos.length > 0 && (
        <AssetSection
          sectionId="cryptos"
          title={t("assets.cryptos")}
          assets={data.cryptos}
          onNavigate={onNavigate}
        />
      )}
      {data.stablecoins.length > 0 && (
        <AssetSection
          sectionId="stablecoins"
          title={t("assets.stablecoins")}
          assets={data.stablecoins}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
