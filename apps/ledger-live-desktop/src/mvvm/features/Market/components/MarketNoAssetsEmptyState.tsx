import React from "react";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { CoinsCrypto } from "@ledgerhq/lumen-ui-react/symbols";
import { TFunction } from "i18next";

export function MarketNoAssetsEmptyState({ t }: Readonly<{ t: TFunction }>) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-24"
      data-testid="market-no-assets-empty"
    >
      <Spot appearance="icon" icon={CoinsCrypto} />
      <div className="flex flex-col items-center gap-8 text-center">
        <span className="heading-4-semi-bold text-base">{t("market.assets.noAssets.title")}</span>
        <span className="body-2 text-muted">{t("market.assets.noAssets.description")}</span>
      </div>
    </div>
  );
}
