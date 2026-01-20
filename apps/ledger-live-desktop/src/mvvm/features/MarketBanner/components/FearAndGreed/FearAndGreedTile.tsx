import React from "react";
import type { FearAndGreedIndex } from "@ledgerhq/live-common/cmc-client/state-manager/types";
import {
  getFearAndGreedColorKey,
  getFearAndGreedTranslationKey,
} from "@ledgerhq/live-common/cmc-client/utils/fearAndGreed";
import { Tile, TileContent, TileTitle } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { GradientMoodIndicator } from "./GradientMoodIndicator";

const COLOR_CLASS_MAP: Record<string, string> = {
  error: "text-error",
  warning: "text-warning",
  success: "text-success",
  muted: "text-muted",
};

export const FearAndGreedTile = ({ data }: { data: FearAndGreedIndex }) => {
  const { t } = useTranslation();

  const colorKey = getFearAndGreedColorKey(data.value);
  const translationKey = getFearAndGreedTranslationKey(data.value);
  const textColorClass = COLOR_CLASS_MAP[colorKey] || "text-muted";

  return (
    <Tile
      appearance="card"
      data-testid="fear-and-greed-card"
      className="w-[98px] justify-center self-stretch"
    >
      <GradientMoodIndicator value={data.value} />
      <TileContent>
        <TileTitle>{t("marketBanner.fearAndGreed.title")}</TileTitle>
      </TileContent>
      <div className={`${textColorClass} body-2-semi-bold`}>{t(translationKey)}</div>
    </Tile>
  );
};
