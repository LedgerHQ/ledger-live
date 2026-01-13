import React, { memo } from "react";
import { Tile, TileContent, TileTitle, TileDescription } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "react-i18next";
import MoodArc from "../MoodArc";
import { getMoodColor } from "../../utils/constants";
import type { MoodCardProps } from "../../types";

function MoodCard({ data, onPress }: MoodCardProps) {
  const { t } = useTranslation();
  const { value, label } = data;
  const moodColor = getMoodColor(value);

  return (
    <Tile appearance="card" lx={{ width: "s112" }} onPress={onPress}>
      <MoodArc value={value} />
      <TileContent>
        <TileTitle>{t("portfolio.mood.title")}</TileTitle>
        <TileDescription style={{ color: moodColor }}>{label}</TileDescription>
      </TileContent>
    </Tile>
  );
}

export default memo(MoodCard);
