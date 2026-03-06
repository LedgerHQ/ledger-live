import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "~/context/Locale";

export default function OnboardScreen() {
  return (
    <Flex flex={1} alignItems="center" justifyContent="center">
      <Text variant="h4">
        <Trans i18nKey="concordium.onboard.title" />
      </Text>
    </Flex>
  );
}
