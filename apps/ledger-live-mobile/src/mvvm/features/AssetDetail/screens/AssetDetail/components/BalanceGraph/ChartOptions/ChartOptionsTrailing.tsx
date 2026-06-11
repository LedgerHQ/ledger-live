import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { SettingsAlt2 } from "@ledgerhq/lumen-ui-rnative/symbols";

type Props = Readonly<{
  onPress: () => void;
  accessibilityLabel: string;
  testID: string;
}>;

export function ChartOptionsTrailing({ onPress, accessibilityLabel, testID }: Props) {
  return (
    <IconButton
      appearance="no-background"
      size="xs"
      icon={SettingsAlt2}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
    />
  );
}
