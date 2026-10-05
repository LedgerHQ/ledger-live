import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { useBackupsButtonViewModel } from "./useBackupsButtonViewModel";

type BackupsButtonViewProps = ReturnType<typeof useBackupsButtonViewModel>;

export function BackupsButtonView({
  title,
  description,
  icon,
  onPress,
}: Readonly<BackupsButtonViewProps>) {
  return (
    <Card
      type="interactive"
      onPress={onPress}
      testID="my-wallet-backups-button"
      accessibilityLabel={title}
    >
      <CardHeader>
        <CardLeading>
          <Spot appearance="icon" icon={icon} size={48} />
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
            <CardContentDescription>{description}</CardContentDescription>
          </CardContent>
        </CardLeading>
      </CardHeader>
    </Card>
  );
}
