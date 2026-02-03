import React from "react";
import { Tile, TileSpot, TileContent, TileTitle } from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { ViewAllTileProps } from "../../types";

const ViewAllTile = ({ onPress }: ViewAllTileProps) => {
  const { t } = useTranslation();

  return (
    <Tile
      onPress={onPress}
      testID="market-banner-view-all"
      appearance="card"
      centered
      lx={{ width: "s96", flexGrow: 1 }}
      accessibilityLabel={t("marketBanner.viewAll")}
      accessibilityHint={t("marketBanner.viewAllAccessibilityHint")}
    >
      <TileSpot size={40} appearance="icon" icon={ChevronRight} />
      <TileContent>
        <TileTitle>{t("marketBanner.viewAll")}</TileTitle>
      </TileContent>
    </Tile>
  );
};

export default React.memo(ViewAllTile);
