import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import { Tile, TileSpot, TileTitle, TileContent } from "@ledgerhq/lumen-ui-react";
import { useNavigate } from "react-router";

export const ViewAllTile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goToMarket = useCallback(() => {
    navigate(`/market`);
  }, [navigate]);

  return (
    <Tile
      className="w-[98px] [&>button]:h-full [&>button]:justify-center"
      appearance="card"
      onClick={goToMarket}
      data-testid="market-banner-view-all"
    >
      <TileSpot appearance="icon" icon={ChevronRight} size={40} />
      <TileContent>
        <TileTitle>{t("marketBanner.cta")}</TileTitle>
      </TileContent>
    </Tile>
  );
};
