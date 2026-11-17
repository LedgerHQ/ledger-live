import React from "react";
import {
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import type { ReceiveAddressExtrasProps } from "./ReceiveAddressExtras.types";

function NavigationCard({
  title,
  onPress,
  testId,
}: Readonly<{ title: string; onPress: () => void; testId: string }>) {
  return (
    <Card type="interactive" onClick={onPress} data-testid={testId}>
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

/** The cards at the bottom of the screen, each opening its panel. */
export function ReceiveAddressExtras({ memoCard }: ReceiveAddressExtrasProps) {
  if (!memoCard) return null;

  return (
    <div className="flex flex-col gap-8" data-testid="receive-address-extras">
      <NavigationCard
        title={memoCard.title}
        onPress={memoCard.onPress}
        testId="receive-address-memo-card"
      />
    </div>
  );
}
