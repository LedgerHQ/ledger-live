import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "~/context/Locale";

export default function StepCreate() {
  return (
    <Flex flex={1} alignItems="center" justifyContent="center">
      <Text variant="h4">
        <Trans i18nKey="concordium.onboard.create.title" />
      </Text>
    </Flex>
  );
}
