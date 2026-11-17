import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ReceiveAddressExtrasProps } from "./ReceiveAddressExtras.types";

function NavigationCard({
  title,
  onPress,
  testID,
}: Readonly<{ title: string; onPress: () => void; testID: string }>) {
  return (
    <Card type="interactive" onPress={onPress} testID={testID}>
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <ChevronRight size={20} />
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}

/** The cards at the bottom of the screen, each opening its bottom sheet. */
export function ReceiveAddressExtras({ memoCard, helpCard }: ReceiveAddressExtrasProps) {
  if (!memoCard && !helpCard) return null;

  return (
    <Box lx={{ gap: "s8" }} testID="receive-address-extras">
      {memoCard ? (
        <NavigationCard
          title={memoCard.title}
          onPress={memoCard.onPress}
          testID="receive-address-memo-card"
        />
      ) : null}
      {helpCard ? (
        <NavigationCard
          title={helpCard.title}
          onPress={helpCard.onPress}
          testID="receive-address-help-card"
        />
      ) : null}
    </Box>
  );
}
