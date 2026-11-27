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

export function ReceiveAddressExtras({ memoCard, helpCard }: ReceiveAddressExtrasProps) {
  return (
    <Box lx={{ gap: "s8" }} testID="receive-address-extras">
      {memoCard ? (
        <NavigationCard
          title={memoCard.title}
          onPress={memoCard.onPress}
          testID="receive-address-memo-card"
        />
      ) : null}
      <NavigationCard
        title={helpCard.title}
        onPress={helpCard.onPress}
        testID="receive-address-help-card"
      />
    </Box>
  );
}
