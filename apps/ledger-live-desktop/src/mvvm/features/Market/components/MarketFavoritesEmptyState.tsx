import React from "react";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { StarFill } from "@ledgerhq/lumen-ui-react/symbols";
import { TFunction } from "i18next";

export function MarketFavoritesEmptyState({ t }: Readonly<{ t: TFunction }>) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-24"
      data-testid="market-favorites-empty"
    >
      <Spot appearance="icon" icon={StarFill} />
      <span className="heading-4-semi-bold text-base text-center">
        {t("market.assets.emptyFavorites")}
      </span>
    </div>
  );
}
