import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CardLeading,
  CardTrailing,
  Text,
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
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
              <Text typography="body3" lx={{ color: "muted" }}>
                {title}
              </Text>
              {showInfoIcon ? <Information size={16} color="muted" /> : null}
            </Box>
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
              {TrendIcon ? <TrendIcon size={16} color={trendColor} /> : null}
              <Text typography="body2SemiBold" lx={{ color: "base" }}>
                {displayedValue}
              </Text>
            </Box>
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
