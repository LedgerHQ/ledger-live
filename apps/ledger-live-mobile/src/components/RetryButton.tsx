import React from "react";
import { TouchableOpacityProps } from "react-native";
import { Trans } from "react-i18next";
import { Button, Text } from "@ledgerhq/native-ui";

export default function RetryButton({
  onPress,
}: Partial<TouchableOpacityProps>) {
  return (
    <Button type="main" onPress={onPress}>
      <Text variant="body" color="neutral.c00" fontSize={5}>
        <Trans i18nKey="common.retry" />
      </Text>
    </Button>
  );
}
