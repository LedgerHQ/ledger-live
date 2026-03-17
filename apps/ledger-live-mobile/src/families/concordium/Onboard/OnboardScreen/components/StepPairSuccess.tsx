import React from "react";
import { Alert, Button, Flex, Text } from "@ledgerhq/native-ui";
import { Trans } from "~/context/Locale";

type Props = Readonly<{
  onContinue: () => void;
}>;

export default function StepPairSuccess({ onContinue }: Props) {
  return (
    <Flex flex={1} justifyContent="space-between">
      <Flex alignItems="center" px={4} pt={6}>
        <Text variant="h5" fontWeight="semiBold" mb={6}>
          <Trans i18nKey="concordium.onboard.pair.title" />
        </Text>
        <Alert type="success">
          <Text>
            <Trans i18nKey="concordium.onboard.pair.success" />
          </Text>
        </Alert>
      </Flex>
      <Flex px={6} pb={10}>
        <Button type="main" onPress={onContinue}>
          <Trans i18nKey="concordium.onboard.pair.continue" />
        </Button>
      </Flex>
    </Flex>
  );
}
