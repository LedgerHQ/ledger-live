import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentRow,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { PnlCardProps } from "./types";
import { usePnlCardViewModel } from "./usePnlCardViewModel";

export function PnlCard(props: Readonly<PnlCardProps>) {
  const {
    shouldRender,
    title,
    displayedValue,
    cardType,
    showInfoIcon,
    showChevron,
    TrendIcon,
    trendColor,
    onPress,
    testID,
  } = usePnlCardViewModel(props);

  if (!shouldRender) return null;

  return (
    <Card type={cardType} onPress={onPress} testID={testID}>
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentRow lx={{ gap: "s4" }}>
              <CardContentDescription>{title}</CardContentDescription>
              {showInfoIcon ? <Information size={16} color="muted" /> : null}
            </CardContentRow>
            <CardContentRow lx={{ gap: "s4" }}>
              {TrendIcon ? <TrendIcon size={16} color={trendColor} /> : null}
              <CardContentTitle>{displayedValue}</CardContentTitle>
            </CardContentRow>
          </CardContent>
        </CardLeading>
        {showChevron ? (
          <CardTrailing>
            <ChevronRight size={20} color="muted" />
          </CardTrailing>
        ) : null}
      </CardHeader>
    </Card>
  );
}
