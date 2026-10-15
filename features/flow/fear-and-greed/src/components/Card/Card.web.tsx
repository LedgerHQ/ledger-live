import React from "react";
import { Tile, TileContent, TileTitle } from "@ledgerhq/lumen-ui-react";
import type { FearAndGreedIndex } from "@domain/entity-market-index-fear-and-greed";
import {
  getFearAndGreedColorKey,
  getFearAndGreedTranslationKey,
  type FearAndGreedColorKey,
} from "../../utils/fearAndGreed";
import { useTranslation } from "@shared/i18n";
import { Indicator } from "../Indicator";
import type { GaugeComponent } from "../../types";

const COLOR_CLASS_MAP: Record<FearAndGreedColorKey, string> = {
  error: "text-error",
  warning: "text-warning",
  success: "text-success",
  muted: "text-muted",
};

type CardProps = Readonly<{
  data: FearAndGreedIndex;
  Gauge: GaugeComponent;
  onPress: () => void;
}>;

export function Card({ data, Gauge, onPress }: CardProps) {
  const { t } = useTranslation();
  const colorKey = getFearAndGreedColorKey(data.value);
  const translationKey = getFearAndGreedTranslationKey(data.value);

  return (
    <Tile
      appearance="card"
      data-testid="fear-and-greed-card"
      className="w-[98px]"
      onClick={onPress}
    >
      <div className="flex h-40 items-center justify-center">
        <Indicator value={data.value} Gauge={Gauge} />
      </div>
      <TileContent>
        <TileTitle>{t("marketBanner.fearAndGreed.title")}</TileTitle>
        <div className={`${COLOR_CLASS_MAP[colorKey]} body-3`}>{t(translationKey)}</div>
      </TileContent>
    </Tile>
  );
}
