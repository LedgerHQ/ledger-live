import React, { memo } from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-react";
import type { FearAndGreedIndex } from "@domain/entity-market-index-fear-and-greed";
import { useTranslation } from "@shared/i18n";
import { getFearAndGreedTranslationKey } from "../../utils/fearAndGreed";
import { Indicator } from "../Indicator";
import type { GaugeComponent } from "../../types";

type ExpandedCardProps = Readonly<{
  data: FearAndGreedIndex;
  Gauge: GaugeComponent;
  onPress: () => void;
}>;

function ExpandedCardComponent({ data, Gauge, onPress }: ExpandedCardProps) {
  const { t } = useTranslation();

  return (
    <Card type="interactive" onClick={onPress} data-testid="mood-index-card">
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>
              <span className="body-3">{t("market.topCards.moodIndex.title")}</span>
            </CardContentTitle>
            <CardContentDescription>
              <span className="body-1-semi-bold text-base">
                {t(getFearAndGreedTranslationKey(data.value))}
              </span>
            </CardContentDescription>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <Indicator value={data.value} Gauge={Gauge} />
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}

export const ExpandedCard = memo(ExpandedCardComponent);
