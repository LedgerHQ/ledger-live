import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { MoreVertical } from "@ledgerhq/lumen-ui-rnative/symbols";

type Props = Readonly<{
  onPress: () => void;
  accessibilityLabel: string;
  testID: string;
}>;

export function AssetCoinOptionsTrailing({ onPress, accessibilityLabel, testID }: Props) {
  return (
    <IconButton
      appearance="no-background"
      size="md"
      icon={MoreVertical}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
    />
  );
}
