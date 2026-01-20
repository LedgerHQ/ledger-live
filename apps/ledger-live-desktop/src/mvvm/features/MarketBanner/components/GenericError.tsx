import React from "react";
import { useTranslation } from "react-i18next";
import { Tile, TileSpot, TileContent, TileTitle } from "@ledgerhq/lumen-ui-react";
import { Warning } from "@ledgerhq/lumen-ui-react/symbols";

const GenericError = () => {
  const { t } = useTranslation();

  return (
    <Tile data-testid="generic-error">
      <TileSpot appearance="icon" icon={Warning} />
      <TileContent>
        <TileTitle>{t("marketBanner.genericError")}</TileTitle>
      </TileContent>
    </Tile>
  );
};

export default GenericError;
